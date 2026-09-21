# Changelog

## Unreleased

### Repo Verify

- Include untracked files in changed-file verification so new files cannot bypass scope or forbidden-pattern checks.
- Add `scanIgnorePaths` for configuration and generated evidence that intentionally contain pattern literals.
- Add regression coverage for out-of-scope files, command failures, and scan exclusions.

### Action Guard

- Canonicalize nested objects before hashing journal events so nested metadata and result changes are covered by the tamper-evident chain.
- Add regression coverage for nested-data tampering and compensating recovery.

### Repository

- Test Node.js 20 and 22 in CI.
- Add contribution, security, conduct, pull-request, and maintainer-automation documentation.
- Expand Artifact Verify regression coverage for unsupported files, corrupt Office containers, and cached Excel formula errors.

## 0.1.0 — 2026-09-21

Initial public release of Artifact Verify, Repo Verify, and Action Guard with CI, smoke tests, and a five-case planted-failure benchmark.
