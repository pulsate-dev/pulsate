# @pulsate-dev/api-schema

This package distributes the OpenAPI schema (`schema.json`) generated from the
[Pulsate](https://github.com/pulsate-dev/pulsate) API definitions.

It is intended to be consumed by API client generators (e.g. for
[pulsate-api-types](https://github.com/pulsate-dev/pulsate-api-types)) so
that downstream projects can reference the latest API schema without manually
copying the generated JSON file.

## Usage

```sh
npm install @pulsate-dev/api-schema
```

```ts
import schema from '@pulsate-dev/api-schema/schema.json' with { type: 'json' };
```

## Versioning

- `major`/`minor` are bumped manually by maintainers when the API schema
  contains breaking changes.
- `patch` is bumped automatically by CI whenever the generated schema
  changes.

## Publishing

This package is published automatically by
[`.github/workflows/publish-api-schema.yaml`](../../.github/workflows/publish-api-schema.yaml)
to the public npm registry. The schema is regenerated on every pull request
and published only when it differs from the latest published version.
Changes are never committed back to the repository.

Publishing uses npm's
[Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC): the
workflow authenticates to npm using a short-lived token issued by GitHub
Actions, so no long-lived `NPM_TOKEN` is stored as a repository secret. Each
published version also carries
[npm provenance](https://docs.npmjs.com/generating-provenance-statements) and
a GitHub [build provenance attestation](https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds),
which let consumers verify the package was built from this exact workflow run
(e.g. via `npm audit signatures` or `gh attestation verify`).

Because forked pull requests run with read-only GitHub Actions permissions,
the OIDC token required to publish is unavailable to them, so this workflow
cannot publish from an untrusted fork.

### One-time setup (maintainers)

Before this workflow can publish, a maintainer must configure a
[Trusted Publisher](https://docs.npmjs.com/trusted-publishers) for
`@pulsate-dev/api-schema` on npmjs.com, pointing at:

- Repository: `pulsate-dev/pulsate`
- Workflow file: `.github/workflows/publish-api-schema.yaml`

If the package does not exist on npm yet, publish an initial version manually
(`npm publish --otp=...` from a maintainer's authenticated machine, with 2FA)
before wiring up the trusted publisher, since npm requires the package to
already exist to attach a trusted publisher to it.
