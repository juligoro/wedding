import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dbPath = join(root, "prisma", "dev.db");
const migrationPath = join(
  root,
  "prisma",
  "migrations",
  "20260601151000_init_rsvp",
  "migration.sql",
);

await mkdir(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
const exists = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Rsvp'")
  .get();

if (!exists) {
  db.exec(await readFile(migrationPath, "utf8"));
}

db.close();
