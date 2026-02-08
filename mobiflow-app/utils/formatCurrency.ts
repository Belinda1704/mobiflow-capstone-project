// formats numbers as RWF (e.g. 20 000 RWF or 5K)
export function formatRWF(amount: number, options?: { compact?: boolean }): string {
  const absAmount = Math.abs(amount);
  const formatted =
    options?.compact && absAmount >= 1000
      ? `${(absAmount / 1000).toFixed(0)}K`
      : Math.floor(absAmount)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} RWF`;
}

export function formatRWFWithSign(amount: number, options?: { compact?: boolean }): string {
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}${formatRWF(amount, options)}`;
}
