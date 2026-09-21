# Maintainer automation

Verify is designed for a workflow where AI can propose work without being trusted to certify its own output.

## Intended maintainer loop

1. Triage an issue or pull request and identify the failure mode.
2. Use an AI coding agent to investigate or propose a patch where useful.
3. Turn the reported failure into a deterministic regression test when possible.
4. Run package tests, the planted-failure benchmark, and smoke checks.
5. Use Repo Verify to capture executable acceptance evidence for the change.
6. Review the diff and evidence before merging or releasing.

## Good uses of API automation

- summarize and cluster issue reports;
- reproduce bugs and draft regression tests;
- inspect risky diffs and explain affected verification boundaries;
- expand benchmark cases from confirmed failures;
- prepare release notes from verified commits;
- help maintain documentation and migration notes.

## Trust boundary

Model output is advisory. A model should not be the sole judge of work it generated. Acceptance should be based on deterministic checks, executable tests, explicit approval boundaries, and reviewable evidence wherever those are available.
