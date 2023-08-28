export enum Timeouts {
  Start = 1000 * 2,
  Text = 1000 * 2,
  CronjobNextUserCode = 1000 * 10,
  CronjobNextUser = 1000 * 10,
  GerUsers = 100,
}

export enum LogsTypes {
  Error = 'ERROR',
  ErrorCronjobRoot = 'ERROR_CRONJOB_ROOT',
  ErrorCronjobUserCode = 'ERROR_CRONJOB_USER_CODE',
  ErrorBlockByUser = 'ERROR_BLOCK_BY_USER',
  UserHasMaxCountCodes = 'USER_HAS_MAX_COUNT_CODES',
  SuccessStart = 'SUCCESS_START',
  StartCronjob = 'START_CRONJOB',
  EndCronjob = 'END_CRONJOB',
  AutoupdateWithoutChanges = 'AUTOUPDATE_WITHOUT_CHANGES',
  AutoupdateWithChanges = 'AUTOUPDATE_WITH_CHANGES',
  SubscribeEnable = 'SUBSCRIBE_ENABLE',
  SubscribeEnableAlready = 'SUBSCRIBE_ENABLE_ALREADY',
  UnsubscribeEnable = 'UNSUBSCRIBE_ENABLE',
  SuccessCodeStatus = 'SUCCESS_CODE_STATUS',
  ShowSchedule = 'SHOW_SCHEDULE',
  ShowFAQ = 'SHOW_FAQ',
  Message = 'MESSAGE',
  BotStart = 'BOT_START',
}

export enum MetaKeys {
  Code = 'CODE',
  CodeUid = 'CODE_UID',
  CounterUsersWithCodes = 'COUNTER_USERS_WITH_CODES',
  CounterUsersChecked = 'COUNTER_USERS_CHECKED',
  CounterCodes = 'COUNTER_CODES',
  CounterCodesUpdated = 'COUNTER_CODES_UPDATED',
  CounterCodesError = 'COUNTER_CODES_ERROR',
  CounterRoutes = 'COUNTER_ROUTES',
  CronjobDuration = 'CRONJOB_DURATION',
}
