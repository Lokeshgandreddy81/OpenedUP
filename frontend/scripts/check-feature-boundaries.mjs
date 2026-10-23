import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const frontendRoot = path.resolve("frontend");
const sourceRoot = path.join(frontendRoot, "src");
const featuresRoot = path.join(sourceRoot, "features");
const configPath = path.join(frontendRoot, "tsconfig.json");
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
if (configFile.error) {
  globalThis.console.error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
  process.exit(1);
}
const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, frontendRoot);

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(entryPath) : /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

function featureAt(filePath) {
  const relative = path.relative(featuresRoot, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return relative.split(path.sep)[0];
}

const violations = [];
for (const containingFile of filesUnder(featuresRoot)) {
  const sourceFeature = featureAt(containingFile);
  const source = ts.createSourceFile(
    containingFile,
    fs.readFileSync(containingFile, "utf8"),
    ts.ScriptTarget.Latest,
    true
  );
  const specifiers = [];
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);

  for (const specifier of specifiers) {
    const resolved = ts.resolveModuleName(
      specifier,
      containingFile,
      parsedConfig.options,
      ts.sys
    ).resolvedModule?.resolvedFileName;
    if (!resolved) continue;
    const targetFeature = featureAt(resolved);
    if (!targetFeature || targetFeature === sourceFeature) continue;
    const entryName = path.basename(resolved);
    if (entryName === "index.ts" || entryName === "index.tsx" || entryName === "publicApi.ts")
      continue;
    violations.push(
      `${path.relative(process.cwd(), containingFile)} imports private ${targetFeature} module ${specifier}`
    );
  }
}

if (violations.length > 0) {
  globalThis.console.error("Cross-feature imports must use the target feature's index.ts or publicApi.ts:");
  for (const violation of violations) globalThis.console.error(`- ${violation}`);
  process.exit(1);
}
globalThis.console.log("Feature import boundaries are valid.");
