# Treasury Atom verification runbook

This runbook is safe for local and dedicated non-production environments. Do not point it at production financial data, bank credentials, or payment APIs.

## 1. Prerequisites

- Node.js version supported by the lockfile and CI image.
- A clean checkout with no `.env` committed.
- Docker or an approved ephemeral PostgreSQL service for Phase 2 integration tests.
- Google Cloud CLI authenticated through workforce identity for cloud verification; never use a downloaded service-account key.
- Separate non-production Google Cloud project, tenant, KMS key, buckets, and database.

## 2. Local baseline

```powershell
npm ci
npm audit --omit=dev
npm run check
npm run dev
./scripts/check-health.ps1
```

Expected current prototype result: builds and tests pass; `/api/health/runtime` reports `propose_only` and `canMutate: false`. A healthy process is not evidence that production mutation is safe.

Reset local development state only:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:4320/api/v1/dev/reset `
  -Headers @{ Authorization = "Bearer <development-admin-token>" }
```

The reset route must not be registered in a production build.

## 3. Secret and dependency gates

CI must run, with pinned action/tool versions:

```text
gitleaks detect --redact --no-banner
semgrep scan --config p/owasp-top-ten --error
npm audit --omit=dev --audit-level=high
trivy fs --scanners vuln,secret,misconfig --exit-code 1 .
trivy image --exit-code 1 <immutable-image-digest>
checkov -d infrastructure --quiet --compact
```

Generate and retain an SPDX or CycloneDX SBOM and sign the container digest/provenance. A clean package audit alone is insufficient.

## 4. Tenant-isolation matrix

Create two isolated test tenants, two legal entities per tenant, and users for viewer, preparer, approver, auditor, and tenant admin. For every resource and operation:

1. Create data under Tenant A/Entity A1.
2. Verify authorized A1 access.
3. Attempt access as A2, Tenant B, an unassigned user, expired user, and disabled user.
4. Repeat for list, get, create, update, delete, export, object download, approval, job result, cache, SSE event, and audit query.
5. Expect indistinguishable `404` or policy-defined `403`, no body metadata leak, and a security audit event.

Gate: zero unauthorized successes and zero Tenant A identifiers in Tenant B responses, events, logs, exports, or object listings.

## 5. External-data validation

Use a finance-approved non-production evidence pack containing:

- CSV and XLSX statements with a checksum manifest and expected normalized rows.
- Duplicate file, duplicate transaction, reordered rows, revised statement, empty file, oversized file, wrong extension/MIME, formula cells, invalid currency/date/encoding, and malicious archive cases.
- A PDF statement only when a bank-specific parser version has been validated; otherwise expect `pending_supported_parser`.

Procedure:

1. Upload to the quarantine endpoint using a short-lived signed URL with object-generation precondition.
2. Verify size, MIME magic, malware scan, SHA-256, tenant/object path, encryption key, and audit receipt.
3. Run parser in shadow mode; compare normalized output to the signed expected manifest.
4. Re-upload identical content and confirm one logical ingestion result.
5. Correct a rejected file through a new immutable generation; do not overwrite evidence.
6. Promote only after validation and assigned human review.

## 6. Idempotency and financial-integrity tests

- Send the same command 100 times concurrently with one idempotency key and identical payload: expect one effect and the same response digest.
- Reuse the key with a different payload: expect `409 IDEMPOTENCY_CONFLICT` and no effect.
- Terminate the API after database commit but before response: retry must return the committed result.
- Deliver every outbox event twice and out of order: downstream state remains correct.
- Assert debit/credit conservation, currency scale, period lock, journal immutability, reversal linkage, and reconciliation version on every test run.
- Maker attempts own approval: deny and audit.
- Expired or payload-mismatched approval attempts execution: deny and audit.

## 7. Google Cloud verification

```powershell
gcloud run services describe treasury-api --region me-central1 --format=json
gcloud sql instances describe treasury-db --format=json
gcloud storage buckets describe gs://<evidence-bucket> --format=json
gcloud kms keys describe treasury-data --keyring treasury --location me-central1 --format=json
```

Verify organization policies, private ingress, dedicated service identities, no user-managed service-account keys, CMEK location alignment, audit logging, VPC Service Controls dry-run findings, backup/PITR configuration, retention policy, lifecycle, public-access prevention, Cloud Armor, min/max instances, and alert policies.

Do not lock a bucket retention policy during testing. Bucket Lock is irreversible and requires Legal/Compliance approval.

## 8. Restore and disaster-recovery exercise

Quarterly:

1. Record database and object-store recovery points.
2. Restore into an isolated recovery project.
3. Run schema, row-count, checksum, ledger-balance, audit-chain, and tenant-isolation validations.
4. Measure actual RPO/RTO and compare with targets.
5. For approved cross-region DR, execute controlled replica switchover/failover, fence the former primary to prevent split brain, then rebuild protection.
6. Record evidence, deviations, owners, and due dates.

## 9. Observability and incident acceptance

Inject a unique correlation ID through UI → API → database/outbox → worker → provider adapter → audit receipt. Verify one trace and redacted structured logs. Alert tests must cover authentication attack, tenant-policy denial spike, ingestion backlog, reconciliation failure, outbox age, database saturation, event disconnect rate, backup failure, audit-chain failure, and key-access anomaly.

Incident drills: tenant-data exposure, compromised privileged account, malicious evidence file, duplicate posting, provider outage, lost region, and audit-storage policy violation. Each drill must identify commander, finance-control decision owner, containment, evidence preservation, customer/regulatory communication decision, recovery, and post-incident actions.

## 10. Production canary

The first production tenant is read-only and uses approved minimized data. Enable ingestion in shadow/compare mode, then reconciliation proposals, then human decisions. External posting, payment initiation, and outbound communication remain disabled. Each capability advances only after its error budget, integrity queries, audit completeness, and rollback test pass.

