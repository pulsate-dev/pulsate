# Contribute Guide

A guide on how to participate in this project.

[日本語版](./.github/CONTRIBUTING_JA.md)

- [Issues](#issues)
- [Pull Requests](#pull-requests)
  - [Review](#review)
- [Commit Message](#commit-message)
- [Development Environment](#development-environment)
  - [Fixing and installing the Node.js version](#fixing-and-installing-the-nodejs-version)
  - [Install the package](#install-the-package)
  - [Generate and update Prisma Client](#generate-and-update-prisma-client)
- [Style Guide](#style-guide)
  - [TypeScript](#typescript)
    - [null and undefined](#null-and-undefined)
    - [any and unknown](#any-and-unknown)
    - [Quote marks](#quote-marks)
    - [Arrays](#arrays)
- [Database Schema Migration](#database-schema-migration)
  - [Creating a New Migration File](#creating-a-new-migration-file)
    - [Recommendations for Creating SQL Migration Files](#recommendations-for-creating-sql-migration-files)
  - [Applying migration](#applying-migration)
  - [Rolling back a migration](#rolling-back-a-migration)

**Before "Contribution"**: All Contributors and Maintainers are required to follow the [Code of Conduct](https://github.com/pulsate-dev/.github?tab=coc-ov-file).

## Issues

Pulsate accepts the following issues:

- [Bug reports](https://github.com/pulsate-dev/pulsate/issues/new?assignees=&labels=bug&projects=&template=bug_report.yml)
- [Feature requests](https://github.com/pulsate-dev/pulsate/issues/new?assignees=&labels=feature&projects=&template=feature_request.yml)

These issues can be submitted by filling out the form.

If the issue type you wish to submit is not listed here, you can submit an empty issue [here](https://github.com/pulsate-dev/pulsate/issues/new).

Please check the following points before submission.

- Similar issues have not already been submitted.
  - Click [here](https://github.com/pulsate-dev/pulsate/issues?q=) to check.
- (Bug report only) Is it not a security-related bug?
  - If you are submitting such a bug report, you must submit it in an appropriate manner, **not as an Issue**. Please check our [security policy](./SECURITY.md) for details.

## Pull Requests

Pulsate welcomes pull request submissions.

To submit a pull request to Pulsate, you need to clarify **why this change is needed**, **summary of changes**.

When you try to submit a pull request, a pre-prepared template will be displayed as a placeholder. Follow the template to describe the pull request you are submitting.

Before submitting a pull request, please check the following points:

- Check to see if the pull request you are submitting is the same as the one you are submitting.
  - Click [here](https://github.com/pulsate-dev/pulsate/pulls?q=) to check.
- You are not trying to submit a PR that is still in progress.
  - If you want to submit a PR in progress, [please submit it as "Draft"](https://docs.github.com/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/changing-the-stage-of-a-pull-request).
- Pull request title conforms to [Conventional Commits](#commit-message)

After finishing, please run `pnpm format` to format the code. (If you are using VSCode, it will be formatted automatically.)

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

## Development Environment

Pulsate assumes the following development environment.

- [Node.js](https://nodejs.org) v20.x
- [Pnpm (pnpm)](https://pnpm.io/ja/) v8.x

### Fixing and installing the Node.js version

In order to develop with Pulsate, you need to fix the version of Node.js using the following tools.

- [mise](https://mise.jdx.dev/) (recommended)
  - This is a version control tool compatible with asdf. It is recommended to use mise unless there is some inconvenience.
- [asdf](https://asdf-vm.com/)
  - With `.tool-versions` file, you can also fix the version of Node.js with asdf.

> [!WARNING]
> If you are using a version of Node.js other than v20.x, which is the required environment for Pulsate, commands such as `pnpm run` will not be available to maintain compatibility. Please fix your version before starting development.

To use mise, follow these steps:

1. Install mise. See [mise installation guide](https://mise.jdx.dev/getting-started.html) for details.
2. Run `mise install` in the **Pulsate root directory**.
3. Run `node --version` and make sure your Node.js version is `20.x`.

### Install the package

Pulsate uses [pnpm](https://pnpm.io/ja/) to manage packages. Run the following command to install the package.

```sh
# If pnpm is not enabled:

corepack enable pnpm
pnpm install
```

### Generate and update Prisma Client

To generate a Prisma Client from a defined Prisma schema, execute the following command. (Originally defined in the `prepare` script, this is done automatically when updating dependencies.)

```sh
pnpm build:prisma
```

This command will create a Prisma Client in `node_modules/.prisma/client`. You can import the client from here when you want to use it.

If you change the model, you can update the Prisma Client by running this command again.

## Style Guide

A style guide for Pulsate development.

- These settings are bound by Prettier, ESLint, .editorconfig.
  - Some editors and IDEs require special plug-ins to be installed.
  - For more details, click [here](https://editorconfig.org/#download).

---

- All files must have spaces at the end of lines removed.
  - In the case of Markdown, it is not necessary to remove it because it also means a line break.
- All files must have a single newline at the end.
- All files should be opened with `space` intent.
  - The size of the intent is about `2` characters.
- Use `lf` for line breaks.
- Use `utf-8` character encoding.

### TypeScript

The basic naming conventions follow the [TypeScript Coding guidelines](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines).

Acronyms and contractions of compound words are counted as one word. For example, for `UUUID`, use `Uuid`. For `HTTPS`, use `Https`.

In cases where the word is a single character, such as `X_CONTENT`, the `_` is omitted and `XCONTENT` is used.

Also, in situations where `camelCase` should be used, it is counted as a single word. For example, the name of a variable representing an account ID is `accountId`.

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
  - Use `lowercase` for a single word.

#### null and undefined

Pulsate uses a functional programming library called `mini-fn`.

`mini-fn` has a direct sum type `Option<T>`, so you don't have to think whether the type should be `T | undefined` or `T | null`.

There is a dedicated function to handle the direct sum type, so you can use `Option` or `Result` instead if you want to handle `null` or `undefined` types.

```ts
/* Type Guard. Required for TypeScript to determine the type at code branches. */

// The `res` in this state is of type `Option<Account>` and it is not determined whether the value exists or not.
const res = await this.accountRepository.findByName(name);
// Check whether the value `res` exists or not by type guarding. If not, it is an error.
if (Option.isNone(res)) {
  return Result.err(new Error('account not found'));
}
// Fix `res` as `account`.
const account = Option.unwrap(res);
```

If you need to define a property whose value may not exist. Do not use `null` or `undefined`, but use `?`.

```ts
// Good
interface Foo {
  x?: string;
}

// Bad
interface Foo {
  x: string | undefined;
  y: string | null;
}
```

#### any and unknown

Do not use `any`, use `unknown`.

If you use an API with typing that returns `any`, immediately make a type assertion to `unknown`.

```ts
// Good
const foo = 'apple' as unknown

// Bad
const foo = 'apple' as any
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
