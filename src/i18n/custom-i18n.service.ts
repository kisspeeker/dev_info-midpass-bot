import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class CustomI18nService {
  constructor(private readonly i18n: I18nService) {}

  t(key: string, params?: Record<string, unknown>, lang = 'ru') {
    const res = this.i18n.t(key, {
      args: params,
      lang,
    });

    if (Array.isArray(res)) {
      return String(res.join(''));
    }
    return String(res);
  }

  tExist(messageKey: string, ...args) {
    const message = this.t(messageKey, ...args);
    return message !== messageKey ? message : this.t('admin.fallback', ...args);
  }
}
