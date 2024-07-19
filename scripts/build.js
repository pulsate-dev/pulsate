import fs from 'node:fs/promises';
import esbuild from 'esbuild';
import * as glob from 'glob';
import ignore from 'ignore';
import kleur from 'kleur';

const ctrl = {
  error: (msg) => {
    console.log(`${kleur.bold(`${kleur.red('Error')}:`)} ${msg}`);
    process.exit(1);
  },

  built: (msg) => {
    console.log(`${kleur.bold(`${kleur.green('Built')}:`)} ${msg}`);
  },

  fail: (msg) => {
    console.log(`${kleur.bold(`${kleur.red('Fail ')}:`)} ${msg}`);
  },
};

const { include, exclude } = await fs
  .readFile('tsconfig.json')
  .then((b) => JSON.parse(b.toString()))
  .then((o) => {
    if (typeof o !== 'object') {
      ctrl.error("root of tsconfig.json isn't object");
    }

    if (
      !o.include ||
      !Array.isArray(o.include) ||
      !o.include.every((e) => typeof e === 'string')
    ) {
      ctrl.error(".include of tsconfig.json isn't satisfy `string[]");
    }

    if (
      !o.exclude ||
      !Array.isArray(o.exclude) ||
      !o.exclude.every((e) => typeof e === 'string')
    ) {
      ctrl.error(".exclude of tsconfig.json isn't satisfy `string[]`");
    }

    return {
      include: o.include,
      exclude: o.exclude,
    };
  });

const ignorer = ignore().add(exclude);

glob.stream(include).on('data', async (p) => {
  if (ignorer.test(p).ignored) {
    return;
  }

  const r = await esbuild
    .build({
      entryPoints: [p],
      platform: 'node',
      outbase: '.',
      outdir: 'build',
      sourcemap: 'external',
    })
    .catch(() => ctrl.fail(p));

  !r || ctrl.built(p);
});
