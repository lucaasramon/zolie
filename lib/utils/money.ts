export function round(v: number | string): number {
  return Math.round((Number(v) + Number.EPSILON) * 100) / 100;
}

export function brl(v: number | string): string {
  return round(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function applyPercent(value: number, percent: number): number {
  return round(value * (1 - percent / 100));
}
