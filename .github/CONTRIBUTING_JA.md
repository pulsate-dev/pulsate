# Contribute Guide

Pulsate Project への貢献に関するガイド.

[English Version](../CONTRIBUTING.md)

- [Issues](#issues)
- [Pull Requests](#pull-requests)
  - [レビュー](#レビュー)
- [コミットメッセージ](#コミットメッセージ)
- [開発環境](#開発環境)
  - [Node.js のバージョン固定・インストール](#nodejs-のバージョン固定インストール)
  - [パッケージのインストール](#パッケージのインストール)
  - [Prisma Client の生成と更新](#prisma-client-の生成と更新)
- [スタイルガイド](#スタイルガイド)
  - [TypeScript](#typescript)
    - [命名規則](#命名規則)
    - [null と undefined](#null-と-undefined)
    - [any と unknown](#any-と-unknown)
    - [引用符](#引用符)
    - [配列](#配列)
- [データベーススキーマのマイグレーション](#データベーススキーマのマイグレーション)
  - [マイグレーションファイルの作成](#マイグレーションファイルの作成)
    - [SQL マイグレーションファイルの作成に関する推奨事項](#sql-マイグレーションファイルの作成に関する推奨事項)
  - [マイグレーションの適用](#マイグレーションの適用)
  - [マイグレーションのロールバック](#マイグレーションのロールバック)

**コントリビュートの前に**: 全てのコントリビューターとメンテナは [行動規範](https://github.com/pulsate-dev/.github/blob/main/CODE_OF_CONDUCT_JA.md) に従う必要があります.

## Issues

Pulsate では以下のような Issue を受け付けています:

- [バグ報告](https://github.com/pulsate-dev/pulsate/issues/new?assignees=&labels=bug&projects=&template=bug_report.yml)
- [新機能リクエスト](https://github.com/pulsate-dev/pulsate/issues/new?assignees=&labels=feature&projects=&template=feature_request.yml)

これらの Issue はフォームに記入して送信することで提出できます.

もし提出したい Issue の種類がここにない場合は [こちら](https://github.com/pulsate-dev/pulsate/issues/new) から空の Issue を提出できます.

Issue を提出する際は以下の点を確認してください:

- すでに同じ Issue が提出されていないか確認する.
  - [こちら](https://github.com/pulsate-dev/pulsate/issues?q=) から確認できます.
- (バグ報告の場合) セキュリティ関連の不具合ではないか確認する.
  - このようなバグ報告を提出する場合は, **Issueではなく, 適切な方法で提出しなければなりません**. 詳細は[セキュリティポリシー](./SECURITY_JA.md)を確認してください.

## Pull Requests

Pulsateはプルリクエストの提出を歓迎します.

Pulsateにプルリクエストを提出するには, **なぜこの変更が必要なのか**・**変更の概要**を明確にする必要があります.

プルリクエストを提出しようとすると, あらかじめ用意されたテンプレートがプレースホルダとして表示されます. テンプレートに従って提出するプルリクエストを記述してください.

プルリクエストを提出する前に, 以下の点を確認してください：

- あなたが提出しようとしているプルリクエストと同じ変更のプルリクエストが提出されていないか確認する.
  - [こちら](https://github.com/pulsate-dev/pulsate/pulls?q=)から確認してください.
- まだ完了していないプルリクエストを提出しようとしていないか.
  - 進行中のPRを投稿したい場合は, ["Draft" として投稿してください](https://docs.github.com/ja/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/changing-the-stage-of-a-pull-request).
- プルリクエストのタイトルは[Conventional Commits](#コミットメッセージ)に準拠してください.

完了次第 `deno fmt` を実行してコードを整形してください.

Pulsate メンテナーのレビューと承認が得られれば, マージできます.

### レビュー

レビュー中は, 以下のことに留意してください.

- メンテナからの質問に答える.
  - レビュー中, メンテナからの変更点についての質問があれば答えてください. これはレビューに役に立ちます.

## コミットメッセージ

Pulsateコミットメッセージは[Conventional commit](https://www.conventionalcommits.org/ja/v1.0.0/)に従わなければなりません.

コミットメッセージは以下の形式でなければなりません.

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

- `type` は変更に対応する正しい `type` でなければなりません.
  - 例えば, **新しい新機能の追加** は `feat`, **バグの修正** は `fix` です.
- 後方互換性を破壊するような変更を行う場合は, `scope` を `!` に設定し, `body` に破壊的な変更についての説明を追加しなければなりません.
  - 破壊的変更が必要な場合はまず Issue または Discussion でメンテナに連絡してください. **ほとんどの場合, そのような変更は望まれていません**.

## 開発環境

Pulsate は以下のような開発環境を想定しています.

- [Node.js](https://nodejs.org) v20.x
- [Pnpm (pnpm)](https://pnpm.io/ja/) v8.x

### Node.js のバージョン固定・インストール

Pulsate で開発するためには, 事前に以下のようなツールを使用して Node.js のバージョンを固定する必要があります.

- [mise](https://mise.jdx.dev/) (推奨)
  - asdf と互換性を持つバージョン管理ツールです. 何か不都合がない限りは mise を使用することを推奨します.
- [asdf](https://asdf-vm.com/)
  - `.tool-versions` ファイルにより, asdf で Node.js のバージョンを固定することもできます.

> [!WARNING]
> Pulsate の必要動作環境である Node.js v20.x 以外のバージョンを使用している場合は互換性維持のため `pnpm run` などのコマンドが利用できません. バージョンを固定してから開発に取り組んでください.

mise を使用する場合の手順は以下の通りです:

1. mise をインストールします. 詳しくは [mise のインストールガイド](https://mise.jdx.dev/getting-started.html) を参照してください.
2. **Pulsate のルートディレクトリ上** で `mise install` を実行します.
3. `node --version` を実行して, Node.js のバージョンが `20.x` 系統であることを確認してください.

### パッケージのインストール

Pulsate は [pnpm](https://pnpm.io/ja/) を使用してパッケージを管理しています. 以下のコマンドを実行してパッケージをインストールしてください.

```sh
# pnpm が有効になって居ない場合:
corepack enable pnpm
pnpm install
```

### Prisma Client の生成と更新

定義された Prisma schema から Prisma Client を生成するには以下のコマンドを実行します. (本来は `prepare` スクリプトで定義されているため依存関係の更新時に自動で実行されます.)

```sh
pnpm build:prisma
```

このコマンドを実行すると `node_modules/.prisma/client` に Prisma Client が生成されます. 使用する際はここからインポートする形になります.

モデルなどを変更した場合は再度このコマンドを実行することで Prisma Client を更新できます.

## スタイルガイド

Pulsate開発のためのスタイルガイド.

- これらの設定は Prettier, ESLint, .editorconfig によって統一されています.
  - エディタやIDEによっては, 特別なプラグインをインストールする必要があります.
  - 詳細は[こちら](https://editorconfig.org/#download)をクリックしてください.

---

- すべてのファイルは, 行末のスペースを削除しなければなりません.
  - Markdownの場合, 改行も意味するので削除する必要はありません.
- すべてのファイルの最後には改行を1行入れなければなりません.
- すべてのファイルは `space` インテントで開いてください.
  - インテントのサイズは約 `2` 文字です.
- 改行には `LF` を使用してください.
- 文字エンコーディングには `utf-8` を使用してください.

### TypeScript

基本的な命名規則は[TypeScript Coding guidelines](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)に従っています.

アクロニムや短縮形の複合語は1語と数えます. 例えば `UUID` では `Uuid` を. `HTTPS` では `Https` とします.

`X_CONTENT` など単語が1文字になるケースでは `_` を除いて `XCONTENT` とします.

また, `camelCase` を使うべき状況でも1語として数えます. 例えばアカウントIDを表す変数名は `accountId` とします.

#### 命名規則

- 変数名と関数名は `camelCase`.
- クラス名は `PascalCase`.
  - クラスメンバ名とメソッド名は `camelCase`.
- インタフェース名は `PascalCase`.
  - インタフェースメンバ名は `camelCase`.
- 列挙型の名前とメンバは `PascalCase`.
- 型名は `PascalCase`.
  - 型メンバ名は `camelCase`.
- 名前空間名は `PascalCase`.

- ファイル名は `camelCase` で作成する必要があります.

#### null と undefined

Pulsate では `mini-fn` と呼ばれる関数型プログラミングライブラリを使用しています.

`mini-fn` には `Option<T>` という直和型があり, `T | undefined` にすべきか, `T | null` にすべきかを考える必要はありません.

その直和型を扱うための専用関数が用意されているため, `null` や `undefined` を扱う場合は代わりに `Option` や `Result` を使用します.

```ts
/* 型ガード. TypeScript がコードの分岐で型を確定させるために必要. */

// この状態の `res` は `Option<Account>` という型で値が存在するかどうかが確定していない.
const res = await this.accountRepository.findByName(name);
// `res` に値が存在するか型ガードで確定させる. 存在しなければエラー.
if (Option.isNone(res)) {
  return Result.err(new Error('account not found'));
}
// `res` を `account` として確定.
const account = Option.unwrap(res);
```

値が存在しない可能性があるプロパティを定義する必要がある場合. `null`, `undefined` どちらも使用せず, `?` を使用します.

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

#### any と unknown

`any` は使用せず, `unknown` を使用します.

`any` が返ってくる型付けの API を使用する場合は, 即座に `unknown` に型アサーションしてください.

```ts
// Good
const foo = 'apple' as unknown

// Bad
const foo = 'apple' as any
```

#### 引用符

文字列にはシングルクォートを使用してください.

```ts
// Good
const a = 'hoge';

// Bad
const a = "hoge";
```

#### 配列

配列を宣言する際には, 可読性を確保するためにアノテーションを使用してください.

```ts
// Good
const a: string[]

// Bad
const a: Array<string>
```

## データベーススキーマのマイグレーション

Pulsate では [goose](https://github.com/pressly/goose) を使ってデータベーススキーマを移行しています. goose は現在スキーマを変更しているかどうかにかかわらず, インストールする必要があります. インストール手順については, [Installation](https://github.com/pressly/goose#install) ガイドを参照してください.

### マイグレーションファイルの作成

すべてのマイグレーションファイルは `resources/db` ディレクトリの下に保存する必要があります.
新しいマイグレーションファイルを作成するには以下の手順に従ってください.

```bash
cd resources/db
goose create add_some_column sql
```

マイグレーション・ファイルを作成したら次のように書いてください:

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

`-- +goose <Up/Down>` は必須です.

#### SQL マイグレーションファイルの作成に関する推奨事項

できるだけ `.env` ファイルにデータベース認証情報を含めてください. 詳細については, [Goose のドキュメント](https://github.com/pressly/goose) を参照してください.

Goose は `go` という拡張子のマイグレーションファイルを作成しますが, これを `sql` に変更する必要があります.

### マイグレーションの適用

以下はマイグレーションを適用する方法です.

```bash
cd resources/db
goose up
```

### マイグレーションのロールバック

以下はマイグレーションを1世代前に戻す方法です.

```bash
cd resources/db
goose down
```
