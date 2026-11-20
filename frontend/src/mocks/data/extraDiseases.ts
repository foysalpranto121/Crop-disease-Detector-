import type { DiseaseType, L, Treatment } from "../../api/types";

/*
 * Classes of the specialist crop models (backend/model/<model>/labels.json).
 * class_label = "<model>:<exact model label>". Order inside each model MUST match its labels.json.
 * Dosages are typical label rates from general extension guidance (BRRI/BARI/DAE style).
 */

type T = Omit<Treatment, "id">;
const l = (en: string, bn: string): L => ({ en, bn });
const PPE = l(
  "Wear gloves and a mask; do not spray in wind or before rain; respect the waiting period on the label.",
  "গ্লাভস ও মাস্ক পরুন; বাতাসে বা বৃষ্টির আগে স্প্রে করবেন না; লেবেলে লেখা অপেক্ষার সময় মেনে চলুন।",
);
const chem = (en: string, bn: string, doseEn: string | null = null, doseBn = ""): T => ({ type: "chemical", remedy: l(en, bn), dosage: doseEn ? l(doseEn, doseBn) : null, precautions: PPE });
const org = (en: string, bn: string): T => ({ type: "organic", remedy: l(en, bn), dosage: null, precautions: null });
const prev = (en: string, bn: string): T => ({ type: "preventive", remedy: l(en, bn), dosage: null, precautions: null });

export type ExtraModel = "rice" | "india" | "soybean" | "jute";

export interface ExtraDef {
  model: ExtraModel;
  label: string;
  crop: string;
  name: L;
  type: DiseaseType;
  pathogen: string | null;
  symptoms: L;
  causes: L;
  treatments: T[];
}

const d = (model: ExtraModel, label: string, crop: string, name: L, type: DiseaseType, pathogen: string | null, symptoms: L, causes: L, treatments: T[]): ExtraDef => ({
  model, label, crop, name, type, pathogen, symptoms, causes, treatments,
});

const healthy = (model: ExtraModel, label: string, crop: string, tipEn: string, tipBn: string): ExtraDef =>
  d(model, label, crop, l("Healthy", "সুস্থ"), "healthy", null,
    l("No disease or pest signs found. The leaf looks normal.", "কোনো রোগ বা পোকার লক্ষণ পাওয়া যায়নি। পাতা স্বাভাবিক দেখাচ্ছে।"),
    l("Keep up good field care to keep the crop healthy.", "ফসল সুস্থ রাখতে মাঠের সঠিক যত্ন চালিয়ে যান।"),
    [
      prev("Check the field every week, including leaf undersides, to catch problems early.", "সমস্যা আগেভাগে ধরতে প্রতি সপ্তাহে পাতার নিচসহ মাঠ পরীক্ষা করুন।"),
      prev("Use balanced fertiliser (do not overuse urea) and keep the field free of weeds.", "সুষম সার দিন (অতিরিক্ত ইউরিয়া নয়) এবং মাঠ আগাছামুক্ত রাখুন।"),
      prev(tipEn, tipBn),
    ]);

