import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { MAX_EXPANDED_BYTES, MAX_UPLOAD_BYTES } from "./constants";
import {
  detectType,
  type ExtractType,
  extractSongbook,
  extractTalks,
  extractWatchtower,
  extractWorkbook,
  getPublicationMeta,
} from "./extract-all";
import { unzipToDir } from "./unzip";

export type JwpubImportResult = {
  type: ExtractType;
  title: string;
  symbol: string | null;
  coverTitle: string | null;
  issue: string | null;
  items: Record<string, unknown>[];
};

function assertPathInside(root: string, target: string): void {
  const r = resolve(root) + sep;
  const t = resolve(target);
  if (t !== resolve(root) && !t.startsWith(r)) {
    throw Object.assign(new Error("Manifest inválido"), {
      code: "BAD_MANIFEST",
    });
  }
}

function resolveDbPath(inner: string, fileName: unknown): string {
  if (typeof fileName !== "string" || !fileName) {
    throw Object.assign(new Error("Manifest inválido"), {
      code: "BAD_MANIFEST",
    });
  }
  const normalized = fileName.replace(/\\/g, "/");
  if (
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    /^[a-zA-Z]:/.test(normalized)
  ) {
    throw Object.assign(new Error("Manifest inválido"), {
      code: "BAD_MANIFEST",
    });
  }
  const dbPath = join(inner, normalized);
  assertPathInside(inner, dbPath);
  return dbPath;
}

export async function extractJwpub(buffer: Buffer): Promise<JwpubImportResult> {
  if (buffer.length <= 0 || buffer.length > MAX_UPLOAD_BYTES) {
    throw Object.assign(new Error("Tamanho inválido"), { code: "BAD_SIZE" });
  }
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw Object.assign(new Error("ZIP inválido"), { code: "BAD_MAGIC" });
  }

  const tempDir = await mkdtemp(join(tmpdir(), "jwpub-x-"));
  try {
    const filePath = join(tempDir, `${randomUUID()}.jwpub`);
    await writeFile(filePath, buffer);

    const outer = join(tempDir, "outer");
    const inner = join(tempDir, "inner");
    await mkdir(outer, { recursive: true });
    await mkdir(inner, { recursive: true });

    await unzipToDir(filePath, outer, { maxTotalBytes: MAX_EXPANDED_BYTES });
    const manifest = JSON.parse(
      await readFile(join(outer, "manifest.json"), "utf8"),
    );
    await unzipToDir(join(outer, "contents"), inner, {
      maxTotalBytes: MAX_EXPANDED_BYTES,
    });
    const db = new DatabaseSync(
      resolveDbPath(inner, manifest.publication?.fileName),
      {
        readOnly: true,
      },
    );

    try {
      const { type, pub } = detectType(db);
      const meta = getPublicationMeta(db, pub);
      let title = "";
      const symbol: string | null = meta.symbol || null;
      let coverTitle: string | null = null;
      let issue: string | null = null;
      let items: Record<string, unknown>[] = [];

      switch (type) {
        case "workbook": {
          const data = extractWorkbook(db, pub);
          title = String(data.nomeApostila || meta.title || "");
          coverTitle = data.coverTitle || null;
          issue = meta.issue;
          items = data.semanas;
          break;
        }
        case "watchtower": {
          const data = extractWatchtower(db, pub);
          title = String(meta.title || data.title || "A Sentinela");
          coverTitle = meta.coverTitle || null;
          issue = meta.issue;
          items = data.studies;
          break;
        }
        case "talks": {
          title = String(meta.title || "Discursos");
          items = extractTalks(db).map((r) => ({
            number: r.number,
            theme: r.theme,
          }));
          break;
        }
        case "songbook": {
          title = String(meta.title || "Cânticos");
          items = extractSongbook(db).map((r) => ({
            number: r.songNumber,
            theme: r.theme,
          }));
          break;
        }
      }

      return { type, title, symbol, coverTitle, issue, items };
    } finally {
      db.close();
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
