import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dbPath = join(root, "prisma", "dev.db");
const migrationPaths = [
  join(root, "prisma", "migrations", "20260601151000_init_rsvp", "migration.sql"),
  join(root, "prisma", "migrations", "20260601193000_add_guest_tables", "migration.sql"),
  join(root, "prisma", "migrations", "20260601201000_add_guest_tags", "migration.sql"),
];

await mkdir(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
const exists = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Rsvp'")
  .get();

if (!exists) {
  for (const migrationPath of migrationPaths) {
    db.exec(await readFile(migrationPath, "utf8"));
  }
} else {
  const guestExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Guest'")
    .get();

  if (!guestExists) {
    db.exec(await readFile(migrationPaths[1], "utf8"));
  }

  const guestColumns = db.prepare("PRAGMA table_info('Guest')").all();
  const hasTags = guestColumns.some((column) => column.name === "tags");

  if (!hasTags) {
    db.exec(await readFile(migrationPaths[2], "utf8"));
  }
}

db.close();
