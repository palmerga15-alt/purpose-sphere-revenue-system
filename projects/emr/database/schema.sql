-- EMR Software: Stage 5 Database Design (draft v1)
-- MySQL 8 / InnoDB. Production requirements beyond this schema:
--   * encryption at rest (InnoDB tablespace encryption or encrypted cloud volumes)
--   * TLS for every connection
--   * application-level encryption for the most sensitive fields (marked [ENC])
-- One codebase serves all editions; `practices.edition` turns features on and off.

CREATE TABLE practices (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  edition       ENUM('coaching','behavioral','primary_care') NOT NULL,
  timezone      VARCHAR(64)  NOT NULL DEFAULT 'America/New_York',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  practice_id   BIGINT UNSIGNED NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,           -- bcrypt/argon2, never plain text
  mfa_secret    VARBINARY(255),                  -- [ENC] multi-factor login
  full_name     VARCHAR(200) NOT NULL,
  role          ENUM('admin','provider','front_desk','billing') NOT NULL,
  credentials   VARCHAR(100),                    -- e.g. LCSW, MD, Certified Coach
  npi           CHAR(10),                        -- clinicians who bill insurance
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (practice_id) REFERENCES practices(id)
);

CREATE TABLE patients (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  practice_id     BIGINT UNSIGNED NOT NULL,
  mrn             VARCHAR(30) NOT NULL,          -- medical record number
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  preferred_name  VARCHAR(100),
  date_of_birth   DATE NOT NULL,
  sex_at_birth    VARCHAR(20),
  gender_identity VARCHAR(50),
  pronouns        VARCHAR(30),
  phone           VARCHAR(30),
  email           VARCHAR(255),
  address         VARBINARY(1024),               -- [ENC]
  ssn_last4       VARBINARY(64),                 -- [ENC] store only if truly needed
  emergency_contact VARBINARY(1024),             -- [ENC]
  primary_provider_id BIGINT UNSIGNED,
  status          ENUM('active','inactive','discharged') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_practice_mrn (practice_id, mrn),
  FOREIGN KEY (practice_id) REFERENCES practices(id),
  FOREIGN KEY (primary_provider_id) REFERENCES users(id)
);

