import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { errorResponse, requireOwner } from "@/lib/api";
import { HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";

function imageExtension(bytes: Buffer) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  return null;
}

export async function POST(request: Request) {
  try {
    await requireOwner();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError("Choose an image.");
    if (file.size > 2 * 1024 * 1024) throw new HttpError("Image must be 2 MB or smaller after compression.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = imageExtension(bytes);
    if (!extension) throw new HttpError("Upload a JPEG, PNG, or WebP image.");
    const filename = `${crypto.randomUUID()}.${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), bytes);
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    return errorResponse(error);
  }
}
