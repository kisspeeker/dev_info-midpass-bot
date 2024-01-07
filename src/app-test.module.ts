import { Module } from '@nestjs/common';
import { CustomI18nService } from 'src/i18n/custom-i18n.service';
import { User } from './users/entity/user.entity';
import { Order } from './orders/entity/order.entity';
import { BotService } from './bot/bot.service';
import { AppResponseService } from './app-response/app-response.service';
import { LogsTypes } from './enums';
import { KeyboardService } from './keyboard/keyboard.service';

const mockUsersPart = [
  {
    adminId: 'admin',
    id: 'admin',
    userName: 'admin',
  },
  {
    adminId: 'admin',
    id: '1',
    firstName: 'user',
    isBlocked: false,
  },
  {
    adminId: 'admin',
    id: '2',
    firstName: 'blocked user',
    isBlocked: true,
  },
  {
    adminId: 'admin',
    id: '403',
    firstName: '403 blocked by user',
  },
];

const mockOrdersPart = [
  {
    userId: 'admin',
    uid: '2000971012023061500000000',
  },
  {
    userId: '1',
    uid: '2000381012023090500007421',
    isDeleted: true,
  },
  {
    userId: '1',
    uid: '2000381022023071000004999',
  },
  {
    userId: '403',
    uid: '2000374022023100500011051',
  },
];

export const mockOrdersInvalidUids = [
  '42',
  '0000011111222223333344444',
  'undefined',
  '1234112345123451234512345',
  '2000112345123451234512345',
  '2000374020000090500011041',
  '2000381011111132700006787',
  '2000374019999075500036252',
];

export const mockResponseBlockByUser = {
  response: {
    error_code: 403,
  },
  on: {
    payload: {
      chat_id: '403',
    },
  },
};

export const mockOrders = mockOrdersPart.map((mock) => {
  const order = new Order();
  Object.keys(mock).forEach((key) => {
    order[key] = mock[key];
  });
  return order;
});

export const mockUsers = mockUsersPart.map((mock) => {
  const user = new User();
  Object.keys(mock).forEach((key) => {
    user[key] = mock[key];
  });
  user.orders = mockOrders.filter((order) => order.userId === user.id);
  return user;
});

@Module({
  providers: [
    {
      provide: BotService,
      useValue: {
        notify: jest.fn(),
        bot: {
          telegram: {
            sendMessage: jest.fn().mockImplementation((userId: string) => {
              if (userId === '403') {
                throw mockResponseBlockByUser;
              }
              return Promise.resolve();
            }),
            sendPhoto: jest.fn().mockImplementation((userId: string) => {
              if (userId === '403') {
                throw mockResponseBlockByUser;
              }
              return Promise.resolve();
            }),
          },
        },
      },
    },
    {
      provide: KeyboardService,
      useValue: {
        useKeyboardDefault: jest.fn().mockReturnValue([]),
        useKeyboardInlineOrders: jest.fn().mockReturnValue([]),
        useKeyboardInlineUnsubscribe: jest.fn().mockReturnValue([]),
      },
    },
    {
      provide: AppResponseService,
      useValue: {
        success: jest
          .fn()
          .mockImplementation(
            (type: LogsTypes, message: string, data: unknown) => {
              return {
                success: true,
                data,
              };
            },
          ),
        error: jest
          .fn()
          .mockImplementation(
            (type: LogsTypes, message: string, data: unknown) => {
              return {
                success: false,
                error: type,
                message,
                data,
              };
            },
          ),
      },
    },
    {
      provide: CustomI18nService,
      useValue: {
        t: jest
          .fn()
          .mockImplementation((key) => `Mocked Translation for ${key}`),
        tExist: jest
          .fn()
          .mockImplementation((key) => `Mocked TranslationExist for ${key}`),
      },
    },
  ],
  exports: [BotService, KeyboardService, CustomI18nService, AppResponseService],
})
export class AppTestModule {}
