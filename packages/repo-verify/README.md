# yashkhou-repo-verify

Independent executable acceptance gates and evidence for AI-generated code.

Create `repo-verify.json`:

```json
{
  "maxChangedFiles": 30,
  "allowedPaths": ["src/", "test/"],
  "forbiddenPatterns": ["eval("],
  "commands": [
    { "name": "test", "run": "npm test" },
    { "name": "build", "run": "npm run build" }
  ]
}
```

Then run:

```bash
npx yashkhou-repo-verify verify
```

Evidence is written to `.repo-verify/evidence.json` and `.repo-verify/evidence.md` with an evidence digest for the checked state.

Repository: https://github.com/yashkhou/verify