CREATE TABLE portal_accounts (                    -- patient/client portal logins
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT UNSIGNED NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE insurance_policies (                 -- behavioral + primary care
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT UNSIGNED NOT NULL,
  payer_name    VARCHAR(200) NOT NULL,
  member_id     VARBINARY(255) NOT NULL,         -- [ENC]
  group_number  VARCHAR(100),
  priority      ENUM('primary','secondary') NOT NULL DEFAULT 'primary',
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE appointments (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  practice_id   BIGINT UNSIGNED NOT NULL,
  patient_id    BIGINT UNSIGNED NOT NULL,
  provider_id   BIGINT UNSIGNED NOT NULL,
  starts_at     DATETIME NOT NULL,
  ends_at       DATETIME NOT NULL,
  type          VARCHAR(100) NOT NULL,           -- intake, follow-up, coaching session...
  modality      ENUM('in_person','telehealth','phone') NOT NULL,
  status        ENUM('scheduled','checked_in','completed','no_show','cancelled') NOT NULL DEFAULT 'scheduled',
  FOREIGN KEY (practice_id) REFERENCES practices(id),
  FOREIGN KEY (patient_id)  REFERENCES patients(id),
  FOREIGN KEY (provider_id) REFERENCES users(id),
  INDEX idx_provider_time (provider_id, starts_at)
);

CREATE TABLE encounters (                         -- one visit/session
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id     BIGINT UNSIGNED NOT NULL,
  provider_id    BIGINT UNSIGNED NOT NULL,
  appointment_id BIGINT UNSIGNED,
  encounter_date DATETIME NOT NULL,
  FOREIGN KEY (patient_id)     REFERENCES patients(id),
  FOREIGN KEY (provider_id)    REFERENCES users(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE notes (                              -- clinical/session notes
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  encounter_id  BIGINT UNSIGNED NOT NULL,
  format        ENUM('soap','dap','birp','coaching','free_text') NOT NULL,
  body          VARBINARY(65000) NOT NULL,       -- [ENC] JSON of the note sections
  status        ENUM('draft','signed','amended') NOT NULL DEFAULT 'draft',
  signed_by     BIGINT UNSIGNED,
  signed_at     DATETIME,
  amends_note_id BIGINT UNSIGNED,                -- signed notes are never edited, only amended
  FOREIGN KEY (encounter_id)   REFERENCES encounters(id),
  FOREIGN KEY (signed_by)      REFERENCES users(id),
  FOREIGN KEY (amends_note_id) REFERENCES notes(id)
);

-- HIPAA gives psychotherapy notes extra protection: kept apart from the
-- chart, visible only to the authoring clinician, excluded from routine release.
CREATE TABLE psychotherapy_notes (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT UNSIGNED NOT NULL,
  author_id     BIGINT UNSIGNED NOT NULL,
  body          VARBINARY(65000) NOT NULL,       -- [ENC]
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (author_id)  REFERENCES users(id)
);

CREATE TABLE diagnoses (                          -- problem list (ICD-10-CM)
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT UNSIGNED NOT NULL,
  icd10_code    VARCHAR(10) NOT NULL,
  description   VARCHAR(255) NOT NULL,
  status        ENUM('active','resolved') NOT NULL DEFAULT 'active',
  onset_date    DATE,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE medications (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT UNSIGNED NOT NULL,
  rxnorm_code   VARCHAR(20),
  name          VARCHAR(255) NOT NULL,
  dose          VARCHAR(100),
  frequency     VARCHAR(100),
  status        ENUM('active','stopped') NOT NULL DEFAULT 'active',
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE allergies (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT UNSIGNED NOT NULL,
  substance     VARCHAR(255) NOT NULL,
  reaction      VARCHAR(255),
  severity      ENUM('mild','moderate','severe'),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE vitals (                             -- primary care
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  encounter_id  BIGINT UNSIGNED NOT NULL,
  bp_systolic   SMALLINT, bp_diastolic SMALLINT,
  heart_rate    SMALLINT, temp_f DECIMAL(4,1),
  weight_lb     DECIMAL(5,1), height_in DECIMAL(4,1),
  FOREIGN KEY (encounter_id) REFERENCES encounters(id)
);

CREATE TABLE assessments (                        -- PHQ-9, GAD-7, etc.
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT UNSIGNED NOT NULL,
  instrument    VARCHAR(30) NOT NULL,
  answers       VARBINARY(4096) NOT NULL,        -- [ENC]
  total_score   SMALLINT NOT NULL,
  completed_at  DATETIME NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE goals (                              -- treatment plans / coaching goals
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT UNSIGNED NOT NULL,
  description   TEXT NOT NULL,
  target_date   DATE,
  status        ENUM('active','met','revised','discontinued') NOT NULL DEFAULT 'active',
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE invoices (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT UNSIGNED NOT NULL,
  encounter_id  BIGINT UNSIGNED,
  amount_cents  INT UNSIGNED NOT NULL,
  status        ENUM('open','paid','void') NOT NULL DEFAULT 'open',
  payment_ref   VARCHAR(100),                    -- processor token only, never card numbers
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)   REFERENCES patients(id),
  FOREIGN KEY (encounter_id) REFERENCES encounters(id)
);

-- Every view, create, change, print and export of patient data is logged here.
-- Append-only: the application account has INSERT and SELECT only, never UPDATE or DELETE.
CREATE TABLE audit_log (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  practice_id   BIGINT UNSIGNED NOT NULL,
  user_id       BIGINT UNSIGNED,
  patient_id    BIGINT UNSIGNED,
  action        ENUM('view','create','update','sign','print','export','login','login_failed','denied') NOT NULL,
  resource      VARCHAR(50) NOT NULL,            -- e.g. 'note', 'patient'
  resource_id   BIGINT UNSIGNED,
  ip_address    VARCHAR(45),
  occurred_at   TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_patient (patient_id, occurred_at),
  INDEX idx_user (user_id, occurred_at)
);
