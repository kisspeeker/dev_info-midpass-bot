import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  AppTestModule,
  mockOrdersInvalidUids,
  mockOrders,
  mockUsers,
} from 'src/app-test.module';
import { LoggerService } from 'src/logger/logger.service';

import { OrdersService } from 'src/orders/orders.service';
import { Order } from './entity/order.entity';
import { OrderAuditLog } from './entity/order-audit-log.entity';
import { HttpService } from '@nestjs/axios';
import { FALSY_PASSPORT_STATUSES } from 'src/constants';
import { isValidDate } from 'src/utils';
import { ReadStream } from 'fs';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from 'src/users/entity/user.entity';

const mockPercents = [0, 5, 10, 99, 100];
const mockStatuses = [
  'Документы в обработке',
  'Документы приняты',
  'Паспорт готов к выдаче',
  'any',
];

const newOrderDto: CreateOrderDto = {
  uid: '3000381022023071000004998',
};

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: any;
  let ordersAuditLogRepository: any;

  beforeEach(async () => {
    ordersRepository = {
      create: jest.fn().mockImplementation((o: Order) => {
        const newOrder = new Order();
        for (const key of Object.keys(o)) {
          newOrder[key] = o[key];
        }
        mockOrders.push(newOrder);

        return newOrder;
      }),
      save: jest.fn().mockImplementation((order: Order) => order),
      findOne: jest
        .fn()
        .mockImplementation(({ where }) =>
          mockOrders.find((order) => order.uid === where.uid),
        ),
      findOneBy: jest
        .fn()
        .mockImplementation((filter) =>
          mockOrders.find((order) => order.uid === filter.uid),
        ),
      find: jest.fn().mockImplementation(async () => {
        return mockOrders;
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppTestModule],
      providers: [
        OrdersService,
        {
          provide: LoggerService,
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn().mockImplementation((url) => {
              console.warn(url);
            }),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: ordersRepository,
        },
        {
          provide: getRepositoryToken(OrderAuditLog),
          useValue: ordersAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('isValidUid -> orders uids should be correct', () => {
    for (const order of mockOrders) {
      expect(OrdersService.isValidUid(order.uid)).toBeTruthy();
    }

    mockOrdersInvalidUids.forEach((uid) => {
      expect(OrdersService.isValidUid(uid)).toBeFalsy();
    });
  });

  it('isValidUidShort -> orders short uids should be correct', () => {
    const invalidShortUids = ['1', '5555', 'undefined', '123456'];

    for (const order of mockOrders) {
      expect(
        OrdersService.isValidUidShort(
          OrdersService.parseShortUidFromUid(order.uid),
        ),
      ).toBeTruthy();
    }

    invalidShortUids.forEach((uid) => {
      expect(OrdersService.isValidUidShort(uid)).toBeFalsy();
    });
  });

  it('isCompleteOrder -> orders with 0 percents and falsy text status should be completed', () => {
    for (const order of JSON.parse(JSON.stringify(mockOrders))) {
      for (const status of FALSY_PASSPORT_STATUSES) {
        order.statusPercent = 0;
        order.statusInternalName = status;
        expect(OrdersService.isCompleteOrder(order)).toBeTruthy();
      }
    }
  });

  it('isCompleteOrder -> orders with any percents and any text status should not be completed', () => {
    for (const order of JSON.parse(JSON.stringify(mockOrders))) {
      for (const percent of mockPercents) {
        for (const status of mockStatuses) {
          order.statusPercent = percent;
          order.statusInternalName = status;
          expect(OrdersService.isCompleteOrder(order)).toBeFalsy();
        }
      }
    }
  });

  it('parseReceptionDateFromUid -> should return correct date', () => {
    for (const order of mockOrders) {
      expect(
        isValidDate(OrdersService.parseReceptionDateFromUid(order.uid)),
      ).toBeTruthy();
    }

    for (const uid of mockOrdersInvalidUids) {
      expect(
        isValidDate(OrdersService.parseReceptionDateFromUid(uid)),
      ).toBeFalsy();
    }
  });

  it('hasChangesWith -> should find changes correct', () => {
    for (const order of JSON.parse(JSON.stringify(mockOrders))) {
      order.statusPercent = 0;
      order.statusName = mockStatuses[0];
      const newOrder = JSON.parse(JSON.stringify(order));

      expect(OrdersService.hasChangesWith(order, newOrder)).toBeFalsy();
      newOrder.isDeleted = true;
      expect(OrdersService.hasChangesWith(order, newOrder)).toBeFalsy();
      newOrder.isDeleted = order.isDeleted;
      newOrder.userId = '123';
      expect(OrdersService.hasChangesWith(order, newOrder)).toBeFalsy();

      newOrder.statusPercent = 100;
      expect(OrdersService.hasChangesWith(order, newOrder)).toBeTruthy();
      newOrder.statusPercent = order.statusPercent;
      newOrder.statusName = mockStatuses[1];
      expect(OrdersService.hasChangesWith(order, newOrder)).toBeTruthy();
      newOrder.statusName = order.statusName;
      newOrder.statusInternalName = 'statusInternalName';
      expect(OrdersService.hasChangesWith(order, newOrder)).toBeTruthy();
    }
  });

  it('getStatusImage -> should return correct image', async () => {
    for (const order of JSON.parse(JSON.stringify(mockOrders))) {
      expect(await OrdersService.getStatusImage(order)).toBeInstanceOf(
        ReadStream,
      );
      order.statusPercent = 0;
      expect(
        (await OrdersService.getStatusImage(order)).path.includes('0.png'),
      ).toBeTruthy();
      order.statusPercent = 100;
      expect(
        (await OrdersService.getStatusImage(order)).path.includes('100.png'),
      ).toBeTruthy();
      order.statusPercent = 12345;
      expect(
        (await OrdersService.getStatusImage(order)).path.includes(
          'fallback.png',
        ),
      ).toBeTruthy();
    }
  });

  it('create new order', async () => {
    const res = await service.create(newOrderDto, mockUsers[1]);
    expect(res.data.uid).toEqual(newOrderDto.uid);
    console.warn(mockOrders);
  });

  // it('error find (without create)', async () => {
  //   const res = await service.find(unknownUserDto);
  //   expect(res).toEqual(
  //     await appResponseService.error<User>(
  //       LogsTypes.ErrorUserNotFound,
  //       'error in users.service.find',
  //       null,
  //       { user: unknownUserDto },
  //     ),
  //   );
  // });

  // it('find (with create)', async () => {
  //   const res = await service.find(unknownUserDto, true);
  //   expect(res.data.id).toEqual(unknownUserDto.id);
  // });

  // it('findAll', async () => {
  //   const res = await service.findAll();

  //   expect(res).toEqual(
  //     await appResponseService.success(
  //       LogsTypes.DbUsersFindAll,
  //       String(res.data.length),
  //       res.data,
  //     ),
  //   );
  // });

  // it('findAllFiltered', async () => {
  //   const res = await service.findAllFiltered();

  //   expect(res).toEqual(
  //     await appResponseService.success(
  //       LogsTypes.DbUsersFindAllFiltered,
  //       String(res.data.length),
  //       res.data,
  //     ),
  //   );
  // });
});
