CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     integer     NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  token       text        NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used        boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_user  ON password_reset_tokens(user_id);
