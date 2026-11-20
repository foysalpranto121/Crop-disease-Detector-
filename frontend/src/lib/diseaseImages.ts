/*
 * Reference photos for each disease class (3 per class). PlantVillage classes use photos from the PlantVillage
 * dataset (backend/scripts/fetch_disease_images.py); rice and soybean classes use public field datasets on
 * Hugging Face (backend/scripts/fetch_extra_photos.py). Files live in public/diseases/, listed in manifest.json.
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

/** i18n key of the photo credit line: specialist-model classes ("rice:...") use field-dataset photos. */
export function photoCreditKey(classLabel: string): "library.photo_credit" | "library.photo_credit_field" {
  return classLabel.includes(":") ? "library.photo_credit_field" : "library.photo_credit";
}

export function diseaseImages(classLabel: string): string[] {
  const slug = slugify(classLabel);
  return Array.from({ length: IMAGES_PER_DISEASE }, (_, i) => `/diseases/${slug}-${i + 1}.jpg`);
}
