import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packageDir = fileURLToPath(
  new URL('../resources/api-schema/', import.meta.url),
);

const githubOutput = process.env.GITHUB_OUTPUT;
if (!githubOutput) {
  throw new Error('GITHUB_OUTPUT is not set');
}

const pkg = JSON.parse(readFileSync(`${packageDir}package.json`, 'utf-8'));
const [baseMajor, baseMinor] = pkg.version.split('.');

// Only a plain `major.minor.patch` release (no pre-release/build suffix) can
// be used to continue the patch sequence; `npm view ... version` normally
// only ever returns the latest non-prerelease dist-tag, but fail loudly
// instead of computing a bogus version like "0.1.NaN" if that ever changes.
const latestVersion = process.env.LATEST_VERSION ?? '';
const latestVersionMatch = latestVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
if (latestVersion !== '' && !latestVersionMatch) {
  throw new Error(
    `LATEST_VERSION "${latestVersion}" is not a plain major.minor.patch release`,
  );
}
const [, latestMajor, latestMinor, latestPatch] = latestVersionMatch ?? [];

const nextPatch =
  latestVersionMatch && latestMajor === baseMajor && latestMinor === baseMinor
    ? Number(latestPatch) + 1
    : 0;
const nextVersion = `${baseMajor}.${baseMinor}.${nextPatch}`;

execFileSync(
  'npm',
  ['version', nextVersion, '--no-git-tag-version', '--allow-same-version'],
  { cwd: packageDir, stdio: 'inherit' },
);

appendFileSync(githubOutput, `version=${nextVersion}\n`);
