import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TreatmentTabs } from "../components/TreatmentTabs";
import { buildDiseases } from "../mocks/data/diseases";

const lateBlight = buildDiseases().find((d) => d.class_label === "Potato with Late Blight")!;

describe("TreatmentTabs", () => {
  it("shows chemical dosage when confident", () => {
    render(<TreatmentTabs treatments={lateBlight.treatments} />);
    expect(screen.getByText(/Metalaxyl/)).toBeInTheDocument();
    expect(screen.getByText(/2–2.5 g per litre/)).toBeInTheDocument();
  });

  it("hides chemical dosage when the AI is not confident", () => {
    render(<TreatmentTabs treatments={lateBlight.treatments} hideChemical />);
    expect(screen.queryByText(/Metalaxyl/)).not.toBeInTheDocument();
    expect(screen.getByText(/Chemical dosage is hidden/)).toBeInTheDocument();
  });

  it("switches to the organic tab", async () => {
    render(<TreatmentTabs treatments={lateBlight.treatments} />);
    fireEvent.click(screen.getByRole("tab", { name: /Organic/ }));
    expect(await screen.findByText(/copper hydroxide/)).toBeInTheDocument();
  });
});
