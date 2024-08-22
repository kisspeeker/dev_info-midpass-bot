import { UsersService } from 'src/users/users.service';

// TODO: UsersService тесты
describe('UsersService', () => {
  let service: UsersService;
  // let usersRepository: any;

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // beforeEach(async () => {
  //   usersRepository = {
  //     create: jest.fn().mockImplementation((u: User) => {
  //       const newUser = new User();
  //       for (const key of Object.keys(u)) {
  //         newUser[key] = u[key];
  //       }
  //       mockUsers.push(newUser);
  //       return newUser;
  //     }),
  //     save: jest.fn().mockImplementation((user: User) => user),
  //     findOne: jest
  //       .fn()
  //       .mockImplementation(({ where }) =>
  //         mockUsers.find((user) => user.id === where.id),
  //       ),
  //     find: jest.fn().mockImplementation(async () => {
  //       return mockUsers;
  //     }),
  //   };

  //   const module: TestingModule = await Test.createTestingModule({
  //     imports: [AppTestModule],
  //     providers: [
  //       UsersService,
  //       {
  //         provide: LoggerService,
  //         useValue: {},
  //       },
  //       {
  //         provide: getRepositoryToken(User),
  //         useValue: usersRepository,
  //       },
  //     ],
  //   }).compile();

  //   service = module.get<UsersService>(UsersService);
  // });
});
