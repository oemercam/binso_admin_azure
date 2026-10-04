import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "binso-one",
      version: process.env.npm_package_version ?? "0.11.0",
      release: process.env.BINSO_BUILD_SHA?.slice(0, 7) ?? "development",
      sha: process.env.BINSO_BUILD_SHA ?? "development",
      uptimeSeconds: Math.round(process.uptime()),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
