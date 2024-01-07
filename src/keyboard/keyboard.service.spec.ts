import { Test, TestingModule } from '@nestjs/testing';
import { KeyboardService } from './keyboard.service';
import { mockUsers } from 'src/app-test.module';
import {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
} from 'telegraf/typings/core/types/typegram';
import { equal } from 'assert';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';

describe('KeyboardService', () => {
  let service: KeyboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyboardService,
        {
          provide: CustomI18nService,
          useValue: {
            t: jest.fn(),
            tExist: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KeyboardService>(KeyboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('useKeyboardDefault correct number of buttons', () => {
    mockUsers.forEach((user) => {
      const buttonsCount = (
        service.useKeyboardDefault(user).reply_markup as ReplyKeyboardMarkup
      )?.keyboard?.length;

      if (user.filteredOrders.length) {
        equal(buttonsCount, user.filteredOrders.length + 1);
      } else {
        equal(buttonsCount, undefined);
      }
    });
  });

  it('useKeyboardInlineOrders correct number of inline orders buttons', () => {
    mockUsers.forEach((user) => {
      const buttonsCount = (
        service.useKeyboardInlineOrders(user)
          .reply_markup as InlineKeyboardMarkup
      )?.inline_keyboard?.length;

      if (user.filteredOrders.length) {
        equal(buttonsCount, user.filteredOrders.length);
      } else {
        equal(buttonsCount, undefined);
      }
    });
  });

  it('useKeyboardInlineUnsubscribe correct number of inline buttons', () => {
    mockUsers.forEach((user) => {
      const buttonsCount = (
        service.useKeyboardInlineUnsubscribe(user)
          .reply_markup as InlineKeyboardMarkup
      )?.inline_keyboard?.length;

      if (user.filteredOrders.length) {
        equal(buttonsCount, user.filteredOrders.length);
      }
    });
  });
});
