import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import yauzl from "yauzl";

const DEFAULT_MAX = 80 * 1024 * 1024;

function assertInside(root: string, target: string) {
  const r = resolve(root) + sep;
  const t = resolve(target);
  if (t !== resolve(root) && !t.startsWith(r)) {
    throw new Error(`Path traversal bloqueado: ${target}`);
  }
}

export type UnzipOptions = {
  maxTotalBytes?: number;
};

export function unzipToDir(
  zipPath: string,
  outDir: string,
  options: UnzipOptions = {},
): Promise<void> {
  const maxTotalBytes = options.maxTotalBytes ?? DEFAULT_MAX;

  return new Promise((res, rej) => {
    let total = 0;

    yauzl.open(zipPath, { lazyEntries: true }, (err, zip) => {
      if (err || !zip) return rej(err ?? new Error("Falha ao abrir ZIP"));

      zip.readEntry();

      zip.on("error", rej);

      zip.on("entry", (entry) => {
        const name = entry.fileName.replace(/\\/g, "/");

        if (name.includes("..") || name.startsWith("/")) {
          zip.close();
          return rej(new Error(`Entrada inválida no ZIP: ${name}`));
        }

        const dest = join(outDir, name);
        assertInside(outDir, dest);

        if (/\/$/.test(name)) {
          mkdir(dest, { recursive: true })
            .then(() => zip.readEntry())
            .catch((e) => {
              zip.close();
              rej(e);
            });
          return;
        }

        total += entry.uncompressedSize ?? 0;
        if (total > maxTotalBytes) {
          zip.close();
          return rej(new Error("ZIP excede limite de expansão (zip bomb)"));
        }

        zip.openReadStream(entry, (e, stream) => {
          if (e || !stream) {
            zip.close();
            return rej(e ?? new Error("Falha ao ler entrada do ZIP"));
          }

          mkdir(dirname(dest), { recursive: true })
            .then(() => pipeline(stream, createWriteStream(dest)))
            .then(() => zip.readEntry())
            .catch((pipeErr) => {
              zip.close();
              rej(pipeErr);
            });
        });
      });

      zip.on("end", () => res());
    });
  });
}