// ---------------- Rice (model: Shaq2/chashibhai-rice-disease-cls) ----------------
const RICE: ExtraDef[] = [
  d("rice", "Rice__Bacterial_Leaf_Blight", "rice", l("Bacterial Leaf Blight", "পাতাপোড়া রোগ (ব্যাকটেরিয়াল লিফ ব্লাইট)"), "bacteria", "Xanthomonas oryzae pv. oryzae",
    l("Water-soaked yellowish stripes start at leaf tips or edges and turn straw-white; leaves dry from the tip down.", "পাতার আগা বা কিনারা থেকে পানিভেজা হলদেটে দাগ শুরু হয়ে খড়ের মতো সাদা হয়; পাতা আগা থেকে শুকিয়ে যায়।"),
    l("Bacterium spread by rain, irrigation water and wind; worse with too much urea and after storms.", "ব্যাকটেরিয়া বৃষ্টি, সেচের পানি ও বাতাসে ছড়ায়; অতিরিক্ত ইউরিয়া ও ঝড়ের পর বেশি হয়।"),
    [
      chem("No spray fully cures it. Stop urea, apply extra potash (MOP); a copper-based bactericide can slow the spread.", "কোনো স্প্রে পুরোপুরি সারায় না। ইউরিয়া বন্ধ করুন, অতিরিক্ত পটাশ (এমওপি) দিন; কপারভিত্তিক বালাইনাশক ছড়ানো কমাতে পারে।"),
      org("Drain the field for a few days and remove badly infected plants.", "কয়েক দিন জমির পানি সরিয়ে দিন এবং বেশি আক্রান্ত গাছ তুলে ফেলুন।"),
      prev("Grow resistant varieties, use balanced fertiliser and avoid cutting seedling tips at transplanting.", "প্রতিরোধী জাত চাষ করুন, সুষম সার দিন এবং রোপণের সময় চারার আগা কাটবেন না।"),
    ]),
  d("rice", "Rice__Brown_Spot", "rice", l("Brown Spot", "বাদামি দাগ রোগ"), "fungus", "Bipolaris oryzae",
    l("Many oval brown spots with grey centres on leaves; seeds may turn dark.", "পাতায় ধূসর মাঝখানসহ অনেক ডিম্বাকার বাদামি দাগ; ধানের দানা কালচে হতে পারে।"),
    l("Fungus carried on seed; common in poor, nutrient-deficient soils and dry spells.", "বীজবাহিত ছত্রাক; পুষ্টিহীন মাটি ও খরার সময় বেশি হয়।"),
    [
      chem("Spray Propiconazole 25 EC at first symptoms; repeat after 10–15 days if needed.", "প্রথম লক্ষণে প্রোপিকোনাজল ২৫ ইসি স্প্রে করুন; প্রয়োজনে ১০–১৫ দিন পর আবার দিন।", "1 mL per litre of water", "প্রতি লিটার পানিতে ১ মিলি"),
      org("Apply balanced fertiliser with enough potash and zinc; treat seed in hot water (52 °C, 10 min).", "পর্যাপ্ত পটাশ ও দস্তাসহ সুষম সার দিন; বীজ গরম পানিতে (৫২ °সে, ১০ মিনিট) শোধন করুন।"),
      prev("Use healthy, treated seed and keep soil fertile.", "সুস্থ, শোধিত বীজ ব্যবহার করুন এবং মাটির উর্বরতা বজায় রাখুন।"),
    ]),
  healthy("rice", "Rice__Healthy_Leaf", "rice", "Keep 2–5 cm of water in the field during tillering and avoid excess urea.", "কুশি পর্যায়ে জমিতে ২–৫ সেমি পানি রাখুন এবং অতিরিক্ত ইউরিয়া এড়িয়ে চলুন।"),
  d("rice", "Rice__Leaf_Blast", "rice", l("Leaf Blast", "ব্লাস্ট রোগ"), "fungus", "Magnaporthe oryzae",
    l("Spindle- or eye-shaped spots with grey centres and brown edges; spots join and leaves die. Neck blast makes panicles white and empty.", "মাকুর বা চোখের মতো দাগ, মাঝখান ধূসর ও কিনারা বাদামি; দাগ মিলে পাতা মরে যায়। শীষ ব্লাস্টে শীষ সাদা ও চিটা হয়।"),
    l("Fungus spread by wind; favoured by cool nights, dew, cloudy weather and too much urea.", "বাতাসে ছড়ানো ছত্রাক; ঠান্ডা রাত, শিশির, মেঘলা আবহাওয়া ও অতিরিক্ত ইউরিয়ায় বাড়ে।"),
    [
      chem("Spray Tricyclazole 75 WP at first spots, and again at booting/heading for neck blast.", "প্রথম দাগে ট্রাইসাইক্লাজল ৭৫ ডব্লিউপি স্প্রে করুন এবং শীষ ব্লাস্ট ঠেকাতে থোড়/শীষ বের হওয়ার সময় আবার দিন।", "0.6 g per litre of water", "প্রতি লিটার পানিতে ০.৬ গ্রাম"),
      org("Stop urea top-dressing and keep standing water in the field.", "ইউরিয়ার উপরি প্রয়োগ বন্ধ করুন এবং জমিতে পানি ধরে রাখুন।"),
      prev("Grow blast-resistant varieties and split nitrogen into small doses.", "ব্লাস্ট-প্রতিরোধী জাত চাষ করুন এবং নাইট্রোজেন ছোট ছোট কিস্তিতে দিন।"),
    ]),
  d("rice", "Rice__Leaf_Scald", "rice", l("Leaf Scald", "পাতা ঝলসা রোগ (লিফ স্ক্যাল্ড)"), "fungus", "Microdochium oryzae",
    l("Large zoned lesions start at leaf tips with alternating light and dark brown bands; tips look scalded.", "পাতার আগা থেকে হালকা ও গাঢ় বাদামি ডোরাকাটা বড় দাগ; আগা পোড়া দেখায়।"),
    l("Fungus favoured by high nitrogen, close spacing and wet weather.", "বেশি নাইট্রোজেন, ঘন রোপণ ও ভেজা আবহাওয়ায় ছত্রাকটি বাড়ে।"),
    [
      chem("Spray Propiconazole 25 EC or Mancozeb 75 WP when lesions appear.", "দাগ দেখা দিলে প্রোপিকোনাজল ২৫ ইসি বা ম্যানকোজেব ৭৫ ডব্লিউপি স্প্রে করুন।", "1 mL (Propiconazole) or 2.5 g (Mancozeb) per litre", "প্রতি লিটারে ১ মিলি (প্রোপিকোনাজল) বা ২.৫ গ্রাম (ম্যানকোজেব)"),
      org("Remove infected leaves and crop residue; reduce nitrogen.", "আক্রান্ত পাতা ও ফসলের অবশিষ্টাংশ সরান; নাইট্রোজেন কমান।"),
      prev("Use balanced fertiliser and recommended plant spacing.", "সুষম সার ও সুপারিশকৃত দূরত্বে রোপণ করুন।"),
    ]),
  d("rice", "Rice__Narrow_Brown_Leaf_Spot", "rice", l("Narrow Brown Leaf Spot", "সরু বাদামি দাগ রোগ"), "fungus", "Cercospora janseana",
    l("Short, narrow, dark brown streaks running parallel to the leaf veins.", "পাতার শিরার সমান্তরালে ছোট, সরু, গাঢ় বাদামি রেখা।"),
    l("Fungus favoured by potash deficiency and late-season humidity.", "পটাশের অভাব ও মৌসুমের শেষ দিকের আর্দ্রতায় ছত্রাকটি বাড়ে।"),
    [
      chem("Spray Propiconazole 25 EC if the disease spreads to upper leaves.", "রোগ উপরের পাতায় ছড়ালে প্রোপিকোনাজল ২৫ ইসি স্প্রে করুন।", "1 mL per litre of water", "প্রতি লিটার পানিতে ১ মিলি"),
      org("Apply enough potash and remove infected stubble after harvest.", "পর্যাপ্ত পটাশ দিন এবং ফসল কাটার পর আক্রান্ত নাড়া সরিয়ে ফেলুন।"),
      prev("Grow tolerant varieties and use balanced fertiliser.", "সহনশীল জাত চাষ করুন এবং সুষম সার দিন।"),
    ]),
  d("rice", "Rice__Rice_Hispa", "rice", l("Rice Hispa", "পামরি পোকা"), "pest", "Dicladispa armigera",
    l("White parallel streaks on leaves where adults scrape the surface; larvae tunnel inside leaves, which dry and turn white.", "পূর্ণবয়স্ক পোকা পাতা চেঁছে খাওয়ায় সাদা সমান্তরাল দাগ হয়; কীড়া পাতার ভেতরে সুড়ঙ্গ করে, পাতা শুকিয়ে সাদা হয়।"),
    l("A small spiny black beetle; outbreaks follow heavy urea use and grassy weeds.", "ছোট কাঁটাযুক্ত কালো পোকা; অতিরিক্ত ইউরিয়া ও ঘাসজাতীয় আগাছায় প্রকোপ বাড়ে।"),
    [
      chem("Spray Malathion 57 EC when there are more than 4 adults per hill.", "প্রতি গোছায় ৪টির বেশি পূর্ণবয়স্ক পোকা থাকলে ম্যালাথিয়ন ৫৭ ইসি স্প্রে করুন।", "2 mL per litre of water", "প্রতি লিটার পানিতে ২ মিলি"),
      org("Catch adults with a sweep net; cut and destroy leaf tips with eggs before transplanting.", "হাতজাল দিয়ে পূর্ণবয়স্ক পোকা ধরুন; রোপণের আগে ডিমযুক্ত পাতার আগা কেটে নষ্ট করুন।"),
      prev("Avoid excess urea and remove grassy weeds around the field.", "অতিরিক্ত ইউরিয়া এড়িয়ে চলুন এবং জমির আশপাশের ঘাস পরিষ্কার রাখুন।"),
    ]),
  d("rice", "Rice__Sheath_Blight", "rice", l("Sheath Blight", "খোল পোড়া রোগ"), "fungus", "Rhizoctonia solani",
    l("Oval greenish-grey blotches with brown borders on the leaf sheath near the water line, spreading up to the leaves.", "পানির উপরিভাগের কাছে খোলে বাদামি কিনারাসহ ডিম্বাকার সবুজাভ-ধূসর দাগ, যা উপরের পাতায় ছড়ায়।"),
    l("Soil-borne fungus; favoured by dense planting, high nitrogen, heat and humidity.", "মাটিবাহিত ছত্রাক; ঘন রোপণ, বেশি নাইট্রোজেন, গরম ও আর্দ্রতায় বাড়ে।"),
    [
      chem("Spray Hexaconazole 5 EC or Azoxystrobin 23 SC at the base of the plants.", "গাছের গোড়ায় হেক্সাকোনাজল ৫ ইসি বা অ্যাজোক্সিস্ট্রোবিন ২৩ এসসি স্প্রে করুন।", "1 mL per litre of water", "প্রতি লিটার পানিতে ১ মিলি"),
      org("Drain the field for a few days and remove infected lower leaves.", "কয়েক দিন জমির পানি সরিয়ে দিন এবং আক্রান্ত নিচের পাতা সরান।"),
      prev("Use wider spacing, balanced nitrogen and remove stubble after harvest.", "দূরে দূরে রোপণ করুন, সুষম নাইট্রোজেন দিন এবং ফসল কাটার পর নাড়া সরান।"),
    ]),
];

