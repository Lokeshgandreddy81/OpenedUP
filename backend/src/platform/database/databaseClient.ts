import { AsyncLocalStorage } from "node:async_hooks";
import type { Database as BetterSqliteDatabase } from "better-sqlite3";
import { queryPostgres, withPostgresTransaction } from "./postgres.js";
import { getChatDatabase as getSqliteDatabase } from "./chatDatabase.js";

export interface DatabaseResult {
  changes: number;
}

export type DatabaseTransaction<T> = (() => Promise<T>) & {
  immediate: () => Promise<T>;
};

export interface DatabaseClient {
  prepare(sql: string): {
    all<Row extends object = Record<string, unknown>>(...values: unknown[]): Promise<Row[]>;
    get<Row extends object = Record<string, unknown>>(...values: unknown[]): Promise<Row | undefined>;
    run(...values: unknown[]): Promise<DatabaseResult>;
  };
  all<Row extends object = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[]
  ): Promise<Row[]>;
  get<Row extends object = Record<string, unknown>>(
    sql: string,
    values?: readonly unknown[]
  ): Promise<Row | undefined>;
  run(sql: string, values?: readonly unknown[]): Promise<DatabaseResult>;
  transaction<T>(operation: (database: DatabaseClient) => Promise<T>): DatabaseTransaction<T>;
}

class AsyncMutex {
  private tail = Promise.resolve();

  async run<T>(operation: () => Promise<T> | T): Promise<T> {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }
}

function createSqliteClient(database: BetterSqliteDatabase): DatabaseClient {
  const mutex = new AsyncMutex();
  const transactionContext = new AsyncLocalStorage<{ nextSavepoint: number }>();
  const execute = <T>(operation: () => T): Promise<T> =>
    transactionContext.getStore() ? Promise.resolve(operation()) : mutex.run(operation);

  const client: DatabaseClient = {
    prepare(sql) {
      return {
        all: (...values) => client.all(sql, values),
        get: (...values) => client.get(sql, values),
        run: (...values) => client.run(sql, values),
      };
    },
    all: <Row extends object = Record<string, unknown>>(sql: string, values: readonly unknown[] = []) =>
      execute(() => database.prepare(sql).all(...values) as unknown as Row[]),
    get: <Row extends object = Record<string, unknown>>(sql: string, values: readonly unknown[] = []) =>
      execute(() => database.prepare(sql).get(...values) as unknown as Row | undefined),
    run: (sql, values = []) =>
      execute(() => ({ changes: database.prepare(sql).run(...values).changes })),
    transaction: (operation) => {
      const run = () => {
        const context = transactionContext.getStore();
        if (context) {
          const savepoint = `nested_${context.nextSavepoint++}`;
          database.exec(`SAVEPOINT ${savepoint}`);
          return transactionContext.run(context, async () => {
            try {
              const result = await operation(client);
              database.exec(`RELEASE SAVEPOINT ${savepoint}`);
              return result;
            } catch (error) {
              database.exec(`ROLLBACK TO SAVEPOINT ${savepoint}`);
              database.exec(`RELEASE SAVEPOINT ${savepoint}`);
              throw error;
            }
          });
        }
        return mutex.run(async () => {
          database.exec("BEGIN IMMEDIATE");
          try {
            const result = await transactionContext.run({ nextSavepoint: 0 }, () => operation(client));
            database.exec("COMMIT");
            return result;
          } catch (error) {
            database.exec("ROLLBACK");
            throw error;
          }
        });
      };
      return Object.assign(run, { immediate: run });
    },
  };
  return client;
}

export function adaptSqliteDatabase(database: BetterSqliteDatabase): DatabaseClient {
  return createSqliteClient(database);
}

function createPostgresClient(): DatabaseClient {
  const client: DatabaseClient = {
    prepare(sql) {
      return {
        all: (...values) => client.all(sql, values),
        get: (...values) => client.get(sql, values),
        run: (...values) => client.run(sql, values),
      };
    },
    all: async <Row extends object = Record<string, unknown>>(
      sql: string,
      values: readonly unknown[] = []
    ): Promise<Row[]> => (await queryPostgres<Row>(sql, values)).rows,
    get: async <Row extends object = Record<string, unknown>>(
      sql: string,
      values: readonly unknown[] = []
    ): Promise<Row | undefined> => (await queryPostgres<Row>(sql, values)).rows[0],
    run: async (sql, values = []) => ({
      changes: (await queryPostgres(sql, values)).rowCount ?? 0,
    }),
    transaction: (operation) => {
      const run = () => withPostgresTransaction(async () => operation(client));
      return Object.assign(run, { immediate: run });
    },
  };
  return client;
}

let client: DatabaseClient | undefined;

/** One repository-facing async interface with local SQLite and production Postgres drivers. */
export function getDatabaseClient(): DatabaseClient {
  if (client) return client;
  if (process.env["DATABASE_URL"]?.trim()) {
    client = createPostgresClient();
  } else if (process.env["VERCEL"] === "1" || process.env["NODE_ENV"] === "production") {
    throw new Error("DATABASE_URL is required for persistent production storage.");
  } else {
    client = createSqliteClient(getSqliteDatabase());
  }
  return client;
}

export function resetDatabaseClientForTests(): void {
  client = undefined;
}

export function asDatabaseClient(
  input?: DatabaseClient | BetterSqliteDatabase
): DatabaseClient {
  if (!input) return getDatabaseClient();
  if ("all" in input && typeof input.all === "function") return input as DatabaseClient;
  return createSqliteClient(input as BetterSqliteDatabase);
}
