export enum AutoupdateSchedules {
  Weekdays = '23 9,12,15,18,21 * * 1-5',
  Weekends = '17 16,20 * * 0,6',
  // b = '*/10 * * * * *',
}

export enum Timeouts {
  Start = 1000 * 2,
  Text = 1000 * 2,
  CronjobNextOrder = 1000 * 1,
  CronjobNextUser = 1000 * 10,
  GerUsers = 100,
}

export enum LogsTypes {
  Error = 'ERROR',
  ErrorAutoupdateRoot = 'ERROR_AUTOUPDATE_ROOT',
  ErrorAutoupdateOrder = 'ERROR_AUTOUPDATE_ORDER',
  ErrorBlockByUser = 'ERROR_BLOCK_BY_USER',
  ErrorUserNotFound = 'ERROR_USER_NOT_FOUND',
  ErrorUserNotAllowedToUpdateOrder = 'ERROR_USER_NOT_ALLOWED_TO_UPDATE_ORDER',
  ErrorOrderRequest = 'ERROR_ORDER_REQUEST',
  ErrorOrderValidate = 'ERROR_ORDER_VALIDATE',
  ErrorOrderDelete = 'ERROR_ORDER_DELETE',
  ErrorOrderNotFound = 'ERROR_ORDER_NOT_FOUND',
  ErrorOrdersNotFound = 'ERROR_ORDERS_NOT_FOUND',
  ErrorMaxOrdersPerUser = 'ERROR_MAX_ORDERS_PER_USER',

  DbUserCreated = 'DB_USER_CREATED',
  DbOrderCreated = 'DB_ORDER_CREATED',
  DbOrderUpdated = 'DB_ORDER_UPDATED',
  DbOrderDeleted = 'DB_ORDER_DELETED',
  DbOrderAuditCreated = 'DB_ORDER_AUDIT_CREATED',

  TgBotStart = 'TG_BOT_START',
  TgUserStart = 'TG_USER_START',
  TgUserUnsubscribed = 'TG_USER_UNSUBSCRIBED',
  TgUserSubscribed = 'TG_USER_SUBSCRIBED',
  TgUserSubscribedAlready = 'TG_USER_SUBSCRIBED_ALREADY',
  TgUserOrderStatus = 'TG_USER_ORDER_STATUS',
  TgUserFaqBase = 'TG_USER_FAQ_BASE',
  TgUserFaqStatuses = 'TG_USER_FAQ_STATUSES',
  TgUserSchedule = 'TG_USER_SCHEDULE',

  AutoupdateStart = 'AUTOUPDATE_START',
  AutoupdateOrderChanged = 'AUTOUPDATE_ORDER_CHANGED',
  AutoupdateOrderWithoutChanges = 'AUTOUPDATE_ORDER_WITHOUT_CHANGES',
  AutoupdateEnd = 'AUTOUPDATE_END',
}

export enum TextCommands {
  AdminSend = 'написать',
  AdminTest = 'test',

  Start1 = 'start',
  Start2 = 'старт',
  Start3 = 'начать',
  Help1 = 'help',
  Help2 = '/help',
  Help3 = 'помощь',
  Help4 = '/помощь',

  FaqBase = 'faq',
  FaqStatuses = 'статусы',
  Schedule = 'расписание',

  Unsubscribe = 'отписаться',
  Status = 'статус',
  StatusUpdate = 'обновить',
}
