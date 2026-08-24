export const MAX_NTU = 500;

export function normalizeNtu(value: number) {
  return Math.round(value * 10) / 10;
}

export function isValidNtu(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= MAX_NTU;
}
