import { appendFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import pacote from 'pacote';

const REGISTRY = 'https://registry.npmjs.org';
const packageDir = fileURLToPath(
  new URL('../resources/api-schema/', import.meta.url),
);

const githubOutput = process.env.GITHUB_OUTPUT;
if (!githubOutput) {
  throw new Error('GITHUB_OUTPUT is not set');
}
const writeOutput = (key: string, value: string): void => {
  appendFileSync(githubOutput, `${key}=${value}\n`);
};

const pkg = JSON.parse(readFileSync(`${packageDir}package.json`, 'utf-8'));

let latestVersion: string | undefined;
try {
  const manifest = await pacote.manifest(pkg.name, { registry: REGISTRY });
  latestVersion = manifest.version;
} catch (error) {
  // Only a 404 means the package has never been published; anything else
  // (network failure, registry outage, auth error) must fail the job loudly
  // instead of silently being treated as "first publish".
  if ((error as { code?: string }).code !== 'E404') {
    throw error;
  }
  latestVersion = undefined;
}

if (!latestVersion) {
  writeOutput('changed', 'true');
  writeOutput('latest_version', '');
  process.exit(0);
}

const workDir = mkdtempSync(`${tmpdir()}/api-schema-previous-`);
try {
  await pacote.extract(`${pkg.name}@${latestVersion}`, workDir, {
    registry: REGISTRY,
  });

  const previousSchema = readFileSync(`${workDir}/schema.json`);
  const currentSchema = readFileSync(`${packageDir}schema.json`);
  const changed = !previousSchema.equals(currentSchema);

  writeOutput('changed', String(changed));
  writeOutput('latest_version', latestVersion);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
