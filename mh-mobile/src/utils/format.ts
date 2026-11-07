export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const pct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${d.toLocaleDateString('pt-BR')} às ${time}`;
}

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

export function formatCep(s: string) {
  const d = onlyDigits(s).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Aceita vírgula ou ponto como separador decimal. */
export const parseDecimal = (s: string) => Number(s.trim().replace(',', '.'));