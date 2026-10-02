import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "binso-one",
      version: process.env.npm_package_version ?? "0.10.0",
      release: process.env.GITHUB_SHA?.slice(0, 7) ?? process.env.WEBSITE_INSTANCE_ID?.slice(0, 7) ?? "development",
      uptimeSeconds: Math.round(process.uptime()),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
