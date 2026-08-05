import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Sex } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada.");
}

if (!connectionString.startsWith("postgresql://")) {
  throw new Error(
    "DATABASE_URL inválida. Ela precisa começar com postgresql://",
  );
}

const adapter = new PrismaPg({
  connectionString: normalizeSslMode(connectionString),
});

function normalizeSslMode(url: string): string {
  if (url.includes("sslmode=require")) {
    return url.replace("sslmode=require", "sslmode=verify-full");
  }
  return url;
}

export const prisma = new PrismaClient({ adapter });
export { Sex };
