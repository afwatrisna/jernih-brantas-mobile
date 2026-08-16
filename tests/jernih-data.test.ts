import { describe, expect, it } from "vitest";

import { classifyNtu, sanitizeHistory } from "../lib/jernih-data";

describe("Jernih water-quality classification", () => {
  it("keeps the classification boundaries consistent", () => {
    expect(classifyNtu(5)).toMatchObject({ label: "Sangat Jernih", grade: "I" });
    expect(classifyNtu(5.1)).toMatchObject({ label: "Jernih", grade: "II" });
    expect(classifyNtu(25)).toMatchObject({ label: "Jernih", grade: "II" });
    expect(classifyNtu(25.1)).toMatchObject({ label: "Keruh", grade: "III" });
    expect(classifyNtu(50)).toMatchObject({ label: "Keruh", grade: "III" });
    expect(classifyNtu(50.1)).toMatchObject({ label: "Sangat Keruh", grade: "IV" });
  });
});

describe("Jernih local-history recovery", () => {
  it("keeps valid entries, sorts them, and ignores malformed stored records", () => {
    const history = sanitizeHistory({
      malang: [
        { id: "later", ntu: "13.46", ts: 200, sumber: "manual", alat: "Turbidimeter T-100", waktu: "10.00" },
        { id: "bad", ntu: "invalid", ts: 100, sumber: "sensor" },
        { id: "earlier", ntu: 8, ts: 100, sumber: "sensor", alat: "Sensor NTU-Logger V2", waktu: "09.00" },
      ],
      kediri: "not-an-array",
    });

    expect(history.malang).toHaveLength(2);
    expect(history.malang.map((entry) => entry.id)).toEqual(["earlier", "later"]);
    expect(history.malang[1].ntu).toBe(13.5);
    expect(history.kediri).toBeUndefined();
  });
});