// ---------------- Wheat (model: sanjeevani-04/indian-crop-disease-mobilenetv2, wheat classes) ----------------
const PROPI_W = chem("Spray Propiconazole 25 EC as soon as symptoms appear; repeat after 12–15 days if needed.", "লক্ষণ দেখা দেওয়ামাত্র প্রোপিকোনাজল ২৫ ইসি স্প্রে করুন; প্রয়োজনে ১২–১৫ দিন পর আবার দিন।", "0.5 mL per litre of water", "প্রতি লিটার পানিতে ০.৫ মিলি");
const RUST_PREV = prev("Grow rust-resistant varieties and sow on time (mid-November in Bangladesh).", "মরিচা-প্রতিরোধী জাত চাষ করুন এবং সময়মতো (বাংলাদেশে নভেম্বরের মাঝামাঝি) বপন করুন।");
const WHEAT: ExtraDef[] = [
  d("india", "Wheat___Black_Rust", "wheat", l("Black (Stem) Rust", "কালো মরিচা (কাণ্ডের মরিচা)"), "fungus", "Puccinia graminis",
    l("Elongated brick-red pustules on stems and leaves that later turn black; stems weaken and lodge.", "কাণ্ড ও পাতায় লম্বাটে ইটের মতো লাল ফুসকুড়ি, পরে কালো হয়; কাণ্ড দুর্বল হয়ে হেলে পড়ে।"),
    l("Rust fungus spread over long distances by wind; warm, humid weather.", "বাতাসে বহু দূর ছড়ানো মরিচা ছত্রাক; উষ্ণ, আর্দ্র আবহাওয়ায় বাড়ে।"),
    [PROPI_W, org("Remove volunteer wheat and grassy hosts near the field.", "মাঠের আশপাশের আপনা-আপনি গজানো গম ও ঘাস সরিয়ে ফেলুন।"), RUST_PREV]),
  d("india", "Wheat___Brown_Rust", "wheat", l("Brown (Leaf) Rust", "পাতার মরিচা (বাদামি মরিচা)"), "fungus", "Puccinia triticina",
    l("Small round orange-brown pustules scattered on the upper leaf surface; rubbing the leaf leaves rusty powder on fingers.", "পাতার উপরে ছড়ানো ছোট গোল কমলা-বাদামি ফুসকুড়ি; ঘষলে আঙুলে মরিচার মতো গুঁড়া লাগে।"),
    l("Rust fungus spread by wind; moderate temperatures and dew.", "বাতাসে ছড়ানো মরিচা ছত্রাক; মাঝারি তাপমাত্রা ও শিশিরে বাড়ে।"),
    [PROPI_W, org("Remove volunteer wheat plants; avoid very late sowing.", "আপনা-আপনি গজানো গম সরান; খুব দেরিতে বপন করবেন না।"), RUST_PREV]),
  d("india", "Wheat___Flag_Smut", "wheat", l("Flag Smut", "ফ্ল্যাগ স্মাট"), "fungus", "Urocystis agropyri",
    l("Long grey-black streaks on leaves and sheaths that burst into black powder; leaves twist and plants stay stunted.", "পাতা ও খোলে লম্বা ধূসর-কালো রেখা যা ফেটে কালো গুঁড়া বের হয়; পাতা মোচড়ায় ও গাছ খাটো থাকে।"),
    l("Seed- and soil-borne fungus.", "বীজ ও মাটিবাহিত ছত্রাক।"),
    [
      chem("Treat seed with Carboxin + Thiram (e.g. 'Vitavax 200' type) before sowing.", "বপনের আগে কার্বক্সিন + থিরাম ('ভিটাভেক্স ২০০' ধরনের) দিয়ে বীজ শোধন করুন।", "3 g per kg of seed", "প্রতি কেজি বীজে ৩ গ্রাম"),
      org("Pull out and burn infected plants before the spores spread.", "রেণু ছড়ানোর আগে আক্রান্ত গাছ তুলে পুড়িয়ে ফেলুন।"),
      prev("Use certified seed and rotate with non-cereal crops.", "প্রত্যয়িত বীজ ব্যবহার করুন এবং দানাশস্য নয় এমন ফসলের সাথে শস্যপর্যায় মানুন।"),
    ]),
  healthy("india", "Wheat___Healthy", "wheat", "Give 2–3 irrigations at crown-root initiation, booting and grain filling.", "শিকড় গজানো, থোড় ও দানা পুষ্ট হওয়ার সময় ২–৩টি সেচ দিন।"),
  d("india", "Wheat___Leaf_Blight", "wheat", l("Leaf Blight (Spot Blotch)", "পাতা ঝলসানো রোগ (বাইপোলারিস)"), "fungus", "Bipolaris sorokiniana",
    l("Brown oval spots with yellow halos join into large dead patches; leaves dry early. A major wheat disease in Bangladesh.", "হলুদ বলয়সহ বাদামি ডিম্বাকার দাগ মিলে বড় মরা অংশ হয়; পাতা আগেই শুকায়। বাংলাদেশে গমের প্রধান রোগ।"),
    l("Seed-borne fungus; warm, humid weather after heading and late sowing.", "বীজবাহিত ছত্রাক; শীষ বের হওয়ার পর উষ্ণ, আর্দ্র আবহাওয়া ও দেরিতে বপনে বাড়ে।"),
    [PROPI_W, org("Treat seed (Carboxin + Thiram, 3 g/kg) and remove infected residue.", "বীজ শোধন করুন (কার্বক্সিন + থিরাম, প্রতি কেজিতে ৩ গ্রাম) এবং আক্রান্ত অবশিষ্টাংশ সরান।"), prev("Sow on time, use tolerant varieties and balanced fertiliser.", "সময়মতো বপন করুন, সহনশীল জাত ও সুষম সার ব্যবহার করুন।")]),
  d("india", "Wheat___Powdery_Mildew", "wheat", l("Powdery Mildew", "পাউডারি মিলডিউ (সাদা গুঁড়া রোগ)"), "fungus", "Blumeria graminis f. sp. tritici",
    l("White to grey powdery patches on leaves and stems; leaves yellow and dry.", "পাতা ও কাণ্ডে সাদা থেকে ধূসর পাউডারের মতো ছোপ; পাতা হলুদ হয়ে শুকায়।"),
    l("Fungus favoured by cool, cloudy, humid weather and dense crops.", "ঠান্ডা, মেঘলা, আর্দ্র আবহাওয়া ও ঘন ফসলে ছত্রাকটি বাড়ে।"),
    [PROPI_W, org("Spray wettable sulphur (2 g per litre).", "ভেজানো যায় এমন সালফার (প্রতি লিটারে ২ গ্রাম) স্প্রে করুন।"), prev("Avoid excess nitrogen and very dense sowing.", "অতিরিক্ত নাইট্রোজেন ও খুব ঘন বপন এড়িয়ে চলুন।")]),
  d("india", "Wheat___Scab", "wheat", l("Scab (Head Blight)", "স্ক্যাব (শীষ ঝলসানো রোগ)"), "fungus", "Fusarium graminearum",
    l("Parts of the spike turn bleached white; pink-orange fungal growth at the base of spikelets; shrivelled grains.", "শীষের অংশ সাদা হয়ে যায়; ছোট শীষের গোড়ায় গোলাপি-কমলা ছত্রাক; দানা চিটা হয়।"),
    l("Fungus infects at flowering during warm, wet weather; survives on maize and wheat residue.", "উষ্ণ, ভেজা আবহাওয়ায় ফুল ফোটার সময় সংক্রমণ; ভুট্টা ও গমের অবশিষ্টাংশে বেঁচে থাকে।"),
    [chem("Spray Tebuconazole 25 EC at early flowering.", "ফুল ফোটার শুরুতে টেবুকোনাজল ২৫ ইসি স্প্রে করুন।", "1 mL per litre of water", "প্রতি লিটার পানিতে ১ মিলি"), org("Plough under crop residue after harvest.", "ফসল কাটার পর অবশিষ্টাংশ চাষ দিয়ে মাটিতে মিশিয়ে দিন।"), prev("Do not grow wheat right after maize; use clean seed.", "ভুট্টার ঠিক পরে গম চাষ করবেন না; পরিষ্কার বীজ ব্যবহার করুন।")]),
  d("india", "Wheat___Yellow_Rust", "wheat", l("Yellow (Stripe) Rust", "হলুদ মরিচা"), "fungus", "Puccinia striiformis",
    l("Bright yellow pustules arranged in stripes along the leaf veins; yellow powder on hands.", "পাতার শিরা বরাবর ডোরাকাটা সারিতে উজ্জ্বল হলুদ ফুসকুড়ি; হাতে হলুদ গুঁড়া লাগে।"),
    l("Rust fungus spread by wind; cool (10–15 °C), humid weather.", "বাতাসে ছড়ানো মরিচা ছত্রাক; ঠান্ডা (১০–১৫ °সে), আর্দ্র আবহাওয়ায় বাড়ে।"),
    [PROPI_W, org("Remove volunteer wheat; scout fields weekly from January.", "আপনা-আপনি গজানো গম সরান; জানুয়ারি থেকে প্রতি সপ্তাহে মাঠ পর্যবেক্ষণ করুন।"), RUST_PREV]),
];

