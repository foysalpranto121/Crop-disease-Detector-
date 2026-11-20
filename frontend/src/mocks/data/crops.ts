import type { Crop } from "../../api/types";

/**
 * Supported crops. Bangladesh's main field crops come first; each has its own specialist model.
 * The rest are covered by the PlantVillage model.
 */
export const CROPS: Crop[] = [
  { key: "rice", name: { en: "Rice", bn: "ধান" }, emoji: "🌾", supported: true },
  { key: "wheat", name: { en: "Wheat", bn: "গম" }, emoji: "🌾", supported: true },
  { key: "jute", name: { en: "Jute (pests)", bn: "পাট (পোকা)" }, emoji: "🌿", supported: true },
  { key: "apple", name: { en: "Apple", bn: "আপেল" }, emoji: "🍎", supported: true },
  { key: "blueberry", name: { en: "Blueberry", bn: "ব্লুবেরি" }, emoji: "🫐", supported: true },
  { key: "cherry", name: { en: "Cherry", bn: "চেরি" }, emoji: "🍒", supported: true },
  { key: "corn", name: { en: "Corn (Maize)", bn: "ভুট্টা" }, emoji: "🌽", supported: true },
  { key: "grape", name: { en: "Grape", bn: "আঙুর" }, emoji: "🍇", supported: true },
  { key: "orange", name: { en: "Orange", bn: "কমলা" }, emoji: "🍊", supported: true },
  { key: "peach", name: { en: "Peach", bn: "পীচ" }, emoji: "🍑", supported: true },
  { key: "pepper", name: { en: "Bell Pepper", bn: "ক্যাপসিকাম" }, emoji: "🫑", supported: true },
  { key: "potato", name: { en: "Potato", bn: "আলু" }, emoji: "🥔", supported: true },
  { key: "raspberry", name: { en: "Raspberry", bn: "রাস্পবেরি" }, emoji: "🌱", supported: true },
  { key: "soybean", name: { en: "Soybean", bn: "সয়াবিন" }, emoji: "🫘", supported: true },
  { key: "squash", name: { en: "Squash", bn: "স্কোয়াশ" }, emoji: "🎃", supported: true },
  { key: "strawberry", name: { en: "Strawberry", bn: "স্ট্রবেরি" }, emoji: "🍓", supported: true },
  { key: "tomato", name: { en: "Tomato", bn: "টমেটো" }, emoji: "🍅", supported: true },
];

export const SUPPORTED_CROPS = CROPS.filter((c) => c.supported);
export const COMING_SOON_CROPS = CROPS.filter((c) => !c.supported);

export function cropByKey(key: string): Crop {
  const crop = CROPS.find((c) => c.key === key);
  if (!crop) throw new Error(`Unknown crop: ${key}`);
  return crop;
}

/** Crops served by a newer specialist model that is still in beta (shown with a "Beta" label). */
export const BETA_CROPS: ReadonlySet<string> = new Set(["rice", "wheat", "jute", "soybean"]);
/** Crops whose model recognises insect pests rather than leaf diseases. */
export const PEST_CROPS: ReadonlySet<string> = new Set(["jute"]);
