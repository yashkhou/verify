# Contributing

Thanks for helping improve Yashkhou Verify. The project is intentionally small and evidence-driven: changes should be easy to reproduce, test, and review.

## Local setup

```bash
git clone https://github.com/yashkhou/verify.git
cd verify
npm ci
npm test
npm run benchmark
npm run smoke
```

Node.js 20+ is supported.

## Pull requests

- Keep each PR focused on one problem.
- Add or update tests for behavior changes and bug fixes.
- Explain the failure mode being addressed and how the change is verified.
- Do not weaken verification rules only to make a test pass.
- Run the full test, benchmark, and smoke suite before requesting review.

For larger changes, open an issue first so the verification contract can be agreed before implementation.
