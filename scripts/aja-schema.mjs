#!/usr/bin/env node
/** Luo taulut (db/schema.sql) tietokantaan ilman psql:ää: DATABASE_URL=... node scripts/aja-schema.mjs */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) { console.error("DATABASE_URL puuttuu"); process.exit(1); }
const sql = postgres(url, { ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : "require", max: 1, prepare: false });
await sql.unsafe(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
const taulut = await sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`;
console.log("Taulut:", taulut.map((t) => t.table_name).join(", "));
await sql.end();
