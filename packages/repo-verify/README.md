# yashkhou-repo-verify

Independent executable acceptance gates and evidence for AI-generated code.

```bash
npm install yashkhou-repo-verify
```

Create `repo-verify.json`:

```json
{
  "maxChangedFiles": 30,
  "allowedPaths": ["src/", "test/"],
  "forbiddenPatterns": ["eval("],
  "scanIgnorePaths": ["repo-verify.json"],
  "requireArgvCommands": true,
  "commands": [
    { "name": "test", "argv": ["npm", "test"] },
    { "name": "build", "argv": ["npm", "run", "build"] }
  ]
}
```

Then run:

```bash
npx yashkhou-repo-verify verify
```

Evidence is written to `.repo-verify/evidence.json` and `.repo-verify/evidence.md` with an evidence digest for the checked state. Prefer structured `argv` commands; legacy `run` strings invoke a shell and can be disabled with `requireArgvCommands`.

Repository: https://github.com/yashkhou/verify
