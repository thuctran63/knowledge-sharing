import { NextResponse } from "next/server";
import {
  cleanupOldPostViews,
  processPendingDeletions,
} from "@/services/upload.service";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [deletedViews, r2Result] = await Promise.all([
    cleanupOldPostViews(),
    processPendingDeletions(),
  ]);

  return NextResponse.json({
    deletedPostViews: deletedViews,
    r2: r2Result,
  });
}