// ---------------- Soybean (model: ixrbhii/soybean-disease-convnext) ----------------
const SOYBEAN: ExtraDef[] = [
  d("soybean", "Downy Mildew", "soybean", l("Downy Mildew", "ডাউনি মিলডিউ"), "oomycete", "Peronospora manshurica",
    l("Pale yellow-green spots on the upper leaf; grey fuzzy growth underneath; spots turn brown.", "পাতার উপরে ফ্যাকাশে হলদে-সবুজ দাগ; নিচে ধূসর তুলার মতো আস্তরণ; দাগ বাদামি হয়।"),
    l("Water mould carried on seed and residue; cool, wet weather.", "বীজ ও অবশিষ্টাংশবাহিত পানির ছত্রাক; ঠান্ডা, ভেজা আবহাওয়ায় বাড়ে।"),
    [chem("Spray Metalaxyl + Mancozeb when spots appear.", "দাগ দেখা দিলে মেটালাক্সিল + ম্যানকোজেব স্প্রে করুন।", "2 g per litre of water", "প্রতি লিটার পানিতে ২ গ্রাম"), org("Remove infected leaves and improve air flow.", "আক্রান্ত পাতা সরান এবং বাতাস চলাচল বাড়ান।"), prev("Use clean seed and rotate crops.", "পরিষ্কার বীজ ব্যবহার করুন ও শস্যপর্যায় মানুন।")]),
  d("soybean", "Frogeye Leaf Spot", "soybean", l("Frogeye Leaf Spot", "ফ্রগআই পাতার দাগ"), "fungus", "Cercospora sojina",
    l("Small round spots with grey centres and red-brown borders, like a frog's eye.", "ধূসর মাঝখান ও লালচে-বাদামি কিনারাসহ ছোট গোল দাগ, ব্যাঙের চোখের মতো।"),
    l("Fungus on infected residue and seed; warm, humid weather.", "আক্রান্ত অবশিষ্টাংশ ও বীজে ছত্রাক; উষ্ণ, আর্দ্র আবহাওয়ায় বাড়ে।"),
    [chem("Spray Azoxystrobin 23 SC at first spots.", "প্রথম দাগে অ্যাজোক্সিস্ট্রোবিন ২৩ এসসি স্প্রে করুন।", "1 mL per litre of water", "প্রতি লিটার পানিতে ১ মিলি"), org("Plough under residue after harvest.", "ফসল কাটার পর অবশিষ্টাংশ মাটিতে মিশিয়ে দিন।"), prev("Grow resistant varieties and rotate for at least one year.", "প্রতিরোধী জাত চাষ করুন এবং অন্তত এক বছর শস্যপর্যায় মানুন।")]),
  healthy("soybean", "Healthy", "soybean", "Use good-quality seed and keep plant spacing open for air flow.", "মানসম্মত বীজ ব্যবহার করুন এবং বাতাস চলাচলের জন্য গাছের মাঝে ফাঁকা রাখুন।"),
  d("soybean", "Mosaic Virus", "soybean", l("Mosaic Virus", "মোজাইক ভাইরাস"), "virus", "Soybean mosaic virus (SMV)",
    l("Light and dark green mottling, puckered and curled leaves; stunted plants and mottled seeds.", "হালকা ও গাঢ় সবুজ ছোপ, কোঁচকানো ও কুঁকড়ানো পাতা; গাছ খাটো ও বীজে দাগ।"),
    l("Virus spread by aphids and infected seed.", "জাবপোকা ও আক্রান্ত বীজের মাধ্যমে ছড়ানো ভাইরাস।"),
    [chem("No cure for the virus. Control aphids with Imidacloprid 17.8 SL.", "ভাইরাসের কোনো প্রতিকার নেই। ইমিডাক্লোপ্রিড ১৭.৮ এসএল দিয়ে জাবপোকা দমন করুন।", "0.5 mL per litre of water", "প্রতি লিটার পানিতে ০.৫ মিলি"), org("Remove infected plants early; use yellow sticky traps for aphids.", "আক্রান্ত গাছ আগেভাগে সরান; জাবপোকার জন্য হলুদ আঠালো ফাঁদ দিন।"), prev("Sow virus-free seed and resistant varieties.", "ভাইরাসমুক্ত বীজ ও প্রতিরোধী জাত বপন করুন।")]),
  d("soybean", "Rust", "soybean", l("Rust", "মরিচা রোগ"), "fungus", "Phakopsora pachyrhizi",
    l("Small tan to reddish-brown lesions mainly on the underside of leaves; leaves yellow and drop early.", "মূলত পাতার নিচে ছোট হালকা বাদামি থেকে লালচে-বাদামি দাগ; পাতা হলুদ হয়ে আগেই ঝরে।"),
    l("Rust fungus spread by wind; warm, humid weather with long leaf wetness.", "বাতাসে ছড়ানো মরিচা ছত্রাক; উষ্ণ, আর্দ্র আবহাওয়া ও দীর্ঘক্ষণ পাতা ভেজা থাকলে বাড়ে।"),
    [chem("Spray Tebuconazole 25 EC at first symptoms; repeat after 15 days.", "প্রথম লক্ষণে টেবুকোনাজল ২৫ ইসি স্প্রে করুন; ১৫ দিন পর আবার দিন।", "1 mL per litre of water", "প্রতি লিটার পানিতে ১ মিলি"), org("Remove heavily infected leaves and volunteer plants.", "বেশি আক্রান্ত পাতা ও আপনা-আপনি গজানো গাছ সরান।"), prev("Sow early and grow tolerant varieties.", "আগাম বপন করুন এবং সহনশীল জাত চাষ করুন।")]),
  d("soybean", "Septoria Brown Spot", "soybean", l("Septoria Brown Spot", "সেপ্টোরিয়া বাদামি দাগ"), "fungus", "Septoria glycines",
    l("Small irregular dark brown spots on lower leaves, often with yellowing around them; spreads upward.", "নিচের পাতায় ছোট অনিয়মিত গাঢ় বাদামি দাগ, চারপাশে প্রায়ই হলুদ; উপরের দিকে ছড়ায়।"),
    l("Fungus survives on residue; spread by rain splash in warm, wet weather.", "অবশিষ্টাংশে বেঁচে থাকা ছত্রাক; উষ্ণ, ভেজা আবহাওয়ায় বৃষ্টির ছিটায় ছড়ায়।"),
    [chem("Spray Mancozeb 75 WP if spots reach the middle of the plant.", "দাগ গাছের মাঝামাঝি পৌঁছালে ম্যানকোজেব ৭৫ ডব্লিউপি স্প্রে করুন।", "2 g per litre of water", "প্রতি লিটার পানিতে ২ গ্রাম"), org("Plough under residue and remove infected lower leaves.", "অবশিষ্টাংশ মাটিতে মিশিয়ে দিন এবং আক্রান্ত নিচের পাতা সরান।"), prev("Rotate with cereals and use clean seed.", "দানাশস্যের সাথে শস্যপর্যায় মানুন এবং পরিষ্কার বীজ ব্যবহার করুন।")]),
];

