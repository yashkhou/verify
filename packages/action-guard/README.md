# yashkhou-action-guard

Transaction safety primitives for AI agent actions: approval, idempotency, rollback, compensation and hash-chained local receipts.

```bash
npm install yashkhou-action-guard@0.1.0
```

```js
import { createTransactionManager, ActionClass } from "yashkhou-action-guard";

const tx = createTransactionManager();

await tx.run({
  id: "crm-contact-184",
  classification: ActionClass.REVERSIBLE,
  snapshot: () => crm.getContact(184),
  execute: () => crm.updateContact(184, patch),
  rollback: previous => crm.replaceContact(184, previous)
});
```

Irreversible actions are blocked unless explicitly approved. Compensable actions can run a compensating operation after failure. Committed action IDs are deduplicated.

Repository: https://github.com/yashkhou/verify
