# yashkhou-artifact-verify

Deterministic CI checks for AI-generated XLSX, PPTX, DOCX and PDF artifacts.

```bash
npm install yashkhou-artifact-verify@0.1.0
npx yashkhou-artifact-verify@0.1.0 check report.docx --rules artifact-verify.json
```

Example rules:

```json
{
  "requiredText": ["FY2026", "Source:"],
  "forbiddenText": ["DRAFT"],
  "forbidPlaceholders": true,
  "minBytes": 1000
}
```

The command exits non-zero when a check fails and can emit a JSON evidence report with `--json` or `--out report.json`.

Current scope is intentionally deterministic: package structure, required/forbidden text, placeholder detection, cached Excel formula errors and basic PDF checks. It does not claim full semantic or visual correctness.

Repository: https://github.com/yashkhou/verify

Artifact Verify also validates core Office package roots, internal `.rels` targets, cached Excel formula errors, and basic PDF trailer structure (`startxref` + terminal `%%EOF`) without claiming full rendering or workbook recalculation.
