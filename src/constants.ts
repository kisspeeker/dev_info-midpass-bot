export const START_CRONJOB_IMMEDIATELY = false;
export const USER_MAX_COUNT_CODES = 2;
export const CODE_UID_SHORT_LENGTH = 6;

export const API_ROUTE_MIDPASS_PROXIES = [
  'https://proxy0.kisspeeker.dev/midpass/api/request',
  'https://proxy1.kisspeeker.dev/midpass/api/request',
];

export const CRONJOB_SCHEDULES = [
  '23 9,12,15,18,21 * * 1-5', // Weekdays 9:23,12:23...21:23
  '17 16,20 * * 0,6', // Weekends 16:17,20:17
];

export const FALSY_PASSPORT_STATUSES = [
  'паспорт выдан',
  'отмена изготовления паспорта',
];
