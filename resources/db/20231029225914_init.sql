-- +goose Up
-- アカウント
CREATE TABLE IF NOT EXISTS account (
	id VARCHAR(255) PRIMARY KEY,
	name VARCHAR(128) NOT NULL,
	nickname VARCHAR(255),
	mail VARCHAR(128),
	passphrase_hash VARCHAR(255),
	bio TEXT DEFAULT '',
	role INT NOT NULL DEFAULT 0,
	status INT NOT NULL DEFAULT 0,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) DEFAULT NULL,
	deleted_at DATETIME(6) DEFAULT NULL
);
-- フォロー関係
CREATE TABLE IF NOT EXISTS following (
	from_id VARCHAR(255),
	to_id VARCHAR(255),
	state INT NOT NULL DEFAULT 1,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) DEFAULT NULL,
	deleted_at DATETIME(6) DEFAULT NULL,
	FOREIGN KEY (from_id) REFERENCES account (id),
	FOREIGN KEY (to_id) REFERENCES account (id),
	PRIMARY KEY (from_id, to_id)
);
-- ノート
CREATE TABLE IF NOT EXISTS note (
	id VARCHAR(255) PRIMARY KEY,
	text TEXT,
	author_id VARCHAR(255) NOT NULL,
	renote_id VARCHAR(255) DEFAULT NULL,
	visibility INT NOT NULL DEFAULT 0,
	created_at DATETIME(6) NOT NULL,
	deleted_at DATETIME(6) DEFAULT NULL,
	FOREIGN KEY (author_id) REFERENCES account (id),
	FOREIGN KEY (renote_id) REFERENCES note (id)
);
-- リアクション
CREATE TABLE IF NOT EXISTS reaction (
	reacted_by VARCHAR(255) NOT NULL,
	reacted_to VARCHAR(255) NOT NULL,
	body VARCHAR(255) NOT NULL,
	created_at DATETIME(6) NOT NULL,
	deleted_at DATETIME(6) DEFAULT NULL,
	FOREIGN KEY (reacted_by) REFERENCES account (id),
	FOREIGN KEY (reacted_to) REFERENCES note (id),
	PRIMARY KEY (reacted_by, reacted_to)
);
-- ブックマーク
CREATE TABLE IF NOT EXISTS bookmark (
	note_id VARCHAR(255) NOT NULL,
	account_id VARCHAR(255) NOT NULL,
	created_at DATETIME(6) NOT NULL,
	deleted_at DATETIME(6) DEFAULT NULL,
	FOREIGN KEY (note_id) REFERENCES note (id),
	FOREIGN KEY (account_id) REFERENCES account (id),
	PRIMARY KEY (note_id, account_id)
);
-- リスト
CREATE TABLE IF NOT EXISTS list (
	id VARCHAR(255) PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	visibility INT NOT NULL DEFAULT 0,
	created_at DATETIME(6) NOT NULL,
	updated_at DATETIME(6) DEFAULT NULL,
	deleted_at DATETIME(6) DEFAULT NULL
);
-- リストのメンバー
CREATE TABLE IF NOT EXISTS list_member (
	list_id VARCHAR(255),
	member_id VARCHAR(255),
	created_at DATETIME(6) NOT NULL,
	deleted_at DATETIME(6) DEFAULT NULL,
	FOREIGN KEY (list_id) REFERENCES list (id),
	FOREIGN KEY (member_id) REFERENCES account (id),
	PRIMARY KEY (list_id, member_id)
);
-- メディア
CREATE TABLE IF NOT EXISTS medium (
	id VARCHAR(255) PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	mime VARCHAR(255) NOT NULL,
	author_id VARCHAR(255) NOT NULL,
	created_at DATETIME(6) NOT NULL,
	deleted_at DATETIME(6) DEFAULT NULL,
	FOREIGN KEY (author_id) REFERENCES account (id)
);
-- ノート添付ファイル
CREATE TABLE IF NOT EXISTS note_attachment (
	medium_id VARCHAR(255),
	note_id VARCHAR(255),
	alt VARCHAR(255),
	created_at DATETIME(6) NOT NULL,
	deleted_at DATETIME(6) DEFAULT NULL,
	FOREIGN KEY (medium_id) REFERENCES medium (id),
	FOREIGN KEY (note_id) REFERENCES note (id),
	PRIMARY KEY (medium_id, note_id)
);
-- +goose Down
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS following;
DROP TABLE IF EXISTS note;
DROP TABLE IF EXISTS reaction;
DROP TABLE IF EXISTS bookmark;
DROP TABLE IF EXISTS list;
DROP TABLE IF EXISTS list_member;
DROP TABLE IF EXISTS medium;
DROP TABLE IF EXISTS note_attachment;
