/*
 * Reference photos for each disease class (3 per class), from the PlantVillage dataset —
 * the same dataset the AI model learned from. Files live in public/diseases/
 * (downloaded by backend/scripts/fetch_disease_images.py).
 *
 * slugify() must match backend/app/serializers.py and the download script.
 */

export const IMAGES_PER_DISEASE = 3;
export const PHOTO_SOURCE = "PlantVillage dataset (Hughes & Salathé, 2015)";

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function diseaseImages(classLabel: string): string[] {
  const slug = slugify(classLabel);
  return Array.from({ length: IMAGES_PER_DISEASE }, (_, i) => `/diseases/${slug}-${i + 1}.jpg`);
}
