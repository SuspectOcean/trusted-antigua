// Regenerates the taxonomy seed block used by db/2026-10-21-launch-audit-fixes.sql
// (and any later taxonomy migration). Run after editing lib/categories.js:
//   node db/scripts/gen-taxonomy-seed.mjs > db/<date>-taxonomy-seed.sql
// then paste the output into the Supabase SQL editor. The DB copy must match
// the code copy, otherwise provider inserts with new categories are rejected.
import { CATEGORIES } from "../../lib/categories.js";
const rows = CATEGORIES.map((c) => `  ('${c.id}', '${c.group}', '${c.name.replace(/'/g, "''")}')`).join(",\n");
console.log(`insert into public.taxonomy (id, group_id, name) values\n${rows}\non conflict (id) do update set group_id = excluded.group_id, name = excluded.name, retired_at = null;`);
