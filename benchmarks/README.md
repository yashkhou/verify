# Starter failure benchmark

This small benchmark plants four deterministic failure classes across the three tools:

1. a DOCX with an unreplaced placeholder;
2. an XLSX package with a cached `#REF!` error;
3. an agent-written code change containing a forbidden execution primitive;
4. an irreversible action attempted without approval, plus a failed action that must compensate.

Run it with `npm run benchmark`.

The benchmark is intentionally small and transparent. It is not a model leaderboard and does not claim representative failure rates. The next research step is a larger public corpus of real agent-generated deliverables with frozen scoring rules and raw outputs.
