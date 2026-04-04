export interface PaginatedResult<T> {
  data:       T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function paginationToSkipTake(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim();
}

export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { NGN: '₦', USD: '$', CNY: '¥', GHS: 'GH₵' };
  return `${symbols[currency] || currency}${amount.toLocaleString('en', { minimumFractionDigits: 2 })}`;
}

// Convert amount to kobo/cents for payment gateways
export function toSubunit(amount: number, currency: string): number {
  const noSubunit = ['NGN', 'GHS'];
  return noSubunit.includes(currency) ? amount * 100 : Math.round(amount * 100);
}

export function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SH-${ts}-${rand}`;
}

export function generateTrackingCode(): string {
  return 'SH' + Math.random().toString(36).substring(2, 8).toUpperCase();
}
