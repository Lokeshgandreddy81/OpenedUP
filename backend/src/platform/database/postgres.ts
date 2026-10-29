import { Pool, type PoolClient, type QueryResult } from "pg";
import { AsyncLocalStorage } from "node:async_hooks";
import { supabaseRootCa } from "./supabaseCa.js";

export interface SqlExecutor {
  query<Row extends object = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[]
  ): Promise<QueryResult<Row>>;
}

let pool: Pool | undefined;
const transactionClient = new AsyncLocalStorage<{ client: PoolClient; nextSavepoint: number }>();

/**
 * One small pool per warm Vercel instance. Supabase's shared transaction pooler
 * multiplexes these short-lived function connections; no session state is relied on.
 */
export function getPostgresPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env["DATABASE_URL"]?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to use the Supabase Postgres database.");
  }

  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URI.");
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the postgres:// or postgresql:// scheme.");
  }

  pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    ssl: {
      ca: process.env["DATABASE_SSL_CA"]?.trim() || supabaseRootCa,
      rejectUnauthorized: true,
    },
  });
  pool.on("error", (error) => {
    // Pool errors can occur while a serverless instance is idle; keep the process
    // alive and let the next query obtain a fresh connection.
    process.emitWarning(`Postgres pool error: ${error.message}`);
  });
  return pool;
}

function postgresPlaceholders(sql: string): string {
  let output = "";
  let parameterIndex = 0;
  let singleQuoted = false;
  let doubleQuoted = false;
  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index]!;
    if (character === "'" && !doubleQuoted) {
      output += character;
      if (singleQuoted && sql[index + 1] === "'") {
        output += sql[index + 1]!;
        index += 1;
      } else {
        singleQuoted = !singleQuoted;
      }
      continue;
    }
    if (character === '"' && !singleQuoted) {
      output += character;
      if (doubleQuoted && sql[index + 1] === '"') {
        output += sql[index + 1]!;
        index += 1;
      } else {
        doubleQuoted = !doubleQuoted;
      }
      continue;
    }
    if (character === "?" && !singleQuoted && !doubleQuoted) {
      parameterIndex += 1;
      output += `$${parameterIndex}`;
    } else {
      output += character;
    }
  }
  if (singleQuoted || doubleQuoted) throw new Error("Unterminated SQL quoted value.");
  return output;
}

export async function queryPostgres<Row extends object = Record<string, unknown>>(
  sql: string,
  values: readonly unknown[] = [],
  executor: SqlExecutor = getPostgresPool()
): Promise<QueryResult<Row>> {
  return (transactionClient.getStore()?.client ?? executor).query<Row>(
    postgresPlaceholders(sql),
    [...values]
  );
}

export async function withPostgresTransaction<T>(
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const nested = transactionClient.getStore();
  if (nested) {
    const savepoint = `nested_${nested.nextSavepoint++}`;
    await nested.client.query(`SAVEPOINT ${savepoint}`);
    try {
      const result = await transactionClient.run(nested, () => operation(nested.client));
      await nested.client.query(`RELEASE SAVEPOINT ${savepoint}`);
      return result;
    } catch (error) {
      await nested.client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      await nested.client.query(`RELEASE SAVEPOINT ${savepoint}`);
      throw error;
    }
  }

  const client = await getPostgresPool().connect();
  try {
    await client.query("BEGIN");
    const result = await transactionClient.run({ client, nextSavepoint: 0 }, () => operation(client));
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original database error.
    }
    throw error;
  } finally {
    client.release();
  }
}

export function closePostgresPool(): Promise<void> {
  const activePool = pool;
  pool = undefined;
  return activePool?.end() ?? Promise.resolve();
}
