import { classifyNtu } from "../classification";

describe("classifyNtu", () => {
  it("classifies prototype NTU thresholds", () => {
    expect(classifyNtu(5).label).toBe("Sangat Jernih");
    expect(classifyNtu(25).label).toBe("Jernih");
    expect(classifyNtu(50).label).toBe("Keruh");
    expect(classifyNtu(50.1).label).toBe("Sangat Keruh");
  });
});
