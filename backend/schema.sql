-- Exam platform schema (Postgres)

CREATE TABLE exams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 7200, -- 2 hours
  question_count INTEGER NOT NULL DEFAULT 40,      -- how many Qs to draw per session
  negative_marking NUMERIC DEFAULT 0,               -- e.g. 0.25 = -1/4 mark per wrong answer
  violation_auto_submit_threshold INTEGER DEFAULT 5,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Whitelist of who may sit which exam
CREATE TABLE allowed_participants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id     UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT,
  UNIQUE (exam_id, email)
);

CREATE TABLE questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id       UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  text          TEXT NOT NULL,
  options       JSONB NOT NULL,     -- ["opt A", "opt B", "opt C", "opt D"]
  correct_index SMALLINT NOT NULL,  -- index into options, 0-3. NEVER sent to frontend.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One-time login codes
CREATE TABLE otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  exam_id     UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  code_hash   TEXT NOT NULL,       -- bcrypt hash of the 6-digit code, never store plaintext
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exam_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id         UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  participant_email TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress','submitted','auto_submitted')),
  question_order  JSONB NOT NULL,   -- ordered array of question ids, frozen at session start
  option_order    JSONB NOT NULL,   -- { [question_id]: [origIdx0, origIdx1, origIdx2, origIdx3] }
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMPTZ,
  UNIQUE (exam_id, participant_email)  -- one attempt per participant per exam
);

CREATE TABLE responses (
  session_id        UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id       UUID NOT NULL REFERENCES questions(id),
  selected_option   SMALLINT,        -- index into the SHUFFLED options shown to the participant
  marked_for_review BOOLEAN NOT NULL DEFAULT false,
  answered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, question_id)
);

-- Browser-activity / integrity log
CREATE TABLE session_violations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,   -- tab_hidden | window_blur | fullscreen_exit | copy_attempt | ...
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE results (
  session_id        UUID PRIMARY KEY REFERENCES exam_sessions(id) ON DELETE CASCADE,
  correct_count     INTEGER NOT NULL,
  wrong_count       INTEGER NOT NULL,
  unanswered_count  INTEGER NOT NULL,
  score             NUMERIC NOT NULL,     -- after negative marking, if any
  rank              INTEGER,              -- computed/refreshed after exam window closes
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX idx_violations_session ON session_violations(session_id);
