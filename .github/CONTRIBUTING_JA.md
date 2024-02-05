# Contribute Guide

Pulsate Project への貢献に関するガイド.

[English Version](../CONTRIBUTING.md)

- [Issues](#issues)
- [Pull Requests](#pull-requests)
  - [レビュー](#レビュー)
- [コミットメッセージ](#コミットメッセージ)
- [Deno](#deno)
  - [依存関係の追加](#依存関係の追加)
- [スタイルガイド](#スタイルガイド)
  - [TypeScript](#typescript)
    - [null と undefined](#null-と-undefined)
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
  - このようなバグ報告を提出する場合は, **Issueではなく, 適切な方法で提出しなければなりません**. 詳細は[セキュリティポリシー](./SECURITY.md)を確認してください.

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
  - 例えば, **新しい新機能の追加** は `feat`, **\*バグの修正** は `fix` です.
- 後方互換性を破壊するような変更を行う場合は, `scope` を `!` に設定し, `body` に破壊的な変更についての説明を追加しなければなりません.
  - 破壊的変更が必要な場合はまず Issue または Discussion でメンテナに連絡してください. **ほとんどの場合, そのような変更は望まれていません**.

## Deno

### 依存関係の追加

Denoの依存関係を追加するにはimport_mapsを使用してください. **ソースコードに直接 URL は追加しないでください**.

import_maps は `deno.jsonc` の `imports` に直接 URL を挿入することで定義できます.

```json
"imports": {
  "std/assert": "https://deno.land/std@0.205.0/assert/mod.ts",
  "hono": "https://deno.land/x/hono@v3.8.2/mod.ts",
  "mini-fn": "npm:@mikuroxina/mini-fn"
}
```

実際のソースコードに`imports`のキーを入れることで依存関係を使うことができます.

```ts
import { Hono } from 'hono';

import { accounts } from './pkg/accounts/mod.ts';

const app = new Hono();

app.route('/accounts', accounts);

Deno.serve({ port: 3000 }, app.fetch);
```

## スタイルガイド

Pulsate開発のためのスタイルガイド.

- これらの設定は deno fmt,.editorconfigによって統一されています.
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

可能であれば, `null` も `undefined` も使わないでください.

```ts
// Good
let foo: { x: number, y?: number } = { x: 123 };

// Bad
let foo = { x: 123, y: undefined };
```

何らかの理由により使用しないといけない・使用を回避できない場合は `undefined` を使用してください.

**`null` は絶対に使用しないでください.**

```ts
// Good
return undefined;

// Bad
return null;
const a = "apple" as any;
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