// ---------------- Jute pests (model: dimasichsanul/jute_pest_classification) ----------------
const JUTE_ORG = org(
  "Hand-pick larvae and egg masses, use light traps at night, and spray neem oil (5 mL per litre) on young stages.",
  "কীড়া ও ডিমের গাদা হাতে তুলে নষ্ট করুন, রাতে আলোর ফাঁদ দিন এবং ছোট অবস্থায় নিম তেল (প্রতি লিটারে ৫ মিলি) স্প্রে করুন।",
);
const JUTE_PREV = prev(
  "Keep the field and borders weed-free, sow on time, use balanced fertiliser and check plants twice a week.",
  "মাঠ ও আইল আগাছামুক্ত রাখুন, সময়মতো বপন করুন, সুষম সার দিন এবং সপ্তাহে দুবার গাছ পরীক্ষা করুন।",
);
type ChemSpec = readonly [string, string, string, string];
const pest = (label: string, en: string, bn: string, sci: string, dmgEn: string, dmgBn: string, c: ChemSpec): ExtraDef =>
  d("jute", label, "jute", l(en, bn), "pest", sci, l(dmgEn, dmgBn),
    l(`Insect/mite pest (${sci}). Usually worse in warm, humid weather and weedy fields.`, `পোকা/মাকড় (${sci})। সাধারণত উষ্ণ, আর্দ্র আবহাওয়া ও আগাছাপূর্ণ মাঠে বেশি হয়।`),
    [chem(c[0], c[1], c[2], c[3]), JUTE_ORG, JUTE_PREV]);

