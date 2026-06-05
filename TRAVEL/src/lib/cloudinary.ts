import crypto from "node:crypto";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim()
  );
}

function signParams(params: Record<string, string>, apiSecret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + apiSecret).digest("hex");
}

export async function uploadImageBuffer(
  buffer: Buffer,
  mimeType: string,
  folder = "maghreb-voyage/trips"
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY!.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET!.trim();

  const timestamp = String(Math.round(Date.now() / 1000));
  const params: Record<string, string> = { folder, timestamp };
  const signature = signParams(params, apiSecret);

  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  const form = new FormData();
  form.append("file", blob, "upload.jpg");
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  const data = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Échec upload Cloudinary.");
  }

  return { url: data.secure_url, publicId: data.public_id || "" };
}
