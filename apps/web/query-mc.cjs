const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

async function main() {
  const env = fs.readFileSync(
    path.join("D:\\Projetos\\nexohub\\apps\\web", ".env"),
    "utf8",
  );
  const m =
    env.match(/^DATABASE_URL="([^"]+)"/m) ||
    env.match(/^DATABASE_URL=([^\r\n]+)/m);
  const url = m ? m[1].trim() : null;
  if (!url) throw new Error("no DATABASE_URL");
  const pool = new Pool({ connectionString: url });
  const res = await pool.query(
    'SELECT id, "organizationId", type, title, symbol, issue, "createdAt" FROM "MeetingContent" ORDER BY "createdAt" DESC LIMIT 30',
  );
  console.log(JSON.stringify(res.rows, null, 1));
  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
