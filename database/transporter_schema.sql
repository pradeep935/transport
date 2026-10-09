-- Wheeltrack: Transporter / Shipper registration, company management, vehicles, driver associations.
-- MySQL 8.0 / InnoDB / utf8mb4. NOT APPLIED YET. Review before running against any environment.
--
-- Rules the application layer must enforce on top of these constraints:
--   * Every write checks the caller's company and representative permission (company_role_permissions /
--     representative_permissions). Applicants can never call admin decisions.
--   * Registration, document and association status changes follow the allowed transitions and are recorded
--     in approval_history / audit_logs in the same transaction.
--   * Full Aadhaar numbers, OTPs and plain passwords are never stored. Only masked identifiers are kept.
--   * Document files live in private object storage; only storage keys are stored here.

SET NAMES utf8mb4;

-- ---------------------------------------------------------------- companies
CREATE TABLE companies (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transporter_id   VARCHAR(20)  NOT NULL,                 -- public ID shared with drivers, e.g. WTT-49443
  legal_name       VARCHAR(200) NOT NULL,
  trade_name       VARCHAR(200) NULL,
  company_type     ENUM('private_limited','public_limited','llp','partnership','proprietorship','other') NOT NULL,
  company_type_other VARCHAR(120) NULL,
  nature           ENUM('transporter','shipper','both') NULL, -- recommended field
  industry         VARCHAR(80)  NOT NULL,
  year_established SMALLINT UNSIGNED NULL,                 -- recommended field
  contact_mobile   CHAR(10)     NOT NULL,
  business_email   VARCHAR(254) NOT NULL,
  website          VARCHAR(255) NULL,
  fleet_size       INT UNSIGNED NULL,
  location_count   INT UNSIGNED NULL,
  pan              CHAR(10)     NULL,
  gstin            CHAR(15)     NULL,
  cin              VARCHAR(21)  NULL,                     -- CIN or LLPIN
  status           ENUM('draft','pending_review','info_required','rejected','approved','suspended') NOT NULL DEFAULT 'draft',
  approved_at      DATETIME     NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_companies_transporter_id (transporter_id),
  UNIQUE KEY uq_companies_pan (pan),
  UNIQUE KEY uq_companies_gstin (gstin),
  UNIQUE KEY uq_companies_cin (cin),
  KEY ix_companies_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login account that created the registration. A verified contact never means the business is verified.
CREATE TABLE company_accounts (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NOT NULL,
  mobile           CHAR(10)     NOT NULL,
  mobile_verified_at DATETIME   NULL,
  email            VARCHAR(254) NOT NULL,
  email_verified_at DATETIME    NULL,
  password_hash    VARCHAR(255) NOT NULL,                 -- argon2id / bcrypt
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_company_accounts_mobile (mobile),
  UNIQUE KEY uq_company_accounts_email (email),
  CONSTRAINT fk_company_accounts_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE company_addresses (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NOT NULL,
  kind             ENUM('registered','operating') NOT NULL,
  address_line     VARCHAR(500) NOT NULL,
  state            VARCHAR(80)  NULL,
  district         VARCHAR(80)  NULL,
  pincode          CHAR(6)      NULL,
  same_as_registered TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_company_addresses_kind (company_id, kind),
  CONSTRAINT fk_company_addresses_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- roles & representatives
CREATE TABLE company_roles (
  id               SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code             VARCHAR(40)  NOT NULL,                 -- company_admin, authorized_representative, ...
  name             VARCHAR(80)  NOT NULL,
  UNIQUE KEY uq_company_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE company_role_permissions (            -- role defaults
  role_id          SMALLINT UNSIGNED NOT NULL,
  module           VARCHAR(40)  NOT NULL,                 -- overview, profile, representatives, vehicles, drivers, assignments, documents, audit
  PRIMARY KEY (role_id, module),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES company_roles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE company_representatives (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NOT NULL,
  is_primary       TINYINT(1)   NOT NULL DEFAULT 0,
  full_name        VARCHAR(150) NOT NULL,
  designation      VARCHAR(120) NOT NULL,
  employee_type    ENUM('permanent','contract','director_partner_proprietor','authorized_agent','other') NOT NULL,
  employee_code    VARCHAR(60)  NULL,
  department       VARCHAR(120) NULL,
  joining_date     DATE         NULL,
  mobile           CHAR(10)     NOT NULL,
  mobile_verified_at DATETIME   NULL,
  email            VARCHAR(254) NOT NULL,
  email_verified_at DATETIME    NULL,
  authorized_signatory TINYINT(1) NOT NULL,
  role_id          SMALLINT UNSIGNED NOT NULL,
  custom_permissions TINYINT(1) NOT NULL DEFAULT 0,       -- 1 when representative_permissions overrides the role
  status           ENUM('draft','pending_verification','active','deactivated') NOT NULL DEFAULT 'draft',
  password_hash    VARCHAR(255) NULL,                     -- set when the representative activates their own login
  created_by       BIGINT UNSIGNED NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reps_company_mobile (company_id, mobile),
  UNIQUE KEY uq_reps_company_email (company_id, email),
  KEY ix_reps_company_status (company_id, status),
  CONSTRAINT fk_reps_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
  CONSTRAINT fk_reps_role FOREIGN KEY (role_id) REFERENCES company_roles (id),
  CONSTRAINT fk_reps_created_by FOREIGN KEY (created_by) REFERENCES company_representatives (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE representative_permissions (          -- per-person overrides set by the Company Admin
  representative_id BIGINT UNSIGNED NOT NULL,
  module           VARCHAR(40)  NOT NULL,
  PRIMARY KEY (representative_id, module),
  CONSTRAINT fk_rep_permissions_rep FOREIGN KEY (representative_id) REFERENCES company_representatives (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- verification
-- Representative identity. Only provider-returned, permitted fields are kept; never the full Aadhaar number.
CREATE TABLE identity_verifications (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  representative_id BIGINT UNSIGNED NOT NULL,
  method           ENUM('aadhaar_otp','manual') NOT NULL,
  status           ENUM('pending','verified','failed','pending_manual_review','manual_approved','manual_rejected') NOT NULL,
  aadhaar_last4    CHAR(4)      NULL,
  provider         VARCHAR(60)  NULL,
  provider_reference VARCHAR(120) NULL,
  consent_at       DATETIME     NULL,
  verified_name    VARCHAR(150) NULL,
  verified_dob     DATE         NULL,
  verified_gender  VARCHAR(20)  NULL,
  verified_address VARCHAR(500) NULL,
  manual_document_type VARCHAR(40) NULL,
  manual_document_ref  VARCHAR(60) NULL,                  -- store masked where the document type allows
  reviewer_id      BIGINT UNSIGNED NULL,                  -- Wheeltrack admin user
  review_remarks   VARCHAR(1000) NULL,
  failure_code     VARCHAR(40)  NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at       DATETIME     NULL,
  KEY ix_identity_rep (representative_id, created_at),
  CONSTRAINT fk_identity_rep FOREIGN KEY (representative_id) REFERENCES company_representatives (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PAN / GSTIN / CIN checks. One row per attempt = verification history.
CREATE TABLE business_kyc_verifications (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NOT NULL,
  kind             ENUM('pan','gstin','cin','llpin') NOT NULL,
  number           VARCHAR(21)  NOT NULL,
  status           ENUM('not_started','pending','under_review','verified','rejected','failed') NOT NULL,
  provider         VARCHAR(60)  NULL,
  provider_reference VARCHAR(120) NULL,
  result_json      JSON         NULL,                     -- registered name, status, address, name-match result
  failure_code     VARCHAR(40)  NULL,                     -- NOT_FOUND, PROVIDER_UNAVAILABLE, ...
  reviewer_id      BIGINT UNSIGNED NULL,
  review_remarks   VARCHAR(1000) NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_kyc_company_kind (company_id, kind, created_at),
  CONSTRAINT fk_kyc_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- documents
-- Company, representative and identity documents. Each upload is a new version row; current = highest version.
CREATE TABLE company_documents (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NOT NULL,
  representative_id BIGINT UNSIGNED NULL,                 -- set for employee / identity documents
  doc_type         VARCHAR(40)  NOT NULL,                 -- pan, gst, incorporation, udyam, addressProof, joining, identity, ...
  version          SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  storage_key      VARCHAR(255) NOT NULL,                 -- private bucket key; served only through signed, authorised URLs
  original_name    VARCHAR(255) NOT NULL,
  mime_type        ENUM('application/pdf','image/jpeg','image/png') NOT NULL,
  size_bytes       INT UNSIGNED NOT NULL,
  sha256           CHAR(64)     NOT NULL,                 -- duplicate detection
  malware_scan     ENUM('pending','clean','infected','error') NOT NULL DEFAULT 'pending',
  status           ENUM('uploaded','under_review','verified','rejected','replaced','deleted') NOT NULL DEFAULT 'uploaded',
  expiry_date      DATE         NULL,
  reviewer_id      BIGINT UNSIGNED NULL,
  rejection_reason VARCHAR(1000) NULL,
  uploaded_by      BIGINT UNSIGNED NULL,
  uploaded_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at      DATETIME     NULL,
  UNIQUE KEY uq_company_doc_version (company_id, representative_id, doc_type, version),
  KEY ix_company_docs_sha (company_id, sha256),
  KEY ix_company_docs_expiry (expiry_date),
  CONSTRAINT fk_company_docs_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
  CONSTRAINT fk_company_docs_rep FOREIGN KEY (representative_id) REFERENCES company_representatives (id) ON DELETE CASCADE,
  CONSTRAINT fk_company_docs_uploader FOREIGN KEY (uploaded_by) REFERENCES company_representatives (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- registration review
CREATE TABLE registration_requests (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id       VARCHAR(30)  NOT NULL,                 -- e.g. REG-…; stable across resubmissions
  company_id       BIGINT UNSIGNED NOT NULL,
  version          SMALLINT UNSIGNED NOT NULL DEFAULT 1,  -- incremented on each resubmission
  status           ENUM('pending_review','info_required','rejected','approved') NOT NULL,
  stage            ENUM('company','kyc','representative','documents','final','done') NOT NULL DEFAULT 'company',
  reopened_sections JSON        NULL,                     -- sections the applicant may edit after a decision
  snapshot_json    JSON         NOT NULL,                 -- submitted data, preserved per version
  submitted_at     DATETIME     NOT NULL,
  resubmitted_at   DATETIME     NULL,
  decided_at       DATETIME     NULL,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_registration_request_id (request_id),
  UNIQUE KEY uq_registration_company (company_id),       -- one registration per company: no duplicate records
  KEY ix_registration_status (status, stage),
  CONSTRAINT fk_registration_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE approval_history (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_type     ENUM('registration','document','identity','kyc','vehicle','vehicle_document') NOT NULL,
  subject_id       BIGINT UNSIGNED NOT NULL,
  from_status      VARCHAR(30)  NULL,
  to_status        VARCHAR(30)  NOT NULL,
  remarks          VARCHAR(1000) NULL,
  admin_user_id    BIGINT UNSIGNED NULL,                  -- Wheeltrack reviewer
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_approval_subject (subject_type, subject_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- vehicles
CREATE TABLE vehicles (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NOT NULL,
  registration_number VARCHAR(13) NOT NULL,
  vehicle_type     VARCHAR(20)  NOT NULL,
  body_type        VARCHAR(60)  NULL,
  body_length      VARCHAR(20)  NULL,
  payload_tons     DECIMAL(6,2) NULL,
  cargo_types      VARCHAR(255) NULL,
  operating_area   VARCHAR(255) NULL,
  availability     ENUM('available','unavailable','on_trip') NOT NULL DEFAULT 'available',
  bed_length       VARCHAR(20)  NULL,
  bed_height       VARCHAR(20)  NULL,
  bed_width        VARCHAR(20)  NULL,
  gps_installed    ENUM('yes','no','unknown') NULL,       -- per vehicle only; never on the company
  fitness_not_applicable TINYINT(1) NOT NULL DEFAULT 0,
  status           ENUM('draft','pending_approval','approved','rejected','inactive') NOT NULL DEFAULT 'draft',
  review_remarks   VARCHAR(1000) NULL,
  submitted_at     DATETIME     NULL,
  decided_at       DATETIME     NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vehicles_registration (registration_number),
  KEY ix_vehicles_company_status (company_id, status),
  CONSTRAINT fk_vehicles_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vehicle_documents (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id       BIGINT UNSIGNED NOT NULL,
  doc_type         ENUM('rc','insurance','puc','fitness','permit') NOT NULL,
  version          SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  document_number  VARCHAR(60)  NULL,
  issuer           VARCHAR(120) NULL,                     -- insurer
  valid_from       DATE         NULL,
  valid_upto       DATE         NULL,
  verification_status ENUM('not_started','pending','under_review','verified','rejected','failed') NOT NULL DEFAULT 'not_started',
  provider         VARCHAR(60)  NULL,
  result_json      JSON         NULL,
  failure_code     VARCHAR(40)  NULL,
  storage_key      VARCHAR(255) NULL,
  original_name    VARCHAR(255) NULL,
  mime_type        ENUM('application/pdf','image/jpeg','image/png') NULL,
  size_bytes       INT UNSIGNED NULL,
  sha256           CHAR(64)     NULL,
  malware_scan     ENUM('pending','clean','infected','error') NULL,
  reviewer_id      BIGINT UNSIGNED NULL,
  rejection_reason VARCHAR(1000) NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vehicle_doc_version (vehicle_id, doc_type, version),
  KEY ix_vehicle_docs_expiry (valid_upto),
  CONSTRAINT fk_vehicle_docs_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- drivers & associations
-- Drivers register themselves. Transporters can read a summary but never write these columns.
CREATE TABLE drivers (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  driver_code      VARCHAR(20)  NOT NULL,                 -- e.g. WT-DRV-XXXXXX
  full_name        VARCHAR(150) NOT NULL,
  mobile           CHAR(10)     NOT NULL,
  email            VARCHAR(254) NULL,
  kyc_status       ENUM('pending','manual_review','verified') NOT NULL DEFAULT 'pending',
  licence_status   ENUM('unverified','pending','failed','manual_submitted','verified') NOT NULL DEFAULT 'unverified',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_drivers_code (driver_code),
  UNIQUE KEY uq_drivers_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE driver_associations (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id       VARCHAR(30)  NOT NULL,
  driver_id        BIGINT UNSIGNED NOT NULL,
  company_id       BIGINT UNSIGNED NOT NULL,
  status           ENUM('pending','approved','rejected','removed','withdrawn') NOT NULL DEFAULT 'pending',
  reason           VARCHAR(1000) NULL,                    -- required for rejected / removed
  decided_by       BIGINT UNSIGNED NULL,
  requested_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at       DATETIME     NULL,
  -- generated column: at most one open (pending/approved) association per driver + company
  open_key         VARCHAR(60) GENERATED ALWAYS AS (IF(status IN ('pending','approved'), CONCAT(driver_id, ':', company_id), NULL)) STORED,
  UNIQUE KEY uq_assoc_request_id (request_id),
  UNIQUE KEY uq_assoc_open (open_key),
  KEY ix_assoc_company_status (company_id, status),
  CONSTRAINT fk_assoc_driver FOREIGN KEY (driver_id) REFERENCES drivers (id) ON DELETE RESTRICT,
  CONSTRAINT fk_assoc_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT,
  CONSTRAINT fk_assoc_decided_by FOREIGN KEY (decided_by) REFERENCES company_representatives (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Separate from approval. A vehicle has at most one current assignment; history rows keep removed_at.
-- RESTRICT (not CASCADE) because the generated uniqueness columns depend on these keys and history must survive.
CREATE TABLE vehicle_assignments (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  association_id   BIGINT UNSIGNED NOT NULL,
  vehicle_id       BIGINT UNSIGNED NOT NULL,
  assigned_by      BIGINT UNSIGNED NULL,
  assigned_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  removed_by       BIGINT UNSIGNED NULL,
  removed_at       DATETIME     NULL,
  current_vehicle  BIGINT UNSIGNED GENERATED ALWAYS AS (IF(removed_at IS NULL, vehicle_id, NULL)) STORED,
  current_assoc    BIGINT UNSIGNED GENERATED ALWAYS AS (IF(removed_at IS NULL, association_id, NULL)) STORED,
  UNIQUE KEY uq_assign_current_vehicle (current_vehicle),
  UNIQUE KEY uq_assign_current_driver (current_assoc),
  KEY ix_assign_vehicle_history (vehicle_id, assigned_at),
  CONSTRAINT fk_assign_assoc FOREIGN KEY (association_id) REFERENCES driver_associations (id) ON DELETE RESTRICT,
  CONSTRAINT fk_assign_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE RESTRICT,
  CONSTRAINT fk_assign_by FOREIGN KEY (assigned_by) REFERENCES company_representatives (id) ON DELETE SET NULL,
  CONSTRAINT fk_assign_removed_by FOREIGN KEY (removed_by) REFERENCES company_representatives (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- audit
-- Append-only. The application user should have INSERT/SELECT only on this table.
CREATE TABLE audit_logs (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NULL,
  actor_type       ENUM('applicant','representative','driver','admin','system') NOT NULL,
  actor_id         BIGINT UNSIGNED NULL,
  category         ENUM('registration','profile','representative','document','verification','driver','vehicle','assignment','admin') NOT NULL,
  action           VARCHAR(80)  NOT NULL,
  subject_type     VARCHAR(40)  NULL,
  subject_id       BIGINT UNSIGNED NULL,
  details_json     JSON         NULL,                     -- never contains full identity numbers or OTPs
  ip_address       VARBINARY(16) NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_audit_company_time (company_id, created_at),
  KEY ix_audit_category (company_id, category, created_at),
  CONSTRAINT fk_audit_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- seed: roles and default permissions
INSERT INTO company_roles (code, name) VALUES
  ('company_admin', 'Company Admin'),
  ('authorized_representative', 'Authorized Representative'),
  ('operations_manager', 'Operations Manager'),
  ('fleet_manager', 'Fleet Manager'),
  ('driver_association_manager', 'Driver Association Manager'),
  ('document_compliance_manager', 'Document / Compliance Manager'),
  ('finance_manager', 'Finance Manager'),
  ('viewer', 'Viewer');

INSERT INTO company_role_permissions (role_id, module)
SELECT r.id, m.module FROM company_roles r
JOIN (
  SELECT 'company_admin' code, 'overview' module UNION ALL SELECT 'company_admin','profile' UNION ALL SELECT 'company_admin','representatives'
  UNION ALL SELECT 'company_admin','vehicles' UNION ALL SELECT 'company_admin','drivers' UNION ALL SELECT 'company_admin','assignments'
  UNION ALL SELECT 'company_admin','documents' UNION ALL SELECT 'company_admin','audit'
  UNION ALL SELECT 'authorized_representative','overview' UNION ALL SELECT 'authorized_representative','profile' UNION ALL SELECT 'authorized_representative','vehicles'
  UNION ALL SELECT 'authorized_representative','drivers' UNION ALL SELECT 'authorized_representative','assignments' UNION ALL SELECT 'authorized_representative','documents'
  UNION ALL SELECT 'operations_manager','overview' UNION ALL SELECT 'operations_manager','vehicles' UNION ALL SELECT 'operations_manager','drivers' UNION ALL SELECT 'operations_manager','assignments'
  UNION ALL SELECT 'fleet_manager','overview' UNION ALL SELECT 'fleet_manager','vehicles' UNION ALL SELECT 'fleet_manager','assignments'
  UNION ALL SELECT 'driver_association_manager','overview' UNION ALL SELECT 'driver_association_manager','drivers'
  UNION ALL SELECT 'document_compliance_manager','overview' UNION ALL SELECT 'document_compliance_manager','profile' UNION ALL SELECT 'document_compliance_manager','documents'
  UNION ALL SELECT 'finance_manager','overview' UNION ALL SELECT 'finance_manager','profile'
  UNION ALL SELECT 'viewer','overview'
) m ON m.code = r.code;
