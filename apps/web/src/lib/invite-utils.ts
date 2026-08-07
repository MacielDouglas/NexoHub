import { randomInt } from "node:crypto";

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueSlug(
  name: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || "organizacao";
  let slug = base;
  let suffix = 2;
  while (await isTaken(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export function generateTokenCode(): string {
  return randomInt(0, 10_000_000_000).toString().padStart(10, "0");
}

export async function generateUniqueTokenCode(
  isTaken: (code: string) => Promise<boolean>,
): Promise<string> {
  let code = generateTokenCode();
  while (await isTaken(code)) {
    code = generateTokenCode();
  }
  return code;
}
