import { describe, expect, it } from "vitest";
import { difficultyLabel, speciesCode } from "../../../app/utils/plant-display";

describe("plant display", () => {
  it("maps difficulty values to Chinese labels", () => {
    expect(difficultyLabel("EASY")).toBe("容易");
    expect(difficultyLabel("medium")).toBe("适中");
    expect(difficultyLabel("HARD")).toBe("需要照料");
    expect(difficultyLabel(null)).toBe("未标注");
    expect(difficultyLabel("OTHER")).toBe("未标注");
  });

  it("pads the species code", () => {
    expect(speciesCode(1)).toBe("SP-001");
    expect(speciesCode(42)).toBe("SP-042");
  });
});
