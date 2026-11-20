import type { Disease, DiseaseType, L, Treatment } from "../../api/types";
import manifest from "../../../public/diseases/manifest.json";
import { diseaseImages, slugify } from "../../lib/diseaseImages";
import { cropByKey } from "./crops";
import { EXTRA_DEFS } from "./extraDiseases";

/*
 * Disease & treatment knowledge base for the 38 classes of the pre-trained model
 * `linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification` (PlantVillage).
 * Order MUST match the model's id2label (index = id - 1). `class_label` is the model's exact label.
 *
 * Dosages are typical label rates from general extension guidance (DAE/BARI/IPM style).
 * This file is also the backend database seed (frontend/scripts/export-seed.ts).
 */

type T = Omit<Treatment, "id">;
const l = (en: string, bn: string): L => ({ en, bn });

// ---------- Reusable text ----------
const D_MANCO = l("2–2.5 g per litre of water", "প্রতি লিটার পানিতে ২–২.৫ গ্রাম");
const D_2G = l("2 g per litre of water", "প্রতি লিটার পানিতে ২ গ্রাম");
const D_25G = l("2.5 g per litre of water", "প্রতি লিটার পানিতে ২.৫ গ্রাম");
const D_3G = l("3 g per litre of water", "প্রতি লিটার পানিতে ৩ গ্রাম");
const D_1ML = l("1 mL per litre of water", "প্রতি লিটার পানিতে ১ মিলি");
const D_05ML = l("0.5 mL per litre of water", "প্রতি লিটার পানিতে ০.৫ মিলি");

const PPE = l(
  "Wear gloves, mask and long sleeves. Do not spray in wind or before rain. Respect the pre-harvest waiting period on the label.",
  "গ্লাভস, মাস্ক ও লম্বা হাতার জামা পরুন। বাতাসে বা বৃষ্টির আগে স্প্রে করবেন না। লেবেলে লেখা ফসল তোলার আগের অপেক্ষার সময় মেনে চলুন।",
);
const BEES = l(
  "Toxic to bees — do not spray on open flowers. Wear protective gear.",
  "মৌমাছির জন্য ক্ষতিকর — ফোটা ফুলে স্প্রে করবেন না। সুরক্ষা সরঞ্জাম পরুন।",
);

const chem = (remedy: L, dosage: L | null = null, precautions: L = PPE): T => ({ type: "chemical", remedy, dosage, precautions });
const org = (remedy: L, precautions: L | null = null): T => ({ type: "organic", remedy, dosage: null, precautions });
const prev = (remedy: L): T => ({ type: "preventive", remedy, dosage: null, precautions: null });

interface Def {
  label: string;
  crop: string;
  name: L;
  type: DiseaseType;
  pathogen: string | null;
  symptoms: L;
  causes: L;
  treatments: T[];
}

// ---------- Shared disease groups ----------
const POWDERY_CHEM = chem(
  l(
    "Spray Hexaconazole 5 EC at the first sign of white powder; repeat after 10–14 days.",
    "সাদা পাউডার দেখা দেওয়ার সাথে সাথে হেক্সাকোনাজল ৫ ইসি স্প্রে করুন; ১০–১৪ দিন পর আবার দিন।",
  ),
  D_1ML,
);
const POWDERY_PREV = prev(
  l(
    "Prune for good air flow, give plants full sun, and avoid too much nitrogen fertiliser.",
    "বাতাস চলাচলের জন্য ছাঁটাই করুন, গাছে পূর্ণ রোদ নিশ্চিত করুন এবং অতিরিক্ত নাইট্রোজেন সার এড়িয়ে চলুন।",
  ),
);

function bacterialSpot(label: string, crop: string): Def {
  return {
    label,
    crop,
    name: l("Bacterial Spot", "ব্যাকটেরিয়াজনিত দাগ রোগ"),
    type: "bacteria",
    pathogen: "Xanthomonas spp.",
    symptoms: l(
      "Small water-soaked spots that turn dark brown, often with a yellow halo; leaves yellow and drop; fruit gets raised, scabby spots.",
      "ছোট পানিভেজা দাগ যা গাঢ় বাদামি হয়, প্রায়ই হলুদ বলয়সহ; পাতা হলুদ হয়ে ঝরে যায়; ফলে উঁচু, খসখসে দাগ হয়।",
    ),
    causes: l(
      "Xanthomonas bacteria carried on seed and transplants, spread by rain splash, wet hands and tools in warm, wet weather.",
      "জ্যান্থোমোনাস ব্যাকটেরিয়া বীজ ও চারার মাধ্যমে আসে এবং উষ্ণ, ভেজা আবহাওয়ায় বৃষ্টির ছিটা, ভেজা হাত ও যন্ত্রপাতিতে ছড়ায়।",
    ),
    treatments: [
      chem(
        l(
          "Spray copper oxychloride 50 WP mixed with Mancozeb 75 WP every 7–10 days.",
          "৭–১০ দিন পরপর কপার অক্সিক্লোরাইড ৫০ ডব্লিউপি ও ম্যানকোজেব ৭৫ ডব্লিউপি মিশিয়ে স্প্রে করুন।",
        ),
        l("3 g copper + 2 g Mancozeb per litre of water", "প্রতি লিটার পানিতে ৩ গ্রাম কপার + ২ গ্রাম ম্যানকোজেব"),
      ),
      org(
        l(
          "Remove infected leaves and badly affected plants, and do not handle plants while they are wet.",
          "আক্রান্ত পাতা ও বেশি আক্রান্ত গাছ সরিয়ে ফেলুন এবং গাছ ভেজা থাকা অবস্থায় হাত দেবেন না।",
        ),
      ),
      prev(
        l(
          "Use certified or hot-water-treated seed (50 °C for 25 minutes), rotate crops for 2–3 years and use drip irrigation.",
          "প্রত্যয়িত বা গরম পানিতে শোধিত বীজ (৫০ °সে-এ ২৫ মিনিট) ব্যবহার করুন, ২–৩ বছর শস্যপর্যায় মানুন এবং ড্রিপ সেচ দিন।",
        ),
      ),
    ],
  };
}

function earlyBlight(label: string, crop: string): Def {
  return {
    label,
    crop,
    name: l("Early Blight", "আগাম ধসা রোগ (আর্লি ব্লাইট)"),
    type: "fungus",
    pathogen: "Alternaria solani",
    symptoms: l(
      "Dark brown spots with rings inside them, like a target, often with a yellow halo; starts on older, lower leaves.",
      "ভেতরে চক্রাকার রেখাসহ গাঢ় বাদামি দাগ, দেখতে নিশানার মতো, প্রায়ই হলুদ বলয়সহ; পুরনো, নিচের পাতা থেকে শুরু হয়।",
    ),
    causes: l(
      "Fungus Alternaria solani surviving in soil and plant debris; warm weather with alternating wet and dry periods, and stressed plants.",
      "অল্টারনারিয়া সোলানি ছত্রাক, যা মাটি ও গাছের অবশিষ্টাংশে বেঁচে থাকে; উষ্ণ আবহাওয়ায় ভেজা-শুকনো পালাক্রমে এবং দুর্বল গাছে বাড়ে।",
    ),
    treatments: [
      chem(
        l(
          "Spray Mancozeb 75 WP or Chlorothalonil 75 WP every 7–10 days. For a severe attack use Difenoconazole 25 EC (0.5 mL per litre).",
          "৭–১০ দিন পরপর ম্যানকোজেব ৭৫ ডব্লিউপি বা ক্লোরোথালোনিল ৭৫ ডব্লিউপি স্প্রে করুন। তীব্র আক্রমণে ডাইফেনোকোনাজল ২৫ ইসি (প্রতি লিটারে ০.৫ মিলি) দিন।",
        ),
        D_MANCO,
      ),
      org(
        l(
          "Pick off infected lower leaves, mulch the soil, and spray a Bacillus subtilis bio-fungicide or neem oil (5 mL per litre).",
          "আক্রান্ত নিচের পাতা তুলে ফেলুন, মাটিতে মালচ দিন এবং ব্যাসিলাস সাবটিলিস জৈব ছত্রাকনাশক বা নিম তেল (প্রতি লিটারে ৫ মিলি) স্প্রে করুন।",
        ),
      ),
      prev(
        l(
          "Rotate crops for 2–3 years, use balanced fertiliser with enough potash, and avoid wetting the leaves.",
          "২–৩ বছর শস্যপর্যায় মানুন, পর্যাপ্ত পটাশসহ সুষম সার দিন এবং পাতা ভেজানো এড়িয়ে চলুন।",
        ),
      ),
    ],
  };
}

