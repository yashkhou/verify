# Releasing

The repository uses npm trusted publishing so releases can be produced from GitHub Actions without a long-lived npm token.

## One-time npm setup

For each public package, configure `yashkhou/verify` and `.github/workflows/release.yml` as the trusted GitHub Actions publisher in npm package settings.

## Release checklist

1. Update the package version and changelog.
2. Run `npm test`, `npm run benchmark`, and `npm run smoke`.
3. Merge the reviewed change to `main`.
4. Run the **Publish npm packages** workflow manually.
5. Verify each changed version with `npm view <package> version`.
6. Create the matching GitHub release only after the registry version is live.

The workflow skips packages whose local version already matches npm, so a partial monorepo release does not attempt to republish unchanged packages.

Current note: Repo Verify and Action Guard are prepared at 0.1.1 locally, while npm still serves 0.1.0. Do not describe 0.1.1 as published until the trusted publisher is configured and the workflow succeeds.
