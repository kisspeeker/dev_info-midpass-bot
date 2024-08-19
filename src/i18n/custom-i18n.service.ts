import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Language } from 'src/i18n/enums/language';

@Injectable()
export class CustomI18nService {
  constructor(private readonly i18n: I18nService) {}

  t(key: string, params?: Record<string, unknown>, lang = Language.RU) {
    const res = this.i18n.t(key, {
      args: params,
      lang,
    });

    return Array.isArray(res) ? String(res.join('')) : String(res);
  }

  tExist(messageKey: string, ...args) {
    const message = this.t(messageKey, ...args);
    return message !== messageKey ? message : this.t('admin.fallback', ...args);
  }
}
