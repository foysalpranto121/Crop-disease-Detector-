export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export type ImageCheck = { ok: true } | { ok: false; reason: "UNSUPPORTED_FORMAT" | "FILE_TOO_LARGE" };

const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

export function checkImageFile(file: File): ImageCheck {
  // Some browsers/OS pickers leave file.type empty — fall back to the file extension.
  const typeOk = file.type ? ACCEPTED_TYPES.includes(file.type) : ACCEPTED_EXTENSIONS.test(file.name);
  if (!typeOk) return { ok: false, reason: "UNSUPPORTED_FORMAT" };
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: "FILE_TOO_LARGE" };
  return { ok: true };
}

async function loadBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall back to <img> below */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

/**
 * Shrink a photo in the browser before upload (max 640 px, ~50–80 KB).
 * Saves data on slow mobile connections — a 4 MB phone photo becomes ~60 KB.
 */
export async function compressImage(file: Blob, maxSide = 640, quality = 0.85): Promise<Blob> {
  const source = await loadBitmap(file);
  const w = source.width;
  const h = source.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  return blob ?? file;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