function lateBlight(label: string, crop: string): Def {
  return {
    label,
    crop,
    name: l("Late Blight", "নাবি ধসা বা মড়ক রোগ (লেট ব্লাইট)"),
    type: "oomycete",
    pathogen: "Phytophthora infestans",
    symptoms: l(
      "Large, pale-green water-soaked patches that turn dark brown to black; white fuzzy growth under leaves in humid weather. It spreads very fast and can destroy a field in days.",
      "বড়, ফ্যাকাশে-সবুজ পানিভেজা ছোপ যা গাঢ় বাদামি থেকে কালো হয়ে যায়; আর্দ্র আবহাওয়ায় পাতার নিচে সাদা তুলার মতো আস্তরণ। খুব দ্রুত ছড়ায় এবং কয়েক দিনে পুরো মাঠ নষ্ট করতে পারে।",
    ),
    causes: l(
      "Water mould Phytophthora infestans; cool (10–20 °C), foggy and humid weather; spreads by wind and infected seed tubers.",
      "ফাইটোফথোরা ইনফেস্ট্যান্স (পানির ছত্রাক); ঠান্ডা (১০–২০ °সে), কুয়াশাচ্ছন্ন ও আর্দ্র আবহাওয়ায় বাড়ে; বাতাস ও আক্রান্ত বীজআলুর মাধ্যমে ছড়ায়।",
    ),
    treatments: [
      chem(
        l(
          "Before symptoms: spray Mancozeb 75 WP as protection. After symptoms: spray Metalaxyl + Mancozeb or Cymoxanil + Mancozeb every 7 days.",
          "লক্ষণ দেখার আগে: সুরক্ষা হিসেবে ম্যানকোজেব ৭৫ ডব্লিউপি স্প্রে করুন। লক্ষণ দেখা দিলে: ৭ দিন পরপর মেটালাক্সিল + ম্যানকোজেব বা সাইমোক্সানিল + ম্যানকোজেব স্প্রে করুন।",
        ),
        D_MANCO,
        l(
          "Act immediately — this disease spreads within days. Alternate fungicide groups and wear protective gear.",
          "দেরি না করে ব্যবস্থা নিন — এই রোগ কয়েক দিনের মধ্যে ছড়ায়। ছত্রাকনাশকের গ্রুপ পাল্টে ব্যবহার করুন এবং সুরক্ষা সরঞ্জাম পরুন।",
        ),
      ),
      org(
        l(
          "Pull out and destroy infected plants (do not compost them) and spray copper hydroxide as protection.",
          "আক্রান্ত গাছ তুলে নষ্ট করুন (কম্পোস্ট করবেন না) এবং সুরক্ষা হিসেবে কপার হাইড্রক্সাইড স্প্রে করুন।",
        ),
      ),
      prev(
        l(
          "Use certified disease-free seed, earth up the rows, avoid evening irrigation and watch for foggy winter weather.",
          "প্রত্যয়িত রোগমুক্ত বীজ ব্যবহার করুন, সারিতে মাটি তুলে দিন, সন্ধ্যায় সেচ এড়িয়ে চলুন এবং শীতের কুয়াশার দিকে নজর রাখুন।",
        ),
      ),
    ],
  };
}

const HEALTHY_TIPS: Record<string, L> = {
  apple: l("Prune in winter to open the canopy and remove fallen leaves and fruit.", "শীতে ডাল ছাঁটাই করে গাছের ভেতর খোলামেলা রাখুন এবং ঝরা পাতা ও ফল সরিয়ে ফেলুন।"),
  blueberry: l("Keep the soil acidic (pH 4.5–5.5) and mulch with sawdust or pine bark.", "মাটি অম্লীয় রাখুন (pH ৪.৫–৫.৫) এবং কাঠের গুঁড়া বা পাইনের বাকল দিয়ে মালচ করুন।"),
  cherry: l("Prune for good air flow and remove root suckers.", "বাতাস চলাচলের জন্য ছাঁটাই করুন এবং গোড়ার কুশি সরিয়ে ফেলুন।"),
  corn: l("Rotate with legumes and keep proper plant spacing.", "ডালজাতীয় ফসলের সাথে শস্যপর্যায় মানুন এবং সঠিক দূরত্বে গাছ লাগান।"),
  grape: l("Train vines for an open canopy and remove old, dead wood.", "লতাগুলো খোলামেলা মাচায় সাজান এবং পুরনো মরা কাঠ সরিয়ে ফেলুন।"),
  peach: l("Prune to an open centre and avoid excess nitrogen.", "মাঝখান খোলা রেখে ছাঁটাই করুন এবং অতিরিক্ত নাইট্রোজেন এড়িয়ে চলুন।"),
  pepper: l("Use healthy seedlings and rotate with crops outside the tomato/brinjal family.", "সুস্থ চারা ব্যবহার করুন এবং টমেটো/বেগুন-জাতীয় নয় এমন ফসলের সাথে শস্যপর্যায় মানুন।"),
  potato: l("Use certified seed tubers and earth up (hill) the rows.", "প্রত্যয়িত বীজআলু ব্যবহার করুন এবং সারিতে মাটি তুলে দিন।"),
  raspberry: l("Remove old fruiting canes after harvest and keep rows narrow.", "ফল তোলার পর পুরনো ডাল কেটে ফেলুন এবং সারি সরু রাখুন।"),
  soybean: l("Use good-quality seed and rotate with cereals like maize.", "মানসম্মত বীজ ব্যবহার করুন এবং ভুট্টার মতো দানাশস্যের সাথে শস্যপর্যায় মানুন।"),
  strawberry: l("Mulch with straw to keep fruit off the soil and use drip irrigation.", "ফল মাটি থেকে দূরে রাখতে খড় দিয়ে মালচ করুন এবং ড্রিপ সেচ দিন।"),
  tomato: l("Stake plants, remove lower leaves touching the soil, and rotate crops.", "গাছে খুঁটি দিন, মাটি ছোঁয়া নিচের পাতা ছেঁটে দিন এবং শস্যপর্যায় মানুন।"),
};

function healthy(label: string, crop: string): Def {
  return {
    label,
    crop,
    name: l("Healthy", "সুস্থ"),
    type: "healthy",
    pathogen: null,
    symptoms: l("No disease signs found. The leaf looks green and normal.", "কোনো রোগের লক্ষণ পাওয়া যায়নি। পাতা সবুজ ও স্বাভাবিক দেখাচ্ছে।"),
    causes: l("Keep up good field care to keep the plant healthy.", "গাছ সুস্থ রাখতে মাঠের সঠিক যত্ন চালিয়ে যান।"),
    treatments: [
      prev(l("Inspect plants every week, including the underside of leaves, to catch problems early.", "সমস্যা আগেভাগে ধরতে প্রতি সপ্তাহে পাতার নিচের দিকসহ গাছ পরীক্ষা করুন।")),
      prev(l("Use balanced fertiliser and water at the base of the plant in the morning; avoid wetting the leaves.", "সুষম সার দিন এবং সকালে গাছের গোড়ায় পানি দিন; পাতা ভেজানো এড়িয়ে চলুন।")),
      prev(HEALTHY_TIPS[crop]),
    ],
  };
}

