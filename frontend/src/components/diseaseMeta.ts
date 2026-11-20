import { Biohazard, Bug, Droplets, Microscope, ShieldCheck, Sprout } from "lucide-react";
import type { DiseaseType } from "../api/types";

// Kept in a non-component file so React Fast Refresh can hot-reload DiseaseCard.tsx cleanly.

export const TYPE_META: Record<DiseaseType, { Icon: typeof Sprout; tone: "soil" | "sky" | "danger" | "wheat" | "green"; gradient: string }> = {
  fungus: { Icon: Sprout, tone: "soil", gradient: "from-wheat-200 via-leaf-50 to-leaf-100" },
  bacteria: { Icon: Microscope, tone: "sky", gradient: "from-sky-200 via-leaf-50 to-leaf-100" },
  virus: { Icon: Biohazard, tone: "danger", gradient: "from-danger-100 via-leaf-50 to-leaf-100" },
  pest: { Icon: Bug, tone: "wheat", gradient: "from-wheat-200 via-wheat-200/40 to-leaf-50" },
  oomycete: { Icon: Droplets, tone: "sky", gradient: "from-sky-300/60 via-leaf-50 to-leaf-100" },
  healthy: { Icon: ShieldCheck, tone: "green", gradient: "from-leaf-200 via-leaf-100 to-leaf-50" },
};
