"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
exports.paginationToSkipTake = paginationToSkipTake;
exports.generateOtp = generateOtp;
exports.slugify = slugify;
exports.formatCurrency = formatCurrency;
exports.toSubunit = toSubunit;
exports.generateOrderId = generateOrderId;
exports.generateTrackingCode = generateTrackingCode;
function paginate(data, total, page, limit) {
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
function paginationToSkipTake(page, limit) {
    return { skip: (page - 1) * limit, take: limit };
}
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .trim();
}
function formatCurrency(amount, currency) {
    const symbols = { NGN: '₦', USD: '$', CNY: '¥', GHS: 'GH₵' };
    return `${symbols[currency] || currency}${amount.toLocaleString('en', { minimumFractionDigits: 2 })}`;
}
function toSubunit(amount, currency) {
    const noSubunit = ['NGN', 'GHS'];
    return noSubunit.includes(currency) ? amount * 100 : Math.round(amount * 100);
}
function generateOrderId() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SH-${ts}-${rand}`;
}
function generateTrackingCode() {
    return 'SH' + Math.random().toString(36).substring(2, 8).toUpperCase();
}
//# sourceMappingURL=pagination.util.js.map