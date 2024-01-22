import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppTestModule, mockUsers } from 'src/app-test.module';

import { UsersService } from 'src/users/users.service';
import { User } from './entity/user.entity';
import { LoggerService } from 'src/logger/logger.service';

// const newUserDto = {
//   ownerId: 'ownerId',
//   id: 'newUser',
//   username: 'new',
// };

// const unknownUserDto = {
//   ownerId: 'ownerId',
//   id: 'unknown user',
//   username: 'unknown',
// };

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: any;

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
