import { isValidNtu, normalizeNtu } from "../measurements";

describe("measurement validation", () => {
  it("accepts NTU values in the prototype range", () => {
    expect(isValidNtu(0)).toBe(true);
    expect(isValidNtu(500)).toBe(true);
  });

  it("rejects invalid NTU values", () => {
    expect(isValidNtu(-1)).toBe(false);
    expect(isValidNtu(501)).toBe(false);
    expect(isValidNtu(Number.NaN)).toBe(false);
  });

  it("normalizes values to one decimal place", () => {
    expect(normalizeNtu(12.345)).toBe(12.3);
  });
});
