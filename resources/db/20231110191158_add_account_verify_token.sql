-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS account_verify_token (
  account_id VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  FOREIGN KEY (account_id) REFERENCES account (id),
  PRIMARY KEY (account_id, token)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS account_verify_token;
-- +goose StatementEnd
