# Roadmap

Verify is early. The next work is focused on making the checks harder to bypass and the evidence more useful to maintainers.

## Near term

- Move npm releases to GitHub Actions trusted publishing with provenance.
- Expand the public failure benchmark from five planted cases into a versioned corpus with expected outcomes.
- Harden Repo Verify's command/config trust boundary and add Windows coverage.
- Add stronger PDF and Office validation without pretending to replace full application rendering.
- Add signed or externally anchored evidence receipts for CI use.

## Maintainer workflow

- Turn confirmed bugs into regression tests before fixing them.
- Keep release notes tied to verified commits and executable evidence.
- Add opt-in AI-assisted triage/review only where deterministic checks remain the acceptance gate.
- Document compatibility changes and security boundaries before broadening scope.

Roadmap items are priorities, not promises. Issues should link to a concrete failure mode or maintainer need before implementation.
