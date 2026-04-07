/**
 * Shared constants
 * Used across client application
 * @module shared/constants
 */

export const COMPANY_NAME = 'MukonoTalks';
export const CURRENCY = 'USD';
export const CURRENCY_SYMBOL = '$';
export const VAT_RATE = 0.15;
export const FREE_SHIPPING_THRESHOLD = 5000;
export const SHIPPING_COST = 350;

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELED: 'canceled',
};

export const COMPANY_TYPES = [
  'Manufacturer',
  'Distributor',
  'Contractor',
  'Retailer',
  'Government',
  'Research',
  'Other',
];

export const PACKAGING_TYPES = [
  'drum',
  'pail',
  'tote',
  'bag',
  'container',
  'can',
];

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  DEVELOPER: 'developer',
};

// Role hierarchy (higher index = higher privilege)
export const ROLE_HIERARCHY = ['customer', 'admin', 'developer'];

// MukonoTalks

