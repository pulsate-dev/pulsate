# Contribute Guide

A guide on how to participate in this project.

- [Issues](#issues)
- [Pull Requests](#pull-requests)
  - [Review](#review)
- [Commit Message](#commit-message)
- [Deno](#deno)
  - [How to add dependencies](#how-to-add-dependencies)
- [Style Guide](#style-guide)
  - [TypeScript](#typescript)
    - [null and undefined](#null-and-undefined)
    - [Quote marks](#quote-marks)
    - [Arrays](#arrays)
- [Database Schema Migration](#database-schema-migration)
  - [Creating a New Migration File](#creating-a-new-migration-file)
    - [Recommendations for Creating SQL Migration Files](#recommendations-for-creating-sql-migration-files)
  - [Applying migration](#applying-migration)
  - [Rolling back a migration](#rolling-back-a-migration)

**Before "Contribution"**: All Contributors and Maintainers are required to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Issues

Pulsate accepts the following issues:

- [Bug reports](https://github.com/approvers/pulsate/issues/new?assignees=&labels=bug&projects=&template=bug_report.yml)
- [Feature requests](https://github.com/approvers/pulsate/issues/new?assignees=&labels=feature&projects=&template=feature_request.yml)

These issues can be submitted by filling out the form.

If the issue type you wish to submit is not listed here, you can submit an empty issue [here](https://github.com/approvers/pulsate/issues/new).

Please check the following points before submission.

- Similar issues have not already been submitted.
  - Click [here](https://github.com/approvers/pulsate/issues?q=) to check.
- (Bug report only) Is it not a security-related bug?
  - If you are submitting such a bug report, you must submit it in an appropriate manner, **not as an Issue**. Please check our [security policy](./SECURITY.md) for details.

## Pull Requests

Pulsate welcomes pull request submissions.

To submit a pull request to Pulsate, you need to clarify **why this change is needed**, **summary of changes**.

When you try to submit a pull request, a pre-prepared template will be displayed as a placeholder. Follow the template to describe the pull request you are submitting.

Before submitting a pull request, please check the following points:

- Check to see if the pull request you are submitting is the same as the one you are submitting.
  - Click [here](https://github.com/approvers/pulsate/pulls?q=) to check.
- You are not trying to submit a PR that is still in progress.
  - If you want to submit a PR in progress, [please submit it as "Draft"](https://docs.github.com/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/changing-the-stage-of-a-pull-request).
- Pull request title conforms to [Conventional Commits](#commit-message)

If you are sure, run "deno fmt" to format the code.

Once it has been reviewed and approved by the Pulsate maintainer, it can be merged.

### Review

During the review, keep the following in mind.

- Answer questions from the maintainer.
  - Reply to any questions about changes from the maintainer during the review. This will be helpful during the review.

## Commit Message

Pulsate commit messages must follow [conventional commit](https://www.conventionalcommits.org/ja/v1.0.0/).

- The commit message should be in the following form.

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

- The `type` must be the correct "type" for the change.
  - For example, **Add new feature** is `feat`, **Fix bug** is `fix`.
- If you make any backward-compatibility-breaking changes, you must set `scope` to `!` and add a description of the destructive change to `body`.
  - Please contact the maintainer via Issue or Discussion once you make such a change. In most cases, such changes are not desired.

## Deno

### How to add dependencies

Use import_maps to add Deno dependencies. **DO NOT** add URLs directly to the source code.

Import_maps can be used by inserting the URL directly into `imports` of `deno.jsonc`.

```json
"imports": {
  "std/assert": "https://deno.land/std@0.205.0/assert/mod.ts",
  "hono": "https://deno.land/x/hono@v3.8.2/mod.ts",
  "mini-fn": "npm:@mikuroxina/mini-fn"
}
```

You can use dependencies by putting the key of `imports` in the actual source code.

```ts
import { Hono } from 'hono';
import { accounts } from './pkg/accounts/mod.ts';

const app = new Hono();

app.route('/accounts', accounts);

Deno.serve({ port: 3000 }, app.fetch);
```

## Style Guide

A style guide for Pulsate development.

- These settings are bound by deno fmt, .editorconfig.
  - Some editors and IDEs require special plug-ins to be installed.
  - For more details, click [here](https://editorconfig.org/#download).

----

- All files must have spaces at the end of lines removed.
  - In the case of Markdown, it is not necessary to remove it because it also means a line break.
- All files must have a single newline at the end.
- All files should be opened with `space` intent.
  - The size of the intent is about `2` characters.
- Use `lf` for line breaks.
- Use `utf-8` character encoding.

### TypeScript

The basic naming conventions follow the [TypeScript Coding guidelines](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines).

- The variable and function name is `camelCase`.
- The class name is `PascalCase`.
  - The class member and method name is `camelCase`.
- The interface name is `PascalCase`.
  - The interface member name is `camelCase`.
- The enum name and member is `PascalCase`.
- The type name is `PascalCase`.
  - The type member name is `camelCase`.
- The namespace name is `PascalCase`.

- The file name should be in `camelCase`.

#### null and undefined

Do not use either null or undefined if possible.

```ts
// Good
let foo: { x: number, y?: number } = { x: 123 };

// Bad
let foo = { x: 123, y: undefined };
```

Use undefined if it must be used or its use cannot be avoided for some reason.

**DO NOT** use null.

```ts
// Good
return undefined;

// Bad
return null;
const a = "apple" as any;
```

#### Quote marks

Use single quotes for strings.

```ts
// Good
const a = 'hoge';

// Bad
const a = "hoge";
```

#### Arrays

Use annotations when declaring arrays to ensure readability.

```ts
// Good
const a: string[]

// Bad
const a: Array<string>
```

## Database Schema Migration

We migrate our database schema using [goose](https://github.com/pressly/goose). It should be installed whether or not you are currently modifying the schema. For installation instructions, see the [Installation](https://github.com/pressly/goose#install) guide.

### Creating a New Migration File

All migration files should be saved under the `resources/db` directory.  
Follow the steps below to create a new migration file.

```bash
cd resources/db
goose create add_some_column sql
```

Once the migration file is created, write the following:

```sql
-- +goose Up
CREATE TABLE IF NOT EXISTS account (
	id VARCHAR(255) PRIMARY KEY,
	name VARCHAR(128) NOT NULL,
	nickname VARCHAR(255),
	mail VARCHAR(128),
	passphrase_hash VARCHAR(255),
	bio TEXT NOT NULL DEFAULT '',
	role INT NOT NULL DEFAULT 0,
	status INT NOT NULL DEFAULT 0,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) DEFAULT NULL,
	deleted_at DATETIME(6) DEFAULT NULL
);
-- +goose Down
DROP TABLE IF EXISTS account;
```

`-- +goose <Up/Down>` is required.

#### Recommendations for Creating SQL Migration Files

We recommend to include database credentials in the `.env` file as possible. For more information, see the Goose documentation. Note that Goose will create a `go` migration file with the extension, but you need to change it to `sql`.

### Applying migration

Here is how to apply a migration

```bash
cd resources/db
goose up
```

### Rolling back a migration

Here is how to roll back a migration one generation

```bash
cd resources/db
goose down
```
 