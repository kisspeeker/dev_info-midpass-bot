import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppTestModule, mockUsers } from 'src/app-test.module';

import { UsersService } from 'src/users/users.service';
import { User } from './entity/user.entity';
import { LoggerService } from 'src/logger/logger.service';
import { AppResponseService } from 'src/app-response/app-response.service';
import { LogsTypes } from 'src/enums';

const newUserDto = {
  adminId: 'admin',
  id: 'newUser',
  username: 'new',
};

const unknownUserDto = {
  adminId: 'admin',
  id: 'unknown user',
  username: 'unknown',
};

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: any;
  let appResponseService: AppResponseService;

  beforeEach(async () => {
    usersRepository = {
      create: jest.fn().mockImplementation((u: User) => {
        const newUser = new User();
        for (const key of Object.keys(u)) {
          newUser[key] = u[key];
        }
        mockUsers.push(newUser);
        return newUser;
      }),
      save: jest.fn().mockImplementation((user: User) => user),
      findOne: jest
        .fn()
        .mockImplementation(({ where }) =>
          mockUsers.find((user) => user.id === where.id),
        ),
      find: jest.fn().mockImplementation(async () => {
        return mockUsers;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppTestModule],
      providers: [
        UsersService,
        {
          provide: LoggerService,
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    appResponseService = module.get<AppResponseService>(AppResponseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create', async () => {
    const res = await service.create(newUserDto);
    expect(res.data.id).toEqual(newUserDto.id);
  });

  it('error find (without create)', async () => {
    const res = await service.find(unknownUserDto);
    expect(res).toEqual(
      await appResponseService.error<User>(
        LogsTypes.ErrorUserNotFound,
        'error in users.service.find',
        null,
        { user: unknownUserDto },
      ),
    );
  });

  it('find (with create)', async () => {
    const res = await service.find(unknownUserDto, true);
    expect(res.data.id).toEqual(unknownUserDto.id);
  });

  it('findAll', async () => {
    const res = await service.findAll();

    expect(res).toEqual(
      await appResponseService.success(
        LogsTypes.DbUsersFindAll,
        String(res.data.length),
        res.data,
      ),
    );
  });

  it('findAllFiltered', async () => {
    const res = await service.findAllFiltered();

    expect(res).toEqual(
      await appResponseService.success(
        LogsTypes.DbUsersFindAllFiltered,
        String(res.data.length),
        res.data,
      ),
    );
  });

  it('block', async () => {
    await service.block(unknownUserDto);
    const user = mockUsers.find((user) => user.id === unknownUserDto.id);
    console.warn(user);

    expect(user.isBlocked).toEqual(true);
  });

  it('error block admin', async () => {
    const res = await service.block(mockUsers[0]);

    expect(res).toEqual(
      await appResponseService.error(
        LogsTypes.ErrorUserNotFound,
        'error in users.service.block',
        null,
      ),
    );
  });

  it('unblock', async () => {
    await service.unblock(unknownUserDto);
    const user = mockUsers.find((user) => user.id === unknownUserDto.id);
    console.warn(user);

    expect(user.isBlocked).toEqual(false);
  });

  it('error unblock admin', async () => {
    const res = await service.unblock(mockUsers[0]);

    expect(res).toEqual(
      await appResponseService.error(
        LogsTypes.ErrorUserNotFound,
        'error in users.service.unblock',
        null,
      ),
    );
  });
});
