export function parseMoney(value: any): number {
  const cleaned = String(value ?? "")
    .replace(/[$,]/g, "")
    .trim();

  const amount = parseFloat(cleaned);

  return isNaN(amount) ? 0 : amount;
}