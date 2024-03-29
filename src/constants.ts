export const MAX_ORDERS_PER_USER = 2;
export const ORDER_UID_LENGTH = 25;
export const ORDER_UID_SHORT_LENGTH = 6;
export const TG_RATE_LIMIT = 1000; // ms
export const API_MIDPASS_NETWORK_TIMEOUT = 10000; // ms
export const TG_OWNER_ID = process.env.TG_OWNER_ID;

export const API_ROUTE_MIDPASS_PROXIES = [
  'https://info.midpass.ru/api/request',
  // 'https://proxy0.kisspeeker.dev/midpass/api/request',
  // 'https://proxy1.kisspeeker.dev/midpass/api/request',
];

export const FALSY_PASSPORT_STATUSES = [
  'паспорт выдан',
  'отмена изготовления паспорта',
];
