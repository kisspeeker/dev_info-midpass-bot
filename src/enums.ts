export enum AutoupdateSchedules {
  Weekdays = '23 9,12,15,18,21 * * 1-5',
  Weekends = '17 16,20 * * 0,6',
  // b = '*/10 * * * * *',
}

export enum DbActions {
  Create = 'CREATE',
  Update = 'UPDATE',
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
  ErrorBotCatch = 'ERROR_BOT_CATCH',
  ErrorMidpassTimeout = 'ERROR_MIDPASS_TIMEOUT',
  ErrorAutoupdateRoot = 'ERROR_AUTOUPDATE_ROOT',
  ErrorAutoupdateOrder = 'ERROR_AUTOUPDATE_ORDER',
  ErrorBlockByUser = 'ERROR_BLOCK_BY_USER',
  ErrorUserSendMessage = 'ERROR_USER_SEND_MESSAGE',
  ErrorUserSendMessageInlineOrders = 'ERROR_USER_SEND_MESSAGE_INLINE_STATUSES',
  ErrorUserSendMessageInlineUnsubscribe = 'ERROR_USER_SEND_MESSAGE_INLINE_UNSUBSCRIBE',
  ErrorUserSendMessageStatus = 'ERROR_USER_SEND_MESSAGE_STATUS',
  ErrorUserCreate = 'ERROR_USER_CREATE',
  ErrorUsersFindAll = 'ERROR_USERS_FIND_ALL',
  ErrorUsersFindWithOrders = 'ERROR_USERS_FIND_WITH_ORDERS',
  ErrorUserNotFound = 'ERROR_USER_NOT_FOUND',
  ErrorUserNotAllowedToUpdateOrder = 'ERROR_USER_NOT_ALLOWED_TO_UPDATE_ORDER',
  ErrorOrderRequest = 'ERROR_ORDER_REQUEST',
  ErrorOrderRequestMidpassNotFound = 'ERROR_ORDER_REQUEST_MIDPASS_NOT_FOUND',
  ErrorOrderValidate = 'ERROR_ORDER_VALIDATE',
  ErrorOrderDelete = 'ERROR_ORDER_DELETE',
  ErrorOrderNotFound = 'ERROR_ORDER_NOT_FOUND',
  ErrorOrdersNotFound = 'ERROR_ORDERS_NOT_FOUND',
  ErrorMaxOrdersPerUser = 'ERROR_MAX_ORDERS_PER_USER',
  ErrorShowUser = 'ERROR_SHOW_USER',

  OrderRequestMidpass = 'ORDER_REQUEST_MIDPASS',

  DbUserCreated = 'DB_USER_CREATED',
  DbUserFind = 'DB_USER_FIND',
  DbUserBlocked = 'DB_USER_BLOCKED',
  DbUserUnblocked = 'DB_USER_UNBLOCKED',
  DbUsersFindAll = 'DB_USERS_FIND_ALL',
  DbUsersFindAllFiltered = 'DB_USERS_GET_ALL_WITH_ORDERS',
  DbOrderFind = 'DB_ORDER_FIND',
  DbOrderCreated = 'DB_ORDER_CREATED',
  DbOrderUpdated = 'DB_ORDER_UPDATED',
  DbOrderDeleted = 'DB_ORDER_DELETED',
  DbOrdersDeletedAll = 'DB_ORDERS_DELETED_ALL',
  DbOrdersFindAll = 'DB_ORDERS_GET_ALL',
  DbOrdersFindAllFiltered = 'DB_ORDERS_GET_ALL_FILTERED',
  DbOrderAuditCreated = 'DB_ORDER_AUDIT_CREATED',

  TgBotStart = 'TG_BOT_START',
  TgMessageSent = 'TG_MESSAGE_SENT',
  TgOrdersSent = 'TG_ORDERS_SENT',
  TgStatusSent = 'TG_STATUS_SENT',
  TgUnsubscribeSent = 'TG_UNSUBSCRIBE_SENT',
  TgAdminMessageSent = 'TG_ADMIN_MESSAGE_SENT',
  TgShowOrder = 'TG_SHOW_ORDER',
  TgShowUser = 'TG_SHOW_USER',

  TgUserStart = 'TG_USER_START',
  TgUserSupport = 'TG_USER_SUPPORT',
  TgUserUnsubscribed = 'TG_USER_UNSUBSCRIBED',
  TgUserSubscribed = 'TG_USER_SUBSCRIBED',
  TgUserSubscribedAlready = 'TG_USER_SUBSCRIBED_ALREADY',
  TgUserOrderStatus = 'TG_USER_ORDER_STATUS',
  TgUserFaqBase = 'TG_USER_FAQ_BASE',
  TgUserFaqStatuses = 'TG_USER_FAQ_STATUSES',
  TgUserSchedule = 'TG_USER_SCHEDULE',
  TgUserContacts = 'TG_USER_CONTACTS',

  AutoupdateStart = 'AUTOUPDATE_START',
  AutoupdateOrderChanged = 'AUTOUPDATE_ORDER_CHANGED',
  AutoupdateOrderWithoutChanges = 'AUTOUPDATE_ORDER_WITHOUT_CHANGES',
  AutoupdateEnd = 'AUTOUPDATE_END',
}

export enum AdminCommands {
  User = 'user',
  Order = 'order',
  Audit = 'audit',
  Send = 'send',
  Block = 'block',
  Unblock = 'unblock',
  Test = 'test',
}

export const AdminCommandsDescription = {
  [AdminCommands.User]: 'Показать пользователя [id, @username]',
  [AdminCommands.Order]: 'Показать заявление [uid]',
  [AdminCommands.Audit]: 'Показать логи заявления [uid]',
  [AdminCommands.Send]: 'Отправить сообщение пользователю [id, @username]',
  [AdminCommands.Block]: 'Заблокировать пользователя [id, @username]',
  [AdminCommands.Unblock]: 'Разблокировать пользователя [id, @username]',
  [AdminCommands.Test]: 'AdminCommands.Test',
};

export enum TextCommands {
  Admin = '/admin',
  Admin1 = '/админ',

  Unsubscribe = 'отписаться',
  Status = 'статус',
  StatusUpdate = 'обновить',
}

export enum BotCommands {
  Start = 'start',
  Support = 'support',
  FaqBase = 'faq',
  FaqStatuses = 'faq_statuses',
  Schedule = 'schedule',
  Contacts = 'contacts',
  OrdersList = 'orders_list',
}
