# Note取得に認可scopeを適用する実装方針

## 背景と目的

[#1438](https://github.com/pulsate-dev/pulsate/issues/1438)の対象である `GET /v0/notes/:id` に、閲覧者と公開範囲に基づく認可を導入する。
[#1933](https://github.com/pulsate-dev/pulsate/issues/1933)を解決した[#1938](https://github.com/pulsate-dev/pulsate/pull/1938)の共通基盤を利用し、共通Policyの再設計は行わない。
上位の移行方針は[認可処理の統一計画](608-unify-authorization-policy.md)を参照する。

本書は実装計画であり、実装開始の承認や検証完了を示すものではない。
2026年11月22日時点の実装調査と、次のユーザー判断を反映している。

- 投稿者情報は既存のレスポンス項目を維持する。
  `avatar` と `header` は空文字列、`followed_count` と `following_count` は0のままとする。
  #1438本文の「4項目のみ」とは異なるため、受け入れ確認ではこの差を明示する。
- 有効なフォローは現行モデルに合わせ、閲覧者から投稿者への、削除されていない関係とする。
  DBの未使用の `state` 列に新たな意味を割り当てない。
- 今回限定のDB統合テストを新設する案は採用しない。
  DBでの検証方法は未決事項に残し、InMemoryのテストで代替できたとは扱わない。

## 受け入れ条件

1. Handlerが認証Middlewareの結果から `Principal<AccountID>` を生成し、匿名も含めてNotesのread Policyに渡す。
2. 閲覧条件は次の表に従う。
   削除済みNoteと凍結済み投稿者のNoteは、公開範囲にかかわらず拒否する。

   | 公開範囲    | 匿名 | 投稿者本人 | 有効なフォロワー | その他の認証済み閲覧者 |
   | ----------- | ---- | ---------- | ---------------- | ---------------------- |
   | `PUBLIC`    | 許可 | 許可       | 許可             | 許可                   |
   | `HOME`      | 許可 | 許可       | 許可             | 許可                   |
   | `FOLLOWERS` | 拒否 | 許可       | 許可             | 拒否                   |
   | `DIRECT`    | 拒否 | 拒否       | 拒否             | 拒否                   |

3. 閲覧者の凍結、有効化状態、サイレンス状態による追加制限や、管理者バイパスを設けない。
4. 未存在、削除済み、投稿者凍結、閲覧不可はいずれも404と `{"error":"NOTE_NOT_FOUND"}` を返す。
   DB障害などの実行エラーを未存在に変換しない。
5. GET用の本文、添付、リアクション取得は、Policyだけが発行できるNote IDとPrincipalに結び付いたscopeを必須とする。
   Policy拒否時は、保護対象の取得処理へ進まない。
6. PrismaとInMemoryの両実装で、保護対象の取得時にも親Noteの閲覧条件を適用する。
   削除済みの添付、Medium、リアクションを返さない。
7. 投稿者情報は公開プロフィールを明示的に組み立て、メールアドレスや認証情報などを返さない。
   前述の合意に従い、既存の空文字列と0の項目を維持する。
8. Renote状態は認証済み閲覧者本人の状態とし、匿名ではfalseとする。
9. Timeline、Reaction、Bookmark、作成、Renote、イベント処理の既存呼び出しとの互換性を保つ。
10. メディアURLとサムネイルの発行経路を確認し、Storage/CDNへの直接アクセスについて確認できた範囲と未検証範囲を記録する。
    DBで未検証の条件も明記し、未実行を成功として扱わない。

## 対象範囲と対象外

変更対象は、GETのHandler、Controller、取得Service、Notesのread ActionとPolicy、scope、GET専用Repository契約とその両実装、依存注入、関連テストである。
認可仕様と投稿API仕様の追従も実装タスクに含める。

全モジュールの認可移行、Timelineの閲覧条件変更、フォロー申請制、DBスキーマ変更、新しいライブラリの導入、Storage/CDNの配信認可の実装は対象外とする。
ダイレクト投稿は既に `DirectNote` と専用Repositoryへ分離されており、その取得APIや送受信者の認可も対象外とする。
閲覧表の `DIRECT` 拒否は、通常の `NoteVisibility` とPrismaのNote復元処理に残っている値への防御的な扱いである。
通常GETからDirectNote用Repositoryを検索したり、本人や宛先であれば返す分岐を追加したりしない。
既存の内部取得メソッドを一律にscope必須へ変更しない。
内部取得の認可上の課題が見つかった場合は別対応として記録し、本GET経路からの迂回だけは今回防ぐ。

## 現状と制約

### 確認済みの実装

| 対象                                               | 確認した状態                                                                                                 | 今回の対応                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `pkg/internal/policy/principal.ts`                 | 認証済みアカウントと匿名を表すUnion型がある                                                                  | そのまま利用する                                            |
| `pkg/internal/policy/policy.ts`                    | 4引数の同期 `authorize` と、成功値を指定できる `Policy`、値オブジェクトの `PolicyAction` がある              | 成功値を `NoteReadScope` として利用する                     |
| `pkg/notes/handler/notes.ts`                       | GETは任意認証で、Controllerに閲覧者IDのOptionを渡す                                                          | HandlerでPrincipalへ変換する                                |
| `pkg/notes/adaptor/controller/note.ts`             | 本文、投稿者、添付、リアクション、Renote状態を順に取得する                                                   | GET専用の認可済み取得Serviceへ集約する                      |
| 同Controllerの未存在処理                           | 汎用 `Error` を返すが、Handlerは `NoteNotFoundError` のみ404へ対応付ける                                     | GET専用経路でエラー型を統一する                             |
| `pkg/notes/service/fetch.ts`                       | 単体取得に閲覧者引数がなく、Noteの削除と投稿者凍結のみを確認する                                             | 内部用途を維持し、GET専用経路を分離する                     |
| `pkg/notes/model/repository.ts`                    | 本文と関連データの取得はIDだけで呼べる                                                                       | 新設するGET専用契約にscopeを要求する                        |
| `pkg/notes/adaptor/repository/prisma/note.ts`      | 添付は関連行の削除を除外するがMediumの削除や親Noteの閲覧条件を適用しない。リアクションも親の条件を適用しない | GET専用クエリに親の条件と関連データの削除条件を加える       |
| 同Prisma実装の `findByID`                          | 例外をすべてOptionの不在へ変換する                                                                           | 判定材料とGET専用取得では障害をResultで返す                 |
| 同Prisma実装の `fetchRenoteStatus`                 | 障害時もfalseを返す                                                                                          | GET専用経路では障害とfalseを区別する                        |
| `pkg/notes/adaptor/repository/dummy.ts`            | 添付とリアクションは親Noteや投稿者を参照しない。削除状態を持たない関連データもある                           | GET専用実装に共有データへの参照と削除状態の表現を用意する   |
| `pkg/intermodule/account.ts`                       | フォロワー一覧は取得できるが、認可用の単一関係確認APIはない                                                  | 全フォロワーとプロフィールの列挙を避ける                    |
| `pkg/accounts/model/follow.ts`                     | フォローは即時成立し、有効性は削除日時で表す                                                                 | 同じ定義をPolicyとRepositoryで使う                          |
| `pkg/accounts/adaptor/repository/prisma/prisma.ts` | フォロー取得は `deletedAt: null` で絞り込み、`state` は参照しない                                            | 閲覧者から投稿者への関係の向きを保つ                        |
| `pkg/notes/deps.ts`、`pkg/intermodule/note.ts`     | 取得ServiceとRepositoryは内部用途にも共有される                                                              | GET専用経路も同じ基礎データを参照し、別の空ストアを作らない |
| `pkg/timeline/service/noteVisibility.ts`           | 本人を先に許可するなど、今回のDIRECT拒否条件とは異なる                                                       | 今回のPolicyへ置き換えず、既存動作を維持する                |

### 仕様との差

`pkg/notes/model/directNote.ts` と `pkg/notes/service/createDirect.ts` に、専用のモデルと作成Serviceがある。
通常の `pkg/notes/service/create.ts` も、DIRECTの作成を拒否する。
一方、`pkg/notes/model/note.ts` の `NoteVisibility` と通常Noteの復元処理にはDIRECTが残っているため、通常GETではその値を拒否する。
DirectNoteの取得認可、残存する型の整理、データ移行は本変更に含めない。

`.claude/specification/src/authorization.md` は、Account主体、文字列Action、3引数、成功値voidを基本としており、匿名ではPolicyを呼ばないと説明している。
一方、現在の共通型と#1438は、匿名Principal、Action値オブジェクト、Context、成功値scopeに対応する。
実装時は既存共通型を利用し、認可仕様と `AGENTS.md` の認可シグネチャ説明を必要な範囲で追従させる。
これは既存の権限ルール全体を変更する作業ではない。

`.claude/specification/src/endpoint/notes.md` の投稿者情報には画像URLとフォロー数があり、実装は固定値を返す。
今回も固定値を維持し、#1438本文の4項目限定には合わせない。

モデル仕様にはフォロー申請などの状態があるが、現在の `AccountFollow` にはその状態がない。
本計画では現行実装の即時成立と論理削除を基準とし、仕様上の申請制を実装済みとは扱わない。

## 変更方針

### GET専用の処理フロー

次の順序で処理する。
新設するService名とRepository名は仮称であり、既存APIではない。

1. Handlerが認証Middlewareの結果だけからPrincipalを生成する。
   トークン不正を匿名に読み替えず、既存の認証処理へ委ねる。
2. ControllerがNote IDとPrincipalを、新設するGET専用Serviceへ渡す。
3. Serviceが認可判定に必要な属性だけを取得する。
   Note ID、投稿者ID、公開範囲、削除状態、投稿者の存在と凍結状態を取得し、本文、添付、リアクションは取得しない。
4. `FOLLOWERS` で本人以外の認証済み閲覧者の場合だけ、有効なフォロー関係を確認する。
   PrincipalやContextに他モジュールのAccount、AccountFollowモデルを内包しない。
5. 同期Policyが判定し、許可時だけscopeを返す。
6. scopeを渡して本文、投稿者の公開プロフィール、添付、リアクション、閲覧者本人のRenote状態を取得する。
7. Controllerが既存のレスポンス形状へ変換する。
   GETのレスポンス生成で従来のscope不要取得へ戻らない。

直列処理は既存の `Cat.doT` とResultの合成に合わせる。
同期Policyの結果は前段の認可属性に依存するため、Resultを `Promise.resolve` で包み、`addMWith` でscopeを束縛する。
前段の値に依存する非同期取得にも `addMWith` を用いる。
各取得が失敗した時点で後続へ進まず、失敗を匿名、空配列、Renoteのfalseへ読み替えない。

### NotesのAction、Policy、scope

`pkg/notes/policy/notePolicy.ts` を新設する。
Note用の固有のPolicyNameを持つAction型を定義し、非公開コンストラクタを持つ `PolicyAction` のサブクラスからreadの定義済みインスタンスを公開する。
別リソースのActionと混同しない具体型をPolicyの引数に使い、対応しないActionは拒否する。

PolicyはPrincipal、read Action、対象Noteの認可属性、投稿者状態とフォロー判定のContextを受け取る。
Contextはサーバー側で取得した対象IDと閲覧者IDに対応させる。
本人判定を公開範囲判定より先に無条件許可せず、DIRECTは本人も拒否する。
I/O、モデル変更、ログ出力は行わない。

scopeの実体クラスはPolicyと同じモジュール内に隠し、外部には型のみ公開する。
非公開コンストラクタとハードプライベートのブランドを持たせ、対象Note IDと読み取り専用のPrincipalを保持する。
発行用のstaticメソッドがあっても、クラスの値自体はexportしない。

scopeはリクエスト内だけで利用し、永続化やキャッシュをしない。
型による制限は呼び出し忘れを検出するためのものであり、型キャストによる偽造を防ぐ実行時のセキュリティ境界とは扱わない。

### GET専用Repository契約

`pkg/notes/model/repository.ts` に、GET専用の `NoteReadRepository` を新設する案を採る。
既存の `NoteRepository`、`NoteAttachmentRepository`、`ReactionRepository` のscope不要メソッドは内部互換性のため維持する。
専用契約には、次の責務を分けて定義する。

- 認可属性の取得：scope発行前に必要な最小限の情報を返す。
- 本文と公開プロフィールの取得：scope必須で、親Noteの閲覧条件を適用する。
- 添付の取得：scope必須で、親Note、添付行、Mediumの条件を適用する。
- リアクションの取得：scope必須で、親Noteとリアクションの条件を適用する。
- 閲覧者本人のRenote状態の取得：scopeのPrincipalを使い、匿名では問い合わせずfalseを返す。

新設する取得メソッドは `Result<Error, T>` または `Result<Error, Option<T>>` で、不在と実行障害を区別する。
親Noteが見えないことと、見える親の添付やリアクションが0件であることも区別する。
取得途中で親が見えなくなった場合は `NoteNotFoundError` を返し、部分的な成功レスポンスを返さない。

PrismaのRepositoryは永続化されたリレーションを使って親Noteの条件を適用する。
AccountsのServiceをNotesから直接importしない。
フォロー判定材料は単一関係を確認するAccountsのFacade経由で取得するか、GET専用の認可属性クエリに含める。
本計画の推奨は後者であり、親Noteの認可属性と必要な関係を返す専用Repositoryの内部実装として扱う。
他モジュールのモデルではなくIDと最小属性を返すことを維持する。

### PrismaとInMemoryの条件適用

PrismaではGET専用実装を新設し、親Noteの条件を組み立てるヘルパーを本文、添付、リアクションで共有する。
条件は対象ID、Noteの未削除、投稿者の存在と非凍結、公開範囲、必要な有効フォロー関係である。
投稿者の削除については、既存Account取得が削除済みを返さない動作を維持する。
フォローは `fromId = 閲覧者`、`toId = 投稿者`、`deletedAt = null` とし、`state` 条件は追加しない。
添付では添付行とMediumの `deletedAt = null`、リアクションでは自身の `deletedAt = null` も指定する。
これらを取得後のレスポンス整形だけで除外しない。

InMemoryでは、Note、投稿者状態、フォロー関係、関連データの現在値を参照できるGET専用実装を新設する。
既存Repositoryとデータを複製して独立させず、同じMap等の基礎ストアを参照するか、共有インスタンスを経由して取得する。
既存の添付、Medium、リアクションモデルが削除状態を持たない部分は、GET専用の保存レコードやテストfixtureに削除日時を持たせる。
このためだけに他モジュールのドメインモデル全体へ削除属性を追加しない。
既存コンストラクタへの変更が必要なら、既存テストと呼び出し元を維持できるアダプターや初期値を用意する。

同期PolicyとRepository条件は同じ閲覧表を満たす必要がある。
Policyのテストだけでなく、両Repositoryの振る舞いを同じケースで確認し、DB条件の写し間違いを検出する計画とする。
ただしDBでの実検証方法は未決であり、クエリ引数のモック検証だけでは同等性を確認できない。

### 状態変化と整合性

scopeは判定時点のフォロー関係や投稿者状態を固定するものではない。
本文取得後でも、添付やリアクションを取得するときに親Noteの閲覧条件を確認する。

複数クエリを一つのレスポンスにまとめるため、親の可視性確認と関連データ取得を別クエリに分けた箇所には競合が残り得る。
親が不可視になった場合の404と、関連データ0件を区別する具体的なクエリ構成をRepository実装前に確定する。
リクエスト全体のスナップショット整合性や、応答直前までの権限維持は、本計画の条件再適用だけでは保証しない。
全体トランザクションが必要かは、未決事項として扱う。

### レスポンスと互換性

`NoteNotFoundError` をGET経路の不在と拒否に統一し、Handlerは既存の404マッピングを利用する。
実行障害は500とし、拒否を403にしない。
公開プロフィールは許可後に必要な属性だけを取得し、Accountオブジェクト全体のシリアライズを避ける。

`GetNoteResponseSchema` の投稿者項目は維持する。
プロフィール画像やフォロー数の実取得は今回追加しない。
認証済み閲覧者のRenote状態には投稿者IDを代用しない。
GET専用経路では、RenoteのDB取得失敗をfalseとして隠さない。
内部用途の既存 `fetchRenoteStatus` の契約変更は今回必須としない。

既存の作成、Renote、Bookmark、ReactionのControllerと `NoteModuleFacade` は従来の取得経路を維持する。
新旧の取得経路が同じデータを参照することを回帰テストで確認する。
データ移行は想定しない。
展開後に問題が見つかった場合も、認可のない旧GETへ戻すことを通常の切り戻し手段にはしない。

## 実装手順と検証方法

### 1. 契約と仕様の差を固定する

- 上記の閲覧表、既存プロフィール項目の維持、有効フォローの定義をテストケースとして整理する。
- 認可仕様と投稿API仕様に必要な追従内容を整理する。
  匿名Principal、4引数の同期Policy、scopeを説明し、投稿者情報の固定値を明記する。
- `AGENTS.md` の認可シグネチャ説明を共通型と整合させる変更を含める。
- GET専用Repositoryの戻り値で、不在、拒否、空の関連データ、実行障害を区別する。
- 完了条件：受け入れ条件ごとに取得契約とテストが対応し、未決の整合性要件とDB検証が明示されている。

### 2. Action、Policy、scopeを導入する

- 新設するNote Policyを、許可ケースと拒否ケースのテストから実装する。
- 匿名、本人、順方向のフォロー、逆方向のみ、解除済み、Note削除、投稿者凍結、DIRECTを検証する。
- 閲覧者状態や管理者ロールで条件を増減しないことを検証する。
- 型テストで、他PolicyのAction、scopeなしのGET用取得、外部からのscope生成を拒否することを確認する。
- 完了条件：PolicyがI/Oなしに閲覧表どおりの結果を返し、許可時だけ対象NoteとPrincipalに対応するscopeを発行する。

### 3. GET専用Repositoryを実装する

- 専用契約とPrisma実装、InMemory実装、依存注入を追加する。
- InMemory実装から先に、現在の親Noteとフォロー関係の条件再適用、関連データの論理削除をテストする。
- Prismaでは共有の親Note条件と関連行の削除条件を適用し、例外をResultへ変換する。
- 親が不可視の場合と関連データ0件の場合を区別するクエリ構成を確定する。
- scope発行後のフォロー解除、投稿者凍結、Note削除を次の取得に反映することをテストする。
- 完了条件：両実装に必要な条件が実装され、InMemoryでの動作、Prismaのクエリ構成、未検証のDB条件を区別して記録する。
  この段階だけではDBの実動作確認完了とはしない。

### 4. GETのServiceとHTTP経路を接続する

- GET専用Serviceを新設し、判定材料取得、Policy、scope付き取得の順に接続する。
- Controllerは取得結果のレスポンス変換を担当し、scope不要のRepository取得を行わない。
- HandlerからPrincipalを渡し、404のエラー型を統一する。
- Serviceテストで、拒否時に本文、公開プロフィール、添付、リアクション、Renote状態を取得しないことを確認する。
- 許可時には各取得へ同じ対象NoteとPrincipalのscopeが渡ることを確認する。
- APIテストで未存在と拒否のステータスと本文が一致すること、匿名の公開取得、FOLLOWERSの拒否、本人のDIRECT拒否を検証する。
- プロフィールの既存固定値、非公開項目の不在、Renoteの主体、取得障害時の500を検証する。
- 完了条件：GETの入口からレスポンスまで認可経路がつながり、旧経路への迂回がない。

### 5. 回帰確認と残課題の記録

- 作成、Renote、Bookmark、Reaction、NoteModuleFacade、Timelineのイベント処理の既存テストを確認する。
- 内部経路で作成したNoteや関連データをGET専用実装が取得できることを確認し、ストア分離による不整合を検出する。
- メディアのURL、サムネイル、ローカル保存、配信設定を追跡し、直接アクセスの検証結果と未確認部分を記録する。
- DB検証方法を合意したうえで、閲覧表、関係の向き、論理削除、投稿者状態、関連データ0件と不可視の違いをDBで確認する。
  方法が未決または未実行なら、その項目を完了にしない。
- コード変更後は `AGENTS.md` の品質チェックを実行する。
- 完了条件：回帰がなく、受け入れ条件の実行結果と未検証範囲を報告できる。
  issueのクローズ可否はDB未検証の扱いを含めて別途判断する。

## 未決事項

| 項目                   | 不明点と影響                                                                | 解消方法と実装への影響                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 親条件と関連取得の競合 | 別々の確認クエリでは状態変化が入り得る。親不可視と関連データ0件の区別も必要 | Repository実装前に、親を起点とした条件付き関連取得などの構成を確定する。リクエスト全体のスナップショットを要求するかは追加判断とする |

## 実装と検証の記録

### 実装上の判断

- GET専用の `ReadNoteService` と `NoteReadRepository` を追加し、既存の内部取得契約は維持した。
- Prismaでは本文、添付、リアクション、認証済み閲覧者のRenote状態を、それぞれ可視な親Noteを起点に取得する。
  各取得をRepeatable Readのトランザクション内で実行し、Prismaが関連取得を複数クエリに分ける場合も、その取得内の親と関連データは同じスナップショットを参照する。
  親が不可視なら404、親が可視で関連データがなければ空配列とする。
  HTTPリクエスト全体を一つのトランザクションにはせず、取得ごとに最新の親条件を適用する。
  取得完了後から応答までの権限維持は保証しない。
  上表の競合については、この取得単位の整合性を実装上の扱いとした。
- InMemoryでは既存のNote、添付、リアクションのRepositoryを参照する。
  依存注入のたびに別ストアが生成されないようにし、AccountsのControllerとFacadeもアカウントとフォローのストアを共有させた。
  開発用Accountsのフォロー初期値は、Facadeが従来から使っていた `dummyfollows` に揃えた。
- 投稿者プロフィールはレスポンス生成時も明示的に項目を列挙し、予期しない属性をシリアライズしない。
  既存の画像URLとフォロー数の固定値は維持した。
- DirectNote専用Repositoryには接続せず、通常Noteに残るDIRECTは拒否する。

### 検証した範囲

Policyの閲覧表、scopeの型制約、拒否後の取得停止、同じscopeの受け渡し、HTTPの404と500の区別、匿名Principalと認証済みPrincipal、公開プロフィール、固定値、閲覧者本人のRenote状態をテストした。
InMemoryでは、逆方向フォロー、解除済みフォロー、削除済みNote、投稿者の削除や凍結、scope発行後の状態変化、関連データの論理削除を確認した。
実際の依存注入を使い、内部のNote作成、Accountsのフォローと解除、新規投稿者の作成と凍結がGET経路に反映されることも確認した。
Prismaはクエリ構成、リレーションの向き、削除条件、トランザクション設定、障害時のResultをモックで検証した。
DB統合テストは新設も実行もしていないため、SQL実行結果とDB上での競合動作は未検証である。

### メディア配信の確認範囲

GETレスポンスはMediumに保存されたURLとサムネイルURLを返し、今回の変更では署名やアクセス制御を追加していない。
`pkg/drive/service/upload.ts` は、URLとサムネイルURLを未設定でMediumを作成し、画像とサムネイルをStorageへ書き込む。
確認した `LocalStorage` はローカルファイルへの保存を行うだけで、認可付きのURL発行機能を持たない。
`main.ts` のルート登録にはStorageファイルの静的配信は見当たらず、本番Storage/CDNや外部配信設定は確認できていない。
既知URLからの直接取得の可否、キャッシュ、サムネイルの配信認可は未検証であり、Note APIの認可でメディアの秘匿を保証したとは扱わない。

`AGENTS.md` と `.claude/specification/src/` はローカルのGit除外設定の対象である。
説明は更新したが、追跡設定の変更や強制追加は行っていない。

### 品質チェック結果

実装後に `AGENTS.md` 指定のformat、型、lint、テストの全チェックが成功した。
全体テストは577件成功、9件skipである。
`git diff --check` も成功した。
Biomeは既存設定のschemaバージョンとCLIバージョンの不一致を情報として報告するが、チェックは成功している。
上記の成功はDBやStorage/CDNの実環境検証を含まない。

### フォローの一意性の補強

Repository側で一意性を維持し、重複保存は既存の `AccountAlreadyFollowingError` で拒否する。
既存HandlerによりHTTP応答は403と `ALREADY_FOLLOWING` になり、保存が拒否された場合はイベントを発行しない。
InMemoryはアカウントIDの組をキーに保持し、有効な関係の重複保存を拒否する。
Prismaは削除済みの行だけを条件付きで復元し、それ以外は一意制約付きの作成を行う。
一意制約違反は `AccountAlreadyFollowingError` に対応付ける。

Repositoryの二重フォロー拒否、削除済み関係の復元、IDの組による解除、重複要求後の解除でFOLLOWERS取得を拒否することを検証対象とする。
Prismaの検証はモックによるクエリ契約の確認であり、DB実環境での競合検証は未実施である。

TODO: `FollowService` で関係を生成する前にフォロー済みかを確認する。
この事前チェックは未実装であり、ServiceにはTODOコメントのみ残している。

別途、同一ミリ秒内の投稿作成とRenoteでID生成器が衝突し、InMemory上の元投稿が上書きされる問題を再現している。
ID生成器の共有化は、このフォローの一意性補強には含めていない。
