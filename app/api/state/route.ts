import { NextResponse } from "next/server";

import { getAppState } from "@/lib/app-state";

export async function GET() {
  const state = await getAppState();
  return NextResponse.json(state);
}
