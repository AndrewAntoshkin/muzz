import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth";
import { storageConfigured, storageDriver } from "@/lib/storage";

const { files } = schema;

export async function GET() {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select({
      id: files.id,
      kind: files.kind,
      filename: files.filename,
      mime: files.mime,
      bytes: files.bytes,
      url: files.url,
      status: files.status,
      createdAt: files.createdAt,
    })
    .from(files)
    .where(eq(files.ownerUserId, me.id))
    .orderBy(desc(files.createdAt));
  return NextResponse.json({
    storage: storageConfigured() ? storageDriver() : null,
    files: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
  });
}
