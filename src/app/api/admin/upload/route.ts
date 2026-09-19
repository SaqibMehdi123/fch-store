import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAllowedImage, MAX_SCREENSHOT_BYTES, saveMediaImage } from "@/lib/upload";

/**
 * Admin media upload (banners, product images).
 * Session-gated; jpg/png/webp only, ≤ 5MB. Returns the public URL to store.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload — expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  const folderRaw = form.get("folder");
  const folder = typeof folderRaw === "string" && /^[a-z0-9-]{2,30}$/.test(folderRaw) ? folderRaw : "media";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!isAllowedImage(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG or WebP images are allowed." }, { status: 415 });
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    return NextResponse.json({ error: "Image is larger than 5MB." }, { status: 413 });
  }

  try {
    const url = await saveMediaImage(file, folder);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed — please retry." },
      { status: 500 },
    );
  }
}
