const round = v => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
const brl = v => round(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const applyPercent = (value, percent) => round(value * (1 - percent / 100));

module.exports = { round, brl, applyPercent };
