import { toNextJsHandler } from "better-auth/next-js";

import { withDatabase } from "@/lib/api-auth";
import { auth } from "@/lib/auth";

const handlers = toNextJsHandler(auth);

export async function GET(request: Request) {
  return withDatabase(() => handlers.GET(request));
}

export async function POST(request: Request) {
  return withDatabase(() => handlers.POST(request));
}

export async function PATCH(request: Request) {
  return withDatabase(() => handlers.PATCH(request));
}

export async function PUT(request: Request) {
  return withDatabase(() => handlers.PUT(request));
}

export async function DELETE(request: Request) {
  return withDatabase(() => handlers.DELETE(request));
}
