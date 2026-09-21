# Yashkhou Verify launch strategy

## Category

Do not launch these as three unrelated startups. Launch one category thesis:

> **AI made creation cheap. Proof is now the bottleneck.**

Yashkhou Verify is the verification layer between AI output and the real world. Artifact Verify, Repo Verify and Action Guard are three entry points into the same problem.

## Primary wedge

Lead publicly with **Artifact Verify**. It has the clearest before/after story for non-developer AI work, a demo that is understandable in seconds, and a broad surface area across finance, consulting, operations and AI-agent builders.

Use **Repo Verify** as the developer-native proof product and **Action Guard** as the deeper infrastructure story. Both cross-link back to the umbrella thesis.

## Launch motion

1. Open-source the working tools and keep installation friction near zero.
2. Publish reproducible failure examples, not abstract AI commentary.
3. Make every report shareable: PASS/FAIL output, evidence digest, and CI badge.
4. Create a public benchmark repository of intentionally broken AI-generated artifacts and agent PRs.
5. Seed GitHub, Hacker News, X, Reddit developer communities and agent-framework communities with the benchmark/result—not a generic product announcement.
6. Turn repeated enterprise requests into paid hosted runners, private policy packs and audit retention rather than paywalling the local CLI.

## Highest-probability content angle

The best distribution asset is a public **AI Output Failure Benchmark**. Generate a set of realistic spreadsheets, decks, documents and agent-written code changes with subtle planted defects. Run leading agents through the tasks, then show what normal review misses and what Yashkhou Verify catches.

The headline should be evidence-first:

> We gave AI agents 100 real deliverables. Here is what broke after they said they were done.

Do not claim model rankings unless the benchmark is reproducible and current. Publish the corpus, scoring rules and raw outputs so others can rerun it.

## Monetization path

Keep local CLIs/SDK MIT licensed. Monetize operational requirements that companies do not want to build themselves:

- hosted verification runners and artifact retention;
- policy packs for finance, consulting, legal operations and internal engineering;
- GitHub organization controls and required merge gates;
- signed evidence receipts and audit history;
- private runners/VPC deployment;
- shared action-adapter registry for Action Guard.

Initial pricing should be tested, not asserted. A sensible experiment is free local tooling, a low-cost hosted individual tier, team usage pricing, then enterprise private deployment.

## Product-specific acquisition

**Artifact Verify:** finance/consulting/ops creators, AI-office tooling teams, agent builders. Demo one silent spreadsheet/deck defect and a one-command fail.

**Repo Verify:** GitHub, coding-agent communities, CI/CD teams. Distribution surface is the pull request itself: evidence comment, badge and required check.

**Action Guard:** agent-framework maintainers and teams automating consequential SaaS actions. Lead with an irreversible-action demo, then show the same workflow with approval + rollback/compensation receipts.

## Kill criteria

If users only run the tools as curiosities, do not build a hosted platform. The signal to continue is repeated use in CI/agent pipelines, requests for organization policy, retention, integrations, signed evidence, or private deployment.
