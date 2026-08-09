import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

const handler = toNextJsHandler(auth);

export const GET = async (req: Request) => {
  console.log("[auth] GET", req.url);
  return handler.GET(req);
};

export const POST = async (req: Request) => {
  console.log("[auth] POST", req.url);
  return handler.POST(req);
};