const CYPER: ChemSpec = ["Spray Cypermethrin 10 EC when damage is first seen.", "ক্ষতি প্রথম দেখা দিলে সাইপারমেথ্রিন ১০ ইসি স্প্রে করুন।", "1 mL per litre of water", "প্রতি লিটার পানিতে ১ মিলি"];
const EMAM: ChemSpec = ["Spray Emamectin benzoate 5 SG on young larvae.", "ছোট কীড়ার ওপর এমামেকটিন বেনজোয়েট ৫ এসজি স্প্রে করুন।", "1 g per litre of water", "প্রতি লিটার পানিতে ১ গ্রাম"];
const CHLOR: ChemSpec = ["Apply Chlorpyrifos 20 EC around the plant base in the evening.", "সন্ধ্যায় গাছের গোড়ার চারপাশে ক্লোরপাইরিফস ২০ ইসি প্রয়োগ করুন।", "2 mL per litre of water", "প্রতি লিটার পানিতে ২ মিলি"];
const IMIDA: ChemSpec = ["Spray Imidacloprid 17.8 SL on infested plants.", "আক্রান্ত গাছে ইমিডাক্লোপ্রিড ১৭.৮ এসএল স্প্রে করুন।", "0.5 mL per litre of water", "প্রতি লিটার পানিতে ০.৫ মিলি"];
const MITE: ChemSpec = ["Spray wettable sulphur 80 WG or Abamectin 1.8 EC on leaf undersides and young tips.", "পাতার নিচে ও কচি ডগায় সালফার ৮০ ডব্লিউজি বা অ্যাবামেকটিন ১.৮ ইসি স্প্রে করুন।", "2 g (sulphur) or 1 mL (Abamectin) per litre", "প্রতি লিটারে ২ গ্রাম (সালফার) বা ১ মিলি (অ্যাবামেকটিন)"];
const TERMITE: ChemSpec = ["Drench the soil around affected plants with Chlorpyrifos 20 EC.", "আক্রান্ত গাছের চারপাশের মাটিতে ক্লোরপাইরিফস ২০ ইসি ঢেলে দিন।", "4 mL per litre of water", "প্রতি লিটার পানিতে ৪ মিলি"];