// ---------- The 38 classes, in model order ----------
const DEFS: Def[] = [
  // 0
  {
    label: "Apple Scab",
    crop: "apple",
    name: l("Apple Scab", "আপেলের স্ক্যাব রোগ"),
    type: "fungus",
    pathogen: "Venturia inaequalis",
    symptoms: l(
      "Olive-green to dark brown velvety spots on leaves; leaves may curl, yellow and fall early. Fruit gets dark, corky scabs.",
      "পাতায় জলপাই-সবুজ থেকে গাঢ় বাদামি মখমলের মতো দাগ পড়ে; পাতা কুঁকড়ে হলুদ হয়ে আগেভাগে ঝরে যায়। ফলে গাঢ়, শক্ত, খসখসে দাগ হয়।",
    ),
    causes: l(
      "Fungus Venturia inaequalis. It survives in fallen leaves and spreads by rain splash in cool, wet spring weather.",
      "ভেনচুরিয়া ইনইকুয়ালিস ছত্রাক। ঝরা পাতায় বেঁচে থাকে এবং ঠান্ডা, ভেজা বসন্তে বৃষ্টির ছিটায় ছড়ায়।",
    ),
    treatments: [
      chem(
        l(
          "Spray Captan 50 WP or Mancozeb 75 WP from bud break, every 7–10 days during wet weather.",
          "কুঁড়ি ফোটার সময় থেকে ভেজা আবহাওয়ায় ৭–১০ দিন পরপর ক্যাপটান ৫০ ডব্লিউপি বা ম্যানকোজেব ৭৫ ডব্লিউপি স্প্রে করুন।",
        ),
        D_MANCO,
      ),
      org(
        l(
          "Spray wettable sulphur (2–3 g per litre) and rake up and destroy fallen leaves.",
          "ভেজানো যায় এমন সালফার (প্রতি লিটারে ২–৩ গ্রাম) স্প্রে করুন এবং ঝরা পাতা জড়ো করে নষ্ট করুন।",
        ),
      ),
      prev(
        l(
          "Plant scab-resistant varieties and prune trees so air moves freely through the canopy.",
          "স্ক্যাব-প্রতিরোধী জাত লাগান এবং ডাল ছাঁটাই করে গাছের ভেতরে বাতাস চলাচল নিশ্চিত করুন।",
        ),
      ),
    ],
  },
  // 1
  {
    label: "Apple with Black Rot",
    crop: "apple",
    name: l("Black Rot", "কালো পচা রোগ"),
    type: "fungus",
    pathogen: "Botryosphaeria obtusa",
    symptoms: l(
      "Small purple spots on leaves grow into brown 'frog-eye' spots with a purple edge. Fruit rots black from the blossom end; sunken cankers form on branches.",
      "পাতায় ছোট বেগুনি দাগ বড় হয়ে বেগুনি কিনারাসহ বাদামি 'ব্যাঙের চোখ' দাগে পরিণত হয়। ফলের ফুলের দিক থেকে কালো পচন শুরু হয়; ডালে বসে যাওয়া ক্ষত (ক্যাঙ্কার) হয়।",
    ),
    causes: l(
      "Fungus Botryosphaeria obtusa, which lives in dead wood, cankers and dried 'mummy' fruit, and spreads in warm, wet weather.",
      "বোট্রায়োস্ফেরিয়া অবটুসা ছত্রাক, যা মরা কাঠ, ক্যাঙ্কার ও শুকনো 'মমি' ফলে বেঁচে থাকে এবং উষ্ণ, ভেজা আবহাওয়ায় ছড়ায়।",
    ),
    treatments: [
      chem(
        l(
          "Spray Captan 50 WP every 10–14 days from petal fall until harvest in wet seasons.",
          "ভেজা মৌসুমে পাপড়ি ঝরার পর থেকে ফল তোলা পর্যন্ত ১০–১৪ দিন পরপর ক্যাপটান ৫০ ডব্লিউপি স্প্রে করুন।",
        ),
        D_2G,
      ),
      org(
        l(
          "Cut out cankers and dead branches 15 cm below the infection, remove mummified fruit, and spray copper oxychloride (3 g per litre) at the dormant stage.",
          "সংক্রমণের ১৫ সেমি নিচ থেকে ক্যাঙ্কার ও মরা ডাল কেটে ফেলুন, মমি হওয়া ফল সরান এবং সুপ্ত অবস্থায় কপার অক্সিক্লোরাইড (প্রতি লিটারে ৩ গ্রাম) স্প্রে করুন।",
        ),
      ),
      prev(
        l(
          "Keep the orchard clean, avoid wounding trees, and burn or bury pruned wood.",
          "বাগান পরিষ্কার রাখুন, গাছে আঘাত এড়িয়ে চলুন এবং ছাঁটাই করা ডাল পুড়িয়ে বা পুঁতে ফেলুন।",
        ),
      ),
    ],
  },
  // 2
  {
    label: "Cedar Apple Rust",
    crop: "apple",
    name: l("Cedar Apple Rust", "সিডার আপেল মরিচা রোগ"),
    type: "fungus",
    pathogen: "Gymnosporangium juniperi-virginianae",
    symptoms: l(
      "Bright yellow-orange spots on the upper leaf surface that later show tiny black dots; small tube-like growths form under the leaf.",
      "পাতার ওপরের দিকে উজ্জ্বল হলুদ-কমলা দাগ, পরে তাতে ছোট কালো বিন্দু দেখা যায়; পাতার নিচে ছোট নলের মতো গঠন তৈরি হয়।",
    ),
    causes: l(
      "A rust fungus that needs juniper (cedar) trees to complete its life cycle. Spores blow from cedar galls in spring rain.",
      "একটি মরিচা ছত্রাক, যার জীবনচক্র সম্পূর্ণ করতে জুনিপার (সিডার) গাছ দরকার। বসন্তের বৃষ্টিতে সিডারের গুটি থেকে রেণু উড়ে আসে।",
    ),
    treatments: [
      chem(
        l(
          "Spray Mancozeb 75 WP from pink bud stage until 2–3 weeks after petal fall, every 7–10 days.",
          "গোলাপি কুঁড়ি অবস্থা থেকে পাপড়ি ঝরার ২–৩ সপ্তাহ পর পর্যন্ত ৭–১০ দিন পরপর ম্যানকোজেব ৭৫ ডব্লিউপি স্প্রে করুন।",
        ),
        D_2G,
      ),
      org(
        l(
          "Spray wettable sulphur (2–3 g per litre) and remove orange galls from nearby juniper trees.",
          "ভেজানো যায় এমন সালফার (প্রতি লিটারে ২–৩ গ্রাম) স্প্রে করুন এবং কাছের জুনিপার গাছ থেকে কমলা গুটি সরিয়ে ফেলুন।",
        ),
      ),
      prev(
        l(
          "Plant rust-resistant varieties and avoid planting apples near juniper or cedar trees.",
          "মরিচা-প্রতিরোধী জাত লাগান এবং জুনিপার বা সিডার গাছের কাছে আপেল লাগাবেন না।",
        ),
      ),
    ],
  },
  // 3, 4
  healthy("Healthy Apple", "apple"),
  healthy("Healthy Blueberry Plant", "blueberry"),
  // 5
  {
    label: "Cherry with Powdery Mildew",
    crop: "cherry",
    name: l("Powdery Mildew", "পাউডারি মিলডিউ (সাদা গুঁড়া রোগ)"),
    type: "fungus",
    pathogen: "Podosphaera clandestina",
    symptoms: l(
      "White, powdery patches on young leaves and shoots; leaves curl upward and become brittle.",
      "কচি পাতা ও ডগায় সাদা পাউডারের মতো ছোপ; পাতা ওপরের দিকে কুঁকড়ে যায় ও ভঙ্গুর হয়।",
    ),
    causes: l(
      "Fungus Podosphaera clandestina. Favoured by warm days, high humidity and crowded canopies — it does not need rain.",
      "পোডোস্ফেরা ক্ল্যানডেস্টিনা ছত্রাক। উষ্ণ দিন, উচ্চ আর্দ্রতা ও ঘন ডালপালায় বাড়ে — বৃষ্টির প্রয়োজন হয় না।",
    ),
    treatments: [
      POWDERY_CHEM,
      org(
        l(
          "Spray potassium bicarbonate (5 g per litre) or neem oil (5 mL per litre) with a few drops of liquid soap.",
          "পটাশিয়াম বাইকার্বোনেট (প্রতি লিটারে ৫ গ্রাম) বা নিম তেল (প্রতি লিটারে ৫ মিলি) সামান্য তরল সাবানসহ স্প্রে করুন।",
        ),
      ),
      POWDERY_PREV,
    ],
  },
  // 6
  healthy("Healthy Cherry Plant", "cherry"),
  // 7
  {
    label: "Corn (Maize) with Cercospora and Gray Leaf Spot",
    crop: "corn",
    name: l("Cercospora / Gray Leaf Spot", "সারকোস্পোরা / ধূসর পাতা দাগ রোগ"),
    type: "fungus",
    pathogen: "Cercospora zeae-maydis",
    symptoms: l(
      "Long, narrow, rectangular grey to tan spots running between the leaf veins; spots join together and leaves dry out.",
      "পাতার শিরার মাঝে লম্বা, সরু, আয়তাকার ধূসর থেকে হালকা বাদামি দাগ; দাগগুলো মিলে পাতা শুকিয়ে যায়।",
    ),
    causes: l(
      "Fungus Cercospora zeae-maydis surviving on old maize residue; favoured by warm, humid weather and long periods of leaf wetness.",
      "সারকোস্পোরা জি-মেইডিস ছত্রাক, যা পুরনো ভুট্টার অবশিষ্টাংশে বেঁচে থাকে; উষ্ণ, আর্দ্র আবহাওয়া ও দীর্ঘক্ষণ পাতা ভেজা থাকলে বাড়ে।",
    ),
    treatments: [
      chem(
        l(
          "Spray Azoxystrobin 23 SC or Propiconazole 25 EC when spots first appear, before tasselling.",
          "দাগ প্রথম দেখা দিলে, মোচা বের হওয়ার আগে অ্যাজোক্সিস্ট্রোবিন ২৩ এসসি বা প্রোপিকোনাজল ২৫ ইসি স্প্রে করুন।",
        ),
        D_1ML,
      ),
      org(
        l(
          "Remove and destroy infected lower leaves, and plough under or remove crop residue after harvest.",
          "আক্রান্ত নিচের পাতা তুলে নষ্ট করুন এবং ফসল তোলার পর অবশিষ্টাংশ চাষ দিয়ে মাটিতে মিশিয়ে দিন বা সরিয়ে ফেলুন।",
        ),
      ),
      prev(
        l(
          "Rotate with a non-maize crop for at least one season and grow tolerant hybrids.",
          "অন্তত এক মৌসুম ভুট্টা ছাড়া অন্য ফসল চাষ করুন এবং সহনশীল হাইব্রিড জাত লাগান।",
        ),
      ),
    ],
  },
  // 8
  {
    label: "Corn (Maize) with Common Rust",
    crop: "corn",
    name: l("Common Rust", "সাধারণ মরিচা রোগ"),
    type: "fungus",
    pathogen: "Puccinia sorghi",
    symptoms: l(
      "Small, oval, cinnamon-brown powdery pustules on both sides of the leaf; badly infected leaves turn yellow and dry.",
      "পাতার দুই পাশে ছোট, ডিম্বাকার, দারুচিনি-বাদামি গুঁড়াযুক্ত ফুসকুড়ি; বেশি আক্রান্ত পাতা হলুদ হয়ে শুকিয়ে যায়।",
    ),
    causes: l(
      "Rust fungus Puccinia sorghi. Spores travel long distances on the wind; cool (16–23 °C), humid weather favours it.",
      "পাক্সিনিয়া সরগি মরিচা ছত্রাক। রেণু বাতাসে বহু দূর যায়; ঠান্ডা (১৬–২৩ °সে) ও আর্দ্র আবহাওয়ায় বাড়ে।",
    ),
    treatments: [
      chem(
        l(
          "Spray Mancozeb 75 WP or Propiconazole 25 EC (1 mL per litre) when pustules first appear; repeat after 10–15 days if needed.",
          "ফুসকুড়ি প্রথম দেখা দিলে ম্যানকোজেব ৭৫ ডব্লিউপি বা প্রোপিকোনাজল ২৫ ইসি (প্রতি লিটারে ১ মিলি) স্প্রে করুন; প্রয়োজনে ১০–১৫ দিন পর আবার দিন।",
        ),
        D_25G,
      ),
      org(
        l(
          "Remove heavily infected leaves early and keep the field free of self-sown maize plants.",
          "বেশি আক্রান্ত পাতা আগেভাগে সরিয়ে ফেলুন এবং মাঠে আপনা-আপনি গজানো ভুট্টা গাছ রাখবেন না।",
        ),
      ),
      prev(l("Plant rust-resistant hybrids, sow early, and use balanced fertiliser.", "মরিচা-প্রতিরোধী হাইব্রিড লাগান, আগাম বপন করুন এবং সুষম সার দিন।")),
    ],
  },
  // 9
  {
    label: "Corn (Maize) with Northern Leaf Blight",
    crop: "corn",
    name: l("Northern Leaf Blight", "নর্দান লিফ ব্লাইট (পাতা ঝলসানো রোগ)"),
    type: "fungus",
    pathogen: "Exserohilum turcicum",
    symptoms: l(
      "Long, cigar-shaped grey-green to tan lesions (2.5–15 cm) on the leaves, starting on the lower leaves.",
      "পাতায় লম্বা, চুরুটের মতো ধূসর-সবুজ থেকে হালকা বাদামি দাগ (২.৫–১৫ সেমি), যা নিচের পাতা থেকে শুরু হয়।",
    ),
    causes: l(
      "Fungus Exserohilum turcicum on infected crop residue; moderate temperatures (18–27 °C) with heavy dew favour it.",
      "এক্সসেরোহাইলাম টারসিকাম ছত্রাক, যা আক্রান্ত ফসলের অবশিষ্টাংশে থাকে; মাঝারি তাপমাত্রা (১৮–২৭ °সে) ও ভারী শিশিরে বাড়ে।",
    ),
    treatments: [
      chem(
        l(
          "Spray Mancozeb 75 WP or Propiconazole 25 EC (1 mL per litre) at first symptoms; repeat after 10–15 days.",
          "প্রথম লক্ষণ দেখা দিলে ম্যানকোজেব ৭৫ ডব্লিউপি বা প্রোপিকোনাজল ২৫ ইসি (প্রতি লিটারে ১ মিলি) স্প্রে করুন; ১০–১৫ দিন পর আবার দিন।",
        ),
        D_25G,
      ),
      org(
        l(
          "Remove infected leaves and deep-plough crop residue after harvest.",
          "আক্রান্ত পাতা সরিয়ে ফেলুন এবং ফসল তোলার পর গভীর চাষ দিয়ে অবশিষ্টাংশ মাটিতে মিশিয়ে দিন।",
        ),
      ),
      prev(l("Grow resistant hybrids, rotate crops and avoid very dense planting.", "প্রতিরোধী হাইব্রিড চাষ করুন, শস্যপর্যায় মানুন এবং খুব ঘন করে লাগাবেন না।")),
    ],
  },
  // 10
  healthy("Healthy Corn (Maize) Plant", "corn"),
  // 11
  {
    label: "Grape with Black Rot",
    crop: "grape",
    name: l("Black Rot", "কালো পচা রোগ"),
    type: "fungus",
    pathogen: "Guignardia bidwellii",
    symptoms: l(
      "Round tan-brown leaf spots with a dark border and tiny black dots; berries turn brown, then shrivel into hard black 'mummies'.",
      "পাতায় গাঢ় কিনারাসহ গোল হালকা-বাদামি দাগ ও ছোট কালো বিন্দু; আঙুর বাদামি হয়ে পরে শক্ত কালো 'মমি'-তে পরিণত হয়।",
    ),
    causes: l(
      "Fungus Guignardia bidwellii, which overwinters in mummified berries and infected canes and spreads in warm, rainy weather.",
      "গিগনার্ডিয়া বিডওয়েলি ছত্রাক, যা মমি হওয়া ফল ও আক্রান্ত ডালে শীত কাটায় এবং উষ্ণ, বৃষ্টির আবহাওয়ায় ছড়ায়।",
    ),
    treatments: [
      chem(
        l(
          "Spray Mancozeb 75 WP from new shoot growth until berries start to colour, every 10–14 days.",
          "নতুন ডগা গজানো থেকে ফলে রং ধরা পর্যন্ত ১০–১৪ দিন পরপর ম্যানকোজেব ৭৫ ডব্লিউপি স্প্রে করুন।",
        ),
        D_2G,
      ),
      org(
        l(
          "Remove all mummified berries and infected canes, and spray copper oxychloride (3 g per litre).",
          "সব মমি হওয়া ফল ও আক্রান্ত ডাল সরিয়ে ফেলুন এবং কপার অক্সিক্লোরাইড (প্রতি লিটারে ৩ গ্রাম) স্প্রে করুন।",
        ),
      ),
      prev(
        l(
          "Prune for an open canopy with good air flow and keep the ground under vines clean.",
          "বাতাস চলাচলের জন্য খোলামেলা করে ছাঁটাই করুন এবং লতার নিচের মাটি পরিষ্কার রাখুন।",
        ),
      ),
    ],
  },
  // 12
  {
    label: "Grape with Esca (Black Measles)",
    crop: "grape",
    name: l("Esca (Black Measles)", "এসকা (ব্ল্যাক মিজলস) রোগ"),
    type: "fungus",
    pathogen: "Phaeomoniella chlamydospora (complex)",
    symptoms: l(
      "'Tiger-stripe' leaves: yellow or red areas between the veins that dry to brown. Berries get small dark spots and vines may suddenly wilt.",
      "'বাঘের ডোরা' পাতা: শিরার মাঝে হলুদ বা লাল অংশ যা শুকিয়ে বাদামি হয়। ফলে ছোট কালো দাগ পড়ে এবং লতা হঠাৎ নেতিয়ে যেতে পারে।",
    ),
    causes: l(
      "A group of wood-rotting fungi (such as Phaeomoniella chlamydospora) that enter through pruning wounds and live inside the trunk.",
      "কাঠ-পচানো একদল ছত্রাক (যেমন ফেওমোনিয়েলা ক্ল্যামাইডোস্পোরা), যা ছাঁটাইয়ের ক্ষত দিয়ে ঢুকে কাণ্ডের ভেতরে বাস করে।",
    ),
    treatments: [
      chem(
        l(
          "No spray can cure Esca. Protect large pruning wounds with a fungicide wound paste right after pruning.",
          "কোনো স্প্রে এসকা সারাতে পারে না। ছাঁটাইয়ের পরপরই বড় ক্ষতে ছত্রাকনাশক পেস্ট লাগিয়ে রক্ষা করুন।",
        ),
      ),
      org(
        l(
          "Cut out and burn infected wood well below the discoloured part, and disinfect pruning tools between vines.",
          "রং বদলানো অংশের বেশ নিচ থেকে আক্রান্ত কাঠ কেটে পুড়িয়ে ফেলুন এবং প্রতিটি লতার পর ছাঁটাইয়ের যন্ত্র জীবাণুমুক্ত করুন।",
        ),
      ),
      prev(
        l(
          "Prune in dry weather, avoid large cuts, and mark and monitor infected vines.",
          "শুকনো আবহাওয়ায় ছাঁটাই করুন, বড় কাটা এড়িয়ে চলুন এবং আক্রান্ত লতা চিহ্নিত করে নজরে রাখুন।",
        ),
      ),
    ],
  },
  // 13
  {
    label: "Grape with Isariopsis Leaf Spot",
    crop: "grape",
    name: l("Isariopsis Leaf Spot (Leaf Blight)", "আইসারিওপসিস পাতার দাগ (পাতা ঝলসানো)"),
    type: "fungus",
    pathogen: "Pseudocercospora vitis",
    symptoms: l(
      "Irregular dark red-brown to black spots on the leaves, often with a yellow border; leaves dry and fall early.",
      "পাতায় অনিয়মিত গাঢ় লালচে-বাদামি থেকে কালো দাগ, প্রায়ই হলুদ কিনারাসহ; পাতা শুকিয়ে আগেভাগে ঝরে যায়।",
    ),
    causes: l(
      "Fungus Pseudocercospora vitis (Isariopsis); warm, humid weather; spreads by wind and rain.",
      "সিউডোসারকোস্পোরা ভিটিস (আইসারিওপসিস) ছত্রাক; উষ্ণ, আর্দ্র আবহাওয়ায় বাড়ে এবং বাতাস ও বৃষ্টিতে ছড়ায়।",
    ),
    treatments: [
      chem(
        l(
          "Spray Mancozeb 75 WP or copper oxychloride 50 WP (3 g per litre) every 10–14 days.",
          "১০–১৪ দিন পরপর ম্যানকোজেব ৭৫ ডব্লিউপি বা কপার অক্সিক্লোরাইড ৫০ ডব্লিউপি (প্রতি লিটারে ৩ গ্রাম) স্প্রে করুন।",
        ),
        D_2G,
      ),
      org(l("Remove infected leaves and spray 1% Bordeaux mixture.", "আক্রান্ত পাতা সরিয়ে ফেলুন এবং ১% বোর্দো মিশ্রণ স্প্রে করুন।")),
      prev(l("Keep the canopy open for air flow and remove fallen leaves.", "বাতাস চলাচলের জন্য লতা খোলামেলা রাখুন এবং ঝরা পাতা সরিয়ে ফেলুন।")),
    ],
  },
  // 14
  healthy("Healthy Grape Plant", "grape"),
  // 15
  {
    label: "Orange with Citrus Greening",
    crop: "orange",
    name: l("Citrus Greening (Huanglongbing)", "সাইট্রাস গ্রিনিং (হুয়াংলংবিং) রোগ"),
    type: "bacteria",
    pathogen: "Candidatus Liberibacter asiaticus",
    symptoms: l(
      "Blotchy, uneven yellow mottling on leaves (different on each half), small upright leaves, lopsided bitter green fruit and twig dieback.",
      "পাতায় ছোপ ছোপ অসমান হলুদ দাগ (দুই অর্ধেকে ভিন্ন), ছোট খাড়া পাতা, বাঁকা তেতো সবুজ ফল এবং ডগা মরে যাওয়া।",
    ),
    causes: l(
      "Bacterium Candidatus Liberibacter asiaticus, spread by the Asian citrus psyllid insect and by infected planting material.",
      "ক্যান্ডিডেটাস লাইবেরিব্যাক্টর এশিয়াটিকাস ব্যাকটেরিয়া, যা এশিয়ান সাইট্রাস সিলিড পোকা ও আক্রান্ত চারার মাধ্যমে ছড়ায়।",
    ),
    treatments: [
      chem(
        l(
          "There is no cure for the disease. Control the psyllid insect by spraying Imidacloprid 17.8 SL on new leaf flushes.",
          "এই রোগের কোনো প্রতিকার নেই। নতুন পাতা গজানোর সময় ইমিডাক্লোপ্রিড ১৭.৮ এসএল স্প্রে করে সিলিড পোকা দমন করুন।",
        ),
        D_05ML,
        BEES,
      ),
      org(
        l(
          "Spray neem oil (5 mL per litre) on new flushes to deter psyllids, and remove and destroy infected trees.",
          "সিলিড তাড়াতে নতুন পাতায় নিম তেল (প্রতি লিটারে ৫ মিলি) স্প্রে করুন এবং আক্রান্ত গাছ তুলে নষ্ট করুন।",
        ),
      ),
      prev(
        l(
          "Plant only certified disease-free saplings and check new leaves for psyllids every week.",
          "শুধু প্রত্যয়িত রোগমুক্ত চারা লাগান এবং প্রতি সপ্তাহে নতুন পাতায় সিলিড আছে কিনা দেখুন।",
        ),
      ),
    ],
  },
  // 16
  {
    label: "Peach with Bacterial Spot",
    crop: "peach",
    name: l("Bacterial Spot", "ব্যাকটেরিয়াজনিত দাগ রোগ"),
    type: "bacteria",
    pathogen: "Xanthomonas arboricola pv. pruni",
    symptoms: l(
      "Small, angular, water-soaked spots that turn purple-black; the centres fall out leaving 'shot holes', and leaves yellow and drop.",
      "ছোট, কোণাকার, পানিভেজা দাগ যা বেগুনি-কালো হয়ে যায়; দাগের মাঝখান খসে 'গুলির ছিদ্র' তৈরি হয় এবং পাতা হলুদ হয়ে ঝরে পড়ে।",
    ),
    causes: l(
      "Bacterium Xanthomonas arboricola pv. pruni, spread by wind-driven rain; worse in sandy soils and warm, wet weather.",
      "জ্যান্থোমোনাস আরবোরিকোলা ব্যাকটেরিয়া, যা বাতাসসহ বৃষ্টিতে ছড়ায়; বেলে মাটি ও উষ্ণ, ভেজা আবহাওয়ায় বেশি হয়।",
    ),
    treatments: [
      chem(
        l("Spray copper oxychloride 50 WP at leaf fall and again before bud break.", "পাতা ঝরার সময় এবং কুঁড়ি ফোটার আগে আবার কপার অক্সিক্লোরাইড ৫০ ডব্লিউপি স্প্রে করুন।"),
        D_3G,
        l(
          "Copper can burn peach leaves in summer — use only low label rates during the growing season.",
          "গ্রীষ্মে কপার পীচের পাতা পুড়িয়ে দিতে পারে — বাড়ন্ত মৌসুমে লেবেলের কম মাত্রা ব্যবহার করুন।",
        ),
      ),
      org(l("Prune out infected twigs and avoid excess nitrogen fertiliser.", "আক্রান্ত ডগা ছেঁটে ফেলুন এবং অতিরিক্ত নাইট্রোজেন সার এড়িয়ে চলুন।")),
      prev(l("Plant resistant varieties, use windbreaks and avoid overhead irrigation.", "প্রতিরোধী জাত লাগান, বায়ুরোধী বেড়া দিন এবং ওপর থেকে সেচ এড়িয়ে চলুন।")),
    ],
  },
  // 17
  healthy("Healthy Peach Plant", "peach"),
  // 18, 19
  bacterialSpot("Bell Pepper with Bacterial Spot", "pepper"),
  healthy("Healthy Bell Pepper Plant", "pepper"),
  // 20, 21, 22
  earlyBlight("Potato with Early Blight", "potato"),
  lateBlight("Potato with Late Blight", "potato"),
  healthy("Healthy Potato Plant", "potato"),
  // 23, 24
  healthy("Healthy Raspberry Plant", "raspberry"),
  healthy("Healthy Soybean Plant", "soybean"),
  // 25
  {
    label: "Squash with Powdery Mildew",
    crop: "squash",
    name: l("Powdery Mildew", "পাউডারি মিলডিউ (সাদা গুঁড়া রোগ)"),
    type: "fungus",
    pathogen: "Podosphaera xanthii",
    symptoms: l(
      "White, powdery spots on the upper side of leaves that spread to cover whole leaves; leaves turn yellow and dry.",
      "পাতার ওপরে সাদা পাউডারের মতো দাগ যা ছড়িয়ে পুরো পাতা ঢেকে ফেলে; পাতা হলুদ হয়ে শুকিয়ে যায়।",
    ),
    causes: l(
      "Fungus Podosphaera xanthii; spreads by wind on warm, dry days with humid nights, especially in shaded, crowded plantings.",
      "পোডোস্ফেরা জ্যান্থাই ছত্রাক; উষ্ণ শুকনো দিন ও আর্দ্র রাতে বাতাসে ছড়ায়, বিশেষ করে ছায়াযুক্ত ঘন চাষে।",
    ),
    treatments: [
      POWDERY_CHEM,
      org(
        l(
          "Spray wettable sulphur (2 g per litre) or potassium bicarbonate (5 g per litre) with a few drops of liquid soap; remove badly infected leaves.",
          "ভেজানো যায় এমন সালফার (প্রতি লিটারে ২ গ্রাম) বা পটাশিয়াম বাইকার্বোনেট (প্রতি লিটারে ৫ গ্রাম) সামান্য তরল সাবানসহ স্প্রে করুন; বেশি আক্রান্ত পাতা সরিয়ে ফেলুন।",
        ),
        l(
          "Sulphur can burn squash leaves above 32 °C; spray in the cool morning.",
          "৩২ °সে-এর বেশি তাপমাত্রায় সালফার স্কোয়াশের পাতা পুড়িয়ে দিতে পারে; ঠান্ডা সকালে স্প্রে করুন।",
        ),
      ),
      POWDERY_PREV,
    ],
  },
  // 26
  {
    label: "Strawberry with Leaf Scorch",
    crop: "strawberry",
    name: l("Leaf Scorch", "পাতা ঝলসানো রোগ (লিফ স্কর্চ)"),
    type: "fungus",
    pathogen: "Diplocarpon earlianum",
    symptoms: l(
      "Many small, irregular purple spots on leaves; spots merge and the leaf looks burned (scorched) and dries up.",
      "পাতায় অনেক ছোট, অনিয়মিত বেগুনি দাগ; দাগগুলো মিলে পাতা পোড়া (ঝলসানো) দেখায় ও শুকিয়ে যায়।",
    ),
    causes: l(
      "Fungus Diplocarpon earlianum surviving on old leaves; spreads by splashing water in warm, wet weather.",
      "ডিপ্লোকারপন আরলিয়ানাম ছত্রাক, যা পুরনো পাতায় বেঁচে থাকে; উষ্ণ, ভেজা আবহাওয়ায় পানির ছিটায় ছড়ায়।",
    ),
    treatments: [
      chem(l("Spray Captan 50 WP every 10–14 days during wet periods.", "ভেজা মৌসুমে ১০–১৪ দিন পরপর ক্যাপটান ৫০ ডব্লিউপি স্প্রে করুন।"), D_2G),
      org(
        l("Remove old infected leaves after harvest and spray a copper-based product.", "ফল তোলার পর পুরনো আক্রান্ত পাতা সরিয়ে ফেলুন এবং কপারভিত্তিক বালাইনাশক স্প্রে করুন।"),
      ),
      prev(
        l(
          "Plant resistant varieties, use drip irrigation, renew beds every 2–3 years and keep good spacing.",
          "প্রতিরোধী জাত লাগান, ড্রিপ সেচ দিন, ২–৩ বছর পরপর বেড নতুন করুন এবং সঠিক দূরত্ব রাখুন।",
        ),
      ),
    ],
  },
  // 27
  healthy("Healthy Strawberry Plant", "strawberry"),
  // 28, 29, 30
  bacterialSpot("Tomato with Bacterial Spot", "tomato"),
  earlyBlight("Tomato with Early Blight", "tomato"),
  lateBlight("Tomato with Late Blight", "tomato"),
  // 31
  {
    label: "Tomato with Leaf Mold",
    crop: "tomato",
    name: l("Leaf Mold", "পাতার ছাঁচ রোগ (লিফ মোল্ড)"),
    type: "fungus",
    pathogen: "Passalora fulva",
    symptoms: l(
      "Pale green to yellow spots on the upper leaf surface with olive-green to brown velvety mould underneath; leaves wither and die.",
      "পাতার ওপরে ফ্যাকাশে সবুজ থেকে হলুদ দাগ এবং নিচে জলপাই-সবুজ থেকে বাদামি মখমলের মতো ছাঁচ; পাতা শুকিয়ে মরে যায়।",
    ),
    causes: l(
      "Fungus Passalora fulva; needs very high humidity (above 85%), so it is common in greenhouses and poly-tunnels.",
      "প্যাসালোরা ফুলভা ছত্রাক; খুব বেশি আর্দ্রতা (৮৫%-এর বেশি) প্রয়োজন, তাই গ্রিনহাউস ও পলি-টানেলে বেশি দেখা যায়।",
    ),
    treatments: [
      chem(
        l("Spray Chlorothalonil 75 WP or Mancozeb 75 WP every 7–10 days.", "৭–১০ দিন পরপর ক্লোরোথালোনিল ৭৫ ডব্লিউপি বা ম্যানকোজেব ৭৫ ডব্লিউপি স্প্রে করুন।"),
        D_2G,
      ),
      org(
        l("Improve ventilation, remove infected leaves and spray a copper-based product.", "বাতাস চলাচল বাড়ান, আক্রান্ত পাতা সরিয়ে ফেলুন এবং কপারভিত্তিক বালাইনাশক স্প্রে করুন।"),
      ),
      prev(
        l(
          "Grow resistant varieties, keep humidity low, avoid wetting leaves and space plants widely.",
          "প্রতিরোধী জাত চাষ করুন, আর্দ্রতা কম রাখুন, পাতা ভেজাবেন না এবং গাছ দূরে দূরে লাগান।",
        ),
      ),
    ],
  },
  // 32
  {
    label: "Tomato with Septoria Leaf Spot",
    crop: "tomato",
    name: l("Septoria Leaf Spot", "সেপ্টোরিয়া পাতার দাগ রোগ"),
    type: "fungus",
    pathogen: "Septoria lycopersici",
    symptoms: l(
      "Many small round spots with dark brown edges and grey-white centres containing tiny black dots; starts on the lower leaves.",
      "গাঢ় বাদামি কিনারা ও ধূসর-সাদা মাঝখানসহ অনেক ছোট গোল দাগ, মাঝে ছোট কালো বিন্দু; নিচের পাতা থেকে শুরু হয়।",
    ),
    causes: l(
      "Fungus Septoria lycopersici surviving on plant debris and weeds; spread by water splash in warm, wet weather.",
      "সেপ্টোরিয়া লাইকোপারসিসি ছত্রাক, যা গাছের অবশিষ্টাংশ ও আগাছায় বেঁচে থাকে; উষ্ণ, ভেজা আবহাওয়ায় পানির ছিটায় ছড়ায়।",
    ),
    treatments: [
      chem(
        l("Spray Chlorothalonil 75 WP or Mancozeb 75 WP every 7–10 days.", "৭–১০ দিন পরপর ক্লোরোথালোনিল ৭৫ ডব্লিউপি বা ম্যানকোজেব ৭৫ ডব্লিউপি স্প্রে করুন।"),
        D_MANCO,
      ),
      org(
        l(
          "Remove infected lower leaves, mulch the soil and spray a copper-based product.",
          "আক্রান্ত নিচের পাতা সরিয়ে ফেলুন, মাটিতে মালচ দিন এবং কপারভিত্তিক বালাইনাশক স্প্রে করুন।",
        ),
      ),
      prev(
        l(
          "Rotate crops, remove nightshade weeds and stake plants to keep leaves off the soil.",
          "শস্যপর্যায় মানুন, বেগুন-জাতীয় আগাছা সরিয়ে ফেলুন এবং পাতা মাটি থেকে দূরে রাখতে গাছে খুঁটি দিন।",
        ),
      ),
    ],
  },
  // 33
  {
    label: "Tomato with Spider Mites or Two-spotted Spider Mite",
    crop: "tomato",
    name: l("Spider Mites", "মাকড় (দুই-দাগি লাল মাকড়)"),
    type: "pest",
    pathogen: "Tetranychus urticae",
    symptoms: l(
      "Tiny yellow or white specks on leaves with fine webbing underneath; leaves turn bronze, dry out and fall.",
      "পাতায় ছোট হলুদ বা সাদা বিন্দু এবং নিচে সূক্ষ্ম জাল; পাতা তামাটে হয়ে শুকিয়ে ঝরে যায়।",
    ),
    causes: l(
      "The two-spotted spider mite, a tiny pest that multiplies very fast in hot, dry and dusty conditions.",
      "দুই-দাগি মাকড়, একটি ক্ষুদ্র পোকা যা গরম, শুকনো ও ধুলোময় অবস্থায় খুব দ্রুত বংশবৃদ্ধি করে।",
    ),
    treatments: [
      chem(
        l(
          "Spray a miticide such as Abamectin 1.8 EC on the underside of leaves; repeat after 7 days if needed.",
          "পাতার নিচের দিকে অ্যাবামেকটিন ১.৮ ইসি-র মতো মাকড়নাশক স্প্রে করুন; প্রয়োজনে ৭ দিন পর আবার দিন।",
        ),
        D_1ML,
        l(
          "Use a miticide, not an ordinary insecticide, and rotate products to avoid resistance.",
          "সাধারণ কীটনাশক নয়, মাকড়নাশক ব্যবহার করুন এবং প্রতিরোধ এড়াতে পণ্য পাল্টে দিন।",
        ),
      ),
      org(
        l(
          "Spray strong jets of water on leaf undersides and spray neem oil (5 mL per litre) with a little soap.",
          "পাতার নিচে জোরে পানি স্প্রে করুন এবং সামান্য সাবানসহ নিম তেল (প্রতি লিটারে ৫ মিলি) স্প্রে করুন।",
        ),
      ),
      prev(
        l(
          "Avoid water stress and dust, don't overuse broad-spectrum insecticides that kill natural enemies, and check leaf undersides weekly.",
          "পানির অভাব ও ধুলো এড়িয়ে চলুন, উপকারী পোকা মেরে ফেলে এমন কীটনাশক অতিরিক্ত ব্যবহার করবেন না এবং প্রতি সপ্তাহে পাতার নিচে পরীক্ষা করুন।",
        ),
      ),
    ],
  },
  // 34
  {
    label: "Tomato with Target Spot",
    crop: "tomato",
    name: l("Target Spot", "টার্গেট স্পট (চক্রাকার দাগ) রোগ"),
    type: "fungus",
    pathogen: "Corynespora cassiicola",
    symptoms: l(
      "Brown spots with light centres and rings, larger and paler than early blight; can also affect stems and fruit.",
      "হালকা মাঝখান ও চক্রাকার রেখাসহ বাদামি দাগ, আগাম ধসার চেয়ে বড় ও হালকা রঙের; কাণ্ড ও ফলেও হতে পারে।",
    ),
    causes: l(
      "Fungus Corynespora cassiicola; warm, humid weather with long leaf wetness.",
      "কোরিনেস্পোরা ক্যাসিকোলা ছত্রাক; উষ্ণ, আর্দ্র আবহাওয়ায় এবং দীর্ঘক্ষণ পাতা ভেজা থাকলে বাড়ে।",
    ),
    treatments: [
      chem(
        l(
          "Spray Chlorothalonil 75 WP or Azoxystrobin 23 SC every 7–14 days.",
          "৭–১৪ দিন পরপর ক্লোরোথালোনিল ৭৫ ডব্লিউপি বা অ্যাজোক্সিস্ট্রোবিন ২৩ এসসি স্প্রে করুন।",
        ),
        l("2 g (Chlorothalonil) or 1 mL (Azoxystrobin) per litre of water", "প্রতি লিটার পানিতে ২ গ্রাম (ক্লোরোথালোনিল) বা ১ মিলি (অ্যাজোক্সিস্ট্রোবিন)"),
      ),
      org(
        l("Remove infected leaves and prune lower leaves to improve air flow.", "আক্রান্ত পাতা সরিয়ে ফেলুন এবং বাতাস চলাচলের জন্য নিচের পাতা ছেঁটে দিন।"),
      ),
      prev(
        l("Rotate crops, remove crop debris and avoid overhead irrigation.", "শস্যপর্যায় মানুন, ফসলের অবশিষ্টাংশ সরিয়ে ফেলুন এবং ওপর থেকে সেচ এড়িয়ে চলুন।"),
      ),
    ],
  },
  // 35
  {
    label: "Tomato Yellow Leaf Curl Virus",
    crop: "tomato",
    name: l("Yellow Leaf Curl Virus", "হলুদ পাতা কোঁকড়ানো ভাইরাস"),
    type: "virus",
    pathogen: "Begomovirus (TYLCV)",
    symptoms: l(
      "Leaves curl upward, become small and turn yellow at the edges; plants are stunted, flowers drop and few fruits form.",
      "পাতা ওপরের দিকে কুঁকড়ে যায়, ছোট হয় এবং কিনারা হলুদ হয়; গাছ খাটো হয়ে যায়, ফুল ঝরে পড়ে এবং খুব কম ফল ধরে।",
    ),
    causes: l(
      "Tomato yellow leaf curl virus, spread by whiteflies (Bemisia tabaci). It does not spread through soil or by touch.",
      "টমেটোর হলুদ পাতা কোঁকড়ানো ভাইরাস, যা সাদা মাছি (বেমিসিয়া ট্যাবাসি) দ্বারা ছড়ায়। মাটি বা স্পর্শে ছড়ায় না।",
    ),
    treatments: [
      chem(
        l(
          "There is no cure for the virus. Control whiteflies with Imidacloprid 17.8 SL or Thiamethoxam 25 WG, alternating between them.",
          "ভাইরাসের কোনো প্রতিকার নেই। ইমিডাক্লোপ্রিড ১৭.৮ এসএল বা থায়ামেথোক্সাম ২৫ ডব্লিউজি পালাক্রমে ব্যবহার করে সাদা মাছি দমন করুন।",
        ),
        l("Imidacloprid 0.5 mL or Thiamethoxam 0.3 g per litre of water", "প্রতি লিটার পানিতে ইমিডাক্লোপ্রিড ০.৫ মিলি বা থায়ামেথোক্সাম ০.৩ গ্রাম"),
        BEES,
      ),
      org(
        l(
          "Hang yellow sticky traps, spray neem oil (5 mL per litre), and uproot and destroy infected plants early.",
          "হলুদ আঠালো ফাঁদ ঝুলিয়ে দিন, নিম তেল (প্রতি লিটারে ৫ মিলি) স্প্রে করুন এবং আক্রান্ত গাছ আগেভাগে তুলে নষ্ট করুন।",
        ),
      ),
      prev(
        l(
          "Grow resistant varieties, raise seedlings under insect-proof net and keep the field free of weeds.",
          "প্রতিরোধী জাত চাষ করুন, পোকারোধী জালের নিচে চারা তৈরি করুন এবং মাঠ আগাছামুক্ত রাখুন।",
        ),
      ),
    ],
  },
  // 36
  {
    label: "Tomato Mosaic Virus",
    crop: "tomato",
    name: l("Mosaic Virus", "মোজাইক ভাইরাস"),
    type: "virus",
    pathogen: "Tobamovirus (ToMV)",
    symptoms: l(
      "Light and dark green mosaic pattern on leaves; leaves may be twisted, narrow or fern-like; plants are stunted and fruit may ripen unevenly.",
      "পাতায় হালকা ও গাঢ় সবুজ মোজাইক নকশা; পাতা মোচড়ানো, সরু বা ফার্নের মতো হতে পারে; গাছ খাটো হয় এবং ফল অসমানভাবে পাকে।",
    ),
    causes: l(
      "Tomato mosaic virus is very stable and spreads by touch — hands, tools and clothes — and through infected seed. Insects do not spread it.",
      "টমেটোর মোজাইক ভাইরাস খুব টেকসই এবং হাত, যন্ত্রপাতি ও কাপড়ের স্পর্শে এবং আক্রান্ত বীজের মাধ্যমে ছড়ায়। পোকামাকড় এটি ছড়ায় না।",
    ),
    treatments: [
      chem(
        l("No chemical can cure a viral disease. Focus on removal and hygiene.", "কোনো রাসায়নিক ভাইরাসজনিত রোগ সারাতে পারে না। গাছ সরানো ও পরিচ্ছন্নতার ওপর জোর দিন।"),
      ),
      org(
        l(
          "Remove and destroy infected plants, wash hands with soap and disinfect tools (for example, in 10% household bleach).",
          "আক্রান্ত গাছ তুলে নষ্ট করুন, সাবান দিয়ে হাত ধুয়ে নিন এবং যন্ত্রপাতি জীবাণুমুক্ত করুন (যেমন ১০% ব্লিচ দ্রবণে)।",
        ),
      ),
      prev(
        l(
          "Use resistant varieties and certified seed, avoid handling tobacco near plants, and rotate crops.",
          "প্রতিরোধী জাত ও প্রত্যয়িত বীজ ব্যবহার করুন, গাছের কাছে তামাক নাড়াচাড়া করবেন না এবং শস্যপর্যায় মানুন।",
        ),
      ),
    ],
  },
  // 37
  healthy("Healthy Tomato Plant", "tomato"),
];

