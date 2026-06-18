export const parseExpiry = (expiry: string): number => {
  if (/^\d+$/.test(expiry)) return parseInt(expiry, 10);
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return value * (multipliers[unit] ?? 1);
};