const JUTE: ExtraDef[] = [
  pest("Beet Armyworm", "Beet Armyworm", "বিট আর্মিওয়ার্ম (লেদা পোকা)", "Spodoptera exigua", "Green larvae feed in groups, skeletonising and then eating whole leaves.", "সবুজ কীড়া দল বেঁধে পাতা ঝাঁঝরা করে, পরে পুরো পাতা খেয়ে ফেলে।", EMAM),
  pest("Black Hairy", "Black Hairy Caterpillar", "কালো শুঁয়োপোকা", "Estigmene / Spilosoma spp.", "Hairy black caterpillars eat leaves; heavy attacks strip plants bare.", "লোমশ কালো শুঁয়োপোকা পাতা খায়; বেশি আক্রমণে গাছ পাতাশূন্য হয়।", CYPER),
  pest("Cutworm", "Cutworm", "কাটুই পোকা", "Agrotis ipsilon", "Larvae hide in soil by day and cut young seedlings at the base at night.", "কীড়া দিনে মাটিতে লুকিয়ে থাকে এবং রাতে কচি চারা গোড়া থেকে কেটে দেয়।", CHLOR),
  pest("Field Cricket", "Field Cricket", "মাঠের ঝিঁঝিঁ পোকা", "Gryllus / Brachytrupes spp.", "Crickets cut seedlings and feed on young leaves at night.", "ঝিঁঝিঁ পোকা রাতে চারা কাটে ও কচি পাতা খায়।", CHLOR),
  pest("Jute Aphid", "Jute Aphid", "পাটের জাবপোকা", "Aphis gossypii", "Tiny soft insects suck sap from tips and leaf undersides; leaves curl and plants become sticky.", "ছোট নরম পোকা ডগা ও পাতার নিচ থেকে রস চুষে খায়; পাতা কুঁকড়ায় ও গাছ আঠালো হয়।", IMIDA),
  pest("Jute Hairy", "Jute Hairy Caterpillar", "পাটের বিছা পোকা", "Spilarctia obliqua", "Young larvae feed together under leaves; older hairy larvae spread and eat whole leaves.", "ছোট কীড়া পাতার নিচে দল বেঁধে খায়; বড় লোমশ কীড়া ছড়িয়ে পুরো পাতা খেয়ে ফেলে।", CYPER),
  pest("Jute Red Mite", "Jute Red Mite", "পাটের লাল মাকড়", "Tetranychus spp.", "Tiny red mites under leaves cause pale speckles and fine webbing; leaves turn bronze and dry.", "পাতার নিচে ছোট লাল মাকড় ফ্যাকাশে দাগ ও সূক্ষ্ম জাল তৈরি করে; পাতা তামাটে হয়ে শুকায়।", MITE),
  pest("Jute Semilooper", "Jute Semilooper", "পাটের ঘোড়া পোকা", "Anomis sabulifera", "Green looping larvae eat the tender top leaves and buds, causing branching and poor fibre.", "সবুজ ঘোড়া পোকা কচি ডগার পাতা ও কুঁড়ি খায়, ফলে শাখা বের হয় ও আঁশ খারাপ হয়।", CYPER),
  pest("Jute Stem Girdler", "Jute Stem Girdler", "পাটের কাণ্ড বেষ্টনকারী পোকা", "Nupserha bicolor", "Beetles cut rings around the stem; the top wilts and the larva bores inside.", "পোকা কাণ্ডের চারদিকে বলয় কেটে দেয়; আগা নেতিয়ে পড়ে ও কীড়া ভেতরে ছিদ্র করে।", CHLOR),
  pest("Jute Stem Weevil", "Jute Stem Weevil", "পাটের কাণ্ডের উইভিল", "Apion corchori", "Small weevils lay eggs in the stem; larvae bore inside, causing knots and weak fibre.", "ছোট উইভিল কাণ্ডে ডিম পাড়ে; কীড়া ভেতরে ছিদ্র করে, গিঁট ও দুর্বল আঁশ হয়।", CHLOR),
  pest("Leaf Beetle", "Leaf Beetle", "পাতার বিটল", "Chrysomelidae", "Beetles chew holes in leaves, especially on young plants.", "বিটল পোকা পাতায় ছিদ্র করে খায়, বিশেষ করে কচি গাছে।", CYPER),
  pest("Mealybug", "Mealybug", "ছাতরা পোকা", "Maconellicoccus hirsutus", "White waxy insects cluster on stems and tips, sucking sap; tips become bunchy and stunted.", "সাদা মোমের মতো পোকা কাণ্ড ও ডগায় জড়ো হয়ে রস চুষে খায়; ডগা গুচ্ছ ও খাটো হয়।", IMIDA),
  pest("Pod Borer", "Pod Borer", "ফল ছিদ্রকারী পোকা", "Helicoverpa armigera", "Larvae bore into pods and buds and feed on seeds.", "কীড়া ফল ও কুঁড়িতে ছিদ্র করে বীজ খায়।", EMAM),
  pest("Scopula Emissaria", "Looper Moth (Scopula emissaria)", "লুপার মথ (স্কোপুলা)", "Scopula emissaria", "Looper larvae feed on leaves, leaving irregular holes.", "লুপার কীড়া পাতা খেয়ে অনিয়মিত ছিদ্র করে।", CYPER),
  pest("Termite", "Termite", "উইপোকা", "Isoptera", "Termites eat roots and the stem base; plants wilt and fall over, mostly in dry soil.", "উইপোকা শিকড় ও কাণ্ডের গোড়া খায়; গাছ নেতিয়ে পড়ে, সাধারণত শুকনো মাটিতে।", TERMITE),
  pest("Termite odontotermes (Rambur)", "Termite (Odontotermes)", "উইপোকা (ওডোন্টোটার্মিস)", "Odontotermes obesus", "Mound-building termites damage roots and lower stems, and cover stems with mud galleries.", "ঢিবি তৈরিকারী উইপোকা শিকড় ও নিচের কাণ্ড নষ্ট করে এবং কাণ্ড মাটির সুড়ঙ্গে ঢেকে দেয়।", TERMITE),
  pest("Yellow Mite", "Yellow Mite", "হলুদ মাকড়", "Polyphagotarsonemus latus", "Tiny mites on tender tips make young leaves curl down, turn copper-coloured and brittle. A key jute pest.", "কচি ডগায় ছোট মাকড় নতুন পাতা নিচের দিকে কোঁকড়ায়, তামাটে ও ভঙ্গুর করে। পাটের প্রধান পোকা।", MITE),
];

export const EXTRA_DEFS: ExtraDef[] = [...RICE, ...WHEAT, ...SOYBEAN, ...JUTE];
