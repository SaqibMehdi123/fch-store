import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

/**
 * Serves locally-stored payment screenshots (sandbox/dev fallback when
 * Cloudinary isn't configured). Filenames are unguessable
 * (orderNo-timestamp-random) and the uploads folder is never listed.
 */
const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;

  // strict filename guard: [A-Za-z0-9-]+\.ext
  if (!/^[A-Za-z0-9-]+\.(jpg|png|webp)$/.test(file)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buf = await readFile(path.join(process.cwd(), "uploads", "payments", file));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[file.split(".").pop() ?? "jpg"],
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
