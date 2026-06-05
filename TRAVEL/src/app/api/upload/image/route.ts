import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";
import { isLocalUploadEnabled, saveLocalUpload } from "@/lib/local-upload";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.id ||
    (session.user.role !== "AGENCY" && session.user.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const useCloudinary = isCloudinaryConfigured();
  const useLocalDisk = !useCloudinary && isLocalUploadEnabled();

  if (!useCloudinary && !useLocalDisk) {
    return NextResponse.json(
      {
        error:
          "Upload indisponible. Configurez CLOUDINARY_* dans .env ou utilisez une URL.",
      },
      { status: 503 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder =
      String(form.get("folder") || "maghreb-voyage/trips").trim() ||
      "maghreb-voyage/trips";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
    }

    const mime = file.type || "image/jpeg";
    if (!ALLOWED.has(mime)) {
      return NextResponse.json(
        { error: "Format accepté : JPEG ou PNG (max 5 Mo)." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image trop lourde (max 5 Mo)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, publicId } = useCloudinary
      ? await uploadImageBuffer(buffer, mime, folder)
      : await saveLocalUpload(buffer, mime, folder);

    return NextResponse.json({ success: true, url, publicId, storage: useCloudinary ? "cloudinary" : "local" });
  } catch (error) {
    console.error("POST /api/upload/image", error);
    const message =
      error instanceof Error ? error.message : "Upload impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