/**
 * Build the full disease list with stable ids.
 * PlantVillage classes: id = main-model index + 1, class_label = model label.
 * Specialist crop models (rice, wheat, soybean, jute): ids after that, class_label = "<model>:<label>".
 */
export function buildDiseases(): Disease[] {
  let treatmentId = 1;
  const all = [
    ...DEFS.map((d) => ({ ...d, classLabel: d.label, images: diseaseImages(d.label) })),
    ...EXTRA_DEFS.map((d) => {
      const classLabel = `${d.model}:${d.label}`;
      // Not every specialist class has public photos yet; use the ones that were downloaded.
      return { ...d, classLabel, images: (manifest as Record<string, string[]>)[slugify(classLabel)] ?? [] };
    }),
  ];
  return all.map((d, index) => ({
    id: index + 1,
    class_label: d.classLabel,
    crop: cropByKey(d.crop),
    name: d.name,
    type: d.type,
    is_healthy: d.type === "healthy",
    pathogen: d.pathogen,
    images: d.images,
    symptoms: d.symptoms,
    causes: d.causes,
    treatments: d.treatments.map((t) => ({ ...t, id: treatmentId++ })),
  }));
}

/** Model labels in index order — must equal the model's id2label. */
export const MODEL_LABELS = DEFS.map((d) => d.label);
