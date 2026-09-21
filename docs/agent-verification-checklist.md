# Agent verification checklist

Use this before merging AI-assisted repository changes.

1. **Scope the diff** — confirm every changed file belongs to the requested task and no unrelated files were modified.
2. **Run deterministic checks** — execute the repository's tests, lint, typecheck, build, and any project-specific verification commands.
3. **Inspect risky paths** — review authentication, permissions, destructive actions, dependency changes, generated artifacts, and external side effects separately.
4. **Verify the user journey** — exercise the actual workflow the change is meant to improve, not only unit-level checks.
5. **Preserve evidence and rollback** — record what passed, what remains uncertain, and keep a reversible path before merging.

Verification should prove the requested outcome, not merely prove that a command exited successfully.
