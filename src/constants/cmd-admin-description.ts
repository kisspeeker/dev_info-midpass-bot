import { CmdAdmin } from 'src/enums/cmd/cmd-admin';

export const CmdAdminDescription = {
  [CmdAdmin.User]: 'Показать пользователя [id, @username]',
  [CmdAdmin.Order]: 'Показать заявление [uid]',
  [CmdAdmin.Audit]: 'Показать логи заявления [uid]',
  [CmdAdmin.Send]: 'Отправить сообщение пользователю [id, @username]',
  [CmdAdmin.Block]: 'Заблокировать пользователя [id, @username]',
  [CmdAdmin.Unblock]: 'Разблокировать пользователя [id, @username]',
  [CmdAdmin.Test]: 'CmdAdmin.Test',
};
