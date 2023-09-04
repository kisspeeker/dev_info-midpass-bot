import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { LogsTypes } from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';
import { User } from 'src/users/entity/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { AppResponseService } from 'src/app-response/app-response.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: LoggerService,
    private readonly appResponseService: AppResponseService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const newUser = this.usersRepository.create({
        id: String(createUserDto.id),
        firstName: createUserDto.first_name,
        lastName: createUserDto.last_name,
        userName: createUserDto.username ? `@${createUserDto.username}` : '',
        orders: [],
      });

      await this.usersRepository.save(newUser);
      return await this.appResponseService.success(
        LogsTypes.DbUserCreated,
        newUser.id,
        newUser,
      );
    } catch (e) {
      return await this.appResponseService.error<User>(
        LogsTypes.ErrorUserCreate,
        e,
        null,
        {
          id: String(createUserDto.id),
        },
      );
    }
  }

  async findAll() {
    try {
      const users = await this.usersRepository.find({ relations: ['orders'] });
      return await this.appResponseService.success(
        LogsTypes.DbUsersGetAll,
        String(users.length),
        users,
      );
    } catch (e) {
      return await this.appResponseService.error<User[]>(
        LogsTypes.ErrorUsersFindAll,
        e,
      );
    }
  }

  async findAllWithOrders() {
    try {
      const queryBuilder: SelectQueryBuilder<User> =
        this.usersRepository.createQueryBuilder('user');

      queryBuilder.innerJoinAndSelect('user.orders', 'order');
      queryBuilder.groupBy('user.id');
      queryBuilder.having('COUNT(order.uid) > 0');
      const users = await queryBuilder.getMany();

      return await this.appResponseService.success(
        LogsTypes.DbUsersGetAllWithOrders,
        String(users.length),
        users,
      );
    } catch (e) {
      return await this.appResponseService.error<User[]>(
        LogsTypes.ErrorUsersFindWithOrders,
        e,
      );
    }
  }

  async find(createUserDto: CreateUserDto) {
    try {
      let user = await this.usersRepository.findOne({
        where: { id: String(createUserDto.id) },
        relations: ['orders'],
      });

      if (!user) {
        this.appResponseService.error(
          LogsTypes.ErrorUserNotFound,
          String(createUserDto.id),
        );
        const newUserResponse = await this.create(createUserDto);
        if (newUserResponse.success === false) {
          throw newUserResponse;
        }
        user = (await this.create(createUserDto)).data;
      }

      return this.appResponseService.success(
        LogsTypes.DbUserGet,
        user.id,
        user,
      );
    } catch (e) {
      return await this.appResponseService.error<User>(
        LogsTypes.ErrorUserFind,
        e,
      );
    }
  }
}
