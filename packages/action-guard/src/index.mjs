import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const ActionClass = Object.freeze({
  REVERSIBLE: "reversible",
  COMPENSABLE: "compensable",
  IRREVERSIBLE: "irreversible"
});

function stable(value) {
  return JSON.stringify(value, Object.keys(value || {}).sort());
}

function digest(prev, event) {
  return crypto.createHash("sha256").update((prev || "") + stable(event)).digest("hex");
}

export class FileJournal {
  constructor(filePath = ".action-guard/journal.jsonl") {
    this.filePath = path.resolve(filePath);
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.filePath)) fs.writeFileSync(this.filePath, "");
  }

  read() {
    return fs.readFileSync(this.filePath, "utf8").split("\n").filter(Boolean).map(line => JSON.parse(line));
  }

  append(event) {
    const rows = this.read();
    const prevHash = rows.at(-1)?.hash || "";
    const body = { ...event, at: event.at || new Date().toISOString(), prevHash };
    const row = { ...body, hash: digest(prevHash, body) };
    fs.appendFileSync(this.filePath, JSON.stringify(row) + "\n");
    return row;
  }
  verify() {
    const rows = this.read();
    let prev = "";
    for (const row of rows) {
      const { hash, ...body } = row;
      if (body.prevHash !== prev || digest(prev, body) !== hash) return false;
      prev = hash;
    }
    return true;
  }
}

export class TransactionManager {
  constructor({ journal = new FileJournal(), approve } = {}) {
    this.journal = journal;
    this.approve = approve;
  }

  findCommitted(id) {
    return this.journal.read().findLast?.(r => r.id === id && r.phase === "committed")
      || [...this.journal.read()].reverse().find(r => r.id === id && r.phase === "committed");
  }

  async run(action) {
    const id = action.id || crypto.randomUUID();
    const classification = action.classification || ActionClass.REVERSIBLE;
    const previous = this.findCommitted(id);
    if (previous) return { ok: true, id, deduplicated: true, result: previous.result };

    this.journal.append({ id, phase: "planned", classification, metadata: action.metadata ?? {} });

    if (classification === ActionClass.IRREVERSIBLE) {
      const decision = action.approved === true || (this.approve && await this.approve({ id, action }));
      this.journal.append({ id, phase: "approval", approved: Boolean(decision) });
      if (!decision) {
        this.journal.append({ id, phase: "blocked", reason: "approval_required" });
        return { ok: false, id, blocked: true, reason: "approval_required" };
      }
    }

    let snapshot;
    if (classification === ActionClass.REVERSIBLE && action.snapshot) {
      snapshot = await action.snapshot();
      this.journal.append({ id, phase: "snapshot", snapshot });
    }
    try {
      this.journal.append({ id, phase: "executing" });
      const result = await action.execute();
      this.journal.append({ id, phase: "committed", result });
      return { ok: true, id, result, classification };
    } catch (error) {
      this.journal.append({ id, phase: "failed", error: error.message });
      try {
        if (classification === ActionClass.REVERSIBLE && action.rollback) {
          const recovery = await action.rollback(snapshot);
          this.journal.append({ id, phase: "rolled_back", recovery });
          return { ok: false, id, error: error.message, recovered: true, recovery: "rollback" };
        }
        if (classification === ActionClass.COMPENSABLE && action.compensate) {
          const recovery = await action.compensate(error);
          this.journal.append({ id, phase: "compensated", recovery });
          return { ok: false, id, error: error.message, recovered: true, recovery: "compensation" };
        }
      } catch (recoveryError) {
        this.journal.append({ id, phase: "recovery_failed", error: recoveryError.message });
        throw new AggregateError([error, recoveryError], "Action and recovery both failed");
      }
      throw error;
    }
  }
}

export function createTransactionManager(options) {
  return new TransactionManager(options);
}
