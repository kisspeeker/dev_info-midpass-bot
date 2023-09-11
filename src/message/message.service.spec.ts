import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import {
  AppTestModule,
  mockOrders,
  mockResponseBlockByUser,
  mockUsers,
} from 'src/app-test.module';
import { OrdersService } from 'src/orders/orders.service';
import { AppResponseService } from 'src/app-response/app-response.service';
import { LogsTypes } from 'src/enums';

describe('MessageService', () => {
  let service: MessageService;
  let appResponseService: AppResponseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppTestModule],
      providers: [
        MessageService,
        {
          provide: OrdersService,
          useValue: {
            deleteAll: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
    appResponseService = module.get<AppResponseService>(AppResponseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('checkBlockedUser', async () => {
    const blockResponse = {
      response: {
        error_code: 403,
      },
      on: {
        payload: {
          chat_id: '1',
        },
      },
    };
    expect(await service.checkBlockedUser({}, mockUsers[0])).toBeFalsy();
    expect(
      await service.checkBlockedUser(blockResponse, mockUsers[1]),
    ).toBeTruthy();
  });

  it('sendMessage', async () => {
    for (const user of mockUsers) {
      const res = expect(await service.sendMessage(user, 'mockMessage'));

      if (user.id === '403') {
        res.toEqual(
          await appResponseService.error(
            LogsTypes.ErrorBlockByUser,
            mockResponseBlockByUser,
            {
              user,
            },
          ),
        );
      } else {
        res.toEqual(
          await appResponseService.success(
            LogsTypes.TgMessageSent,
            'mockMessage',
            { user },
          ),
        );
      }
    }
  });

  it('sendMessageInlineOrders', async () => {
    for (const user of mockUsers) {
      const res = expect(await service.sendMessageInlineOrders(user));

      if (user.id === '403') {
        res.toEqual(
          await appResponseService.error(
            LogsTypes.ErrorBlockByUser,
            mockResponseBlockByUser,
            {
              user,
            },
          ),
        );
      } else {
        res.toEqual(
          await appResponseService.success(LogsTypes.TgOrdersSent, user.id),
        );
      }
    }
  });

  it('sendMessageInlineUnsubscribe', async () => {
    for (const user of mockUsers) {
      const res = expect(await service.sendMessageInlineUnsubscribe(user));

      if (user.id === '403') {
        res.toEqual(
          await appResponseService.error(
            LogsTypes.ErrorBlockByUser,
            mockResponseBlockByUser,
            {
              user,
            },
          ),
        );
      } else {
        res.toEqual(
          await appResponseService.success(
            LogsTypes.TgUnsubscribeSent,
            user.id,
          ),
        );
      }
    }
  });

  it('sendMessageStatus', async () => {
    for (const user of mockUsers) {
      for (const order of user.orders) {
        const res = expect(await service.sendMessageStatus(user, order));

        if (user.id === '403') {
          res.toEqual(
            await appResponseService.error(
              LogsTypes.ErrorBlockByUser,
              mockResponseBlockByUser,
              {
                user,
              },
            ),
          );
        } else {
          res.toEqual(
            await appResponseService.success(LogsTypes.TgStatusSent, user.id),
          );
        }
      }
    }
  });

  it('getMessageStatus', () => {
    for (const order of mockOrders) {
      expect(service.getMessageStatus(order)).toBe(
        'Mocked Translation for user.message_status_order_beauty',
      );
    }
  });
});
