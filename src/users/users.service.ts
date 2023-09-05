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
        { user: newUser },
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

  async find(createUserDto: CreateUserDto, createIfNotFound = false) {
    try {
      let user = await this.usersRepository.findOne({
        where: { id: String(createUserDto.id) },
        relations: ['orders'],
      });

      if (!user && createUserDto.username) {
        user = await this.usersRepository.findOne({
          where: { userName: createUserDto.username },
          relations: ['orders'],
        });
      }

      if (!user) {
        if (createIfNotFound) {
          const newUserResponse = await this.create(createUserDto);
          if (newUserResponse.success === false) {
            throw newUserResponse;
          }
          user = newUserResponse.data;
        } else {
          throw LogsTypes.ErrorUserNotFound;
        }
      }

      return this.appResponseService.success(
        LogsTypes.DbUserGet,
        user.id,
        user,
      );
    } catch (e) {
      return await this.appResponseService.error<User>(
        e,
        'error in users.service.find',
        null,
        { user: createUserDto },
      );
    }
  }

  async block(createUserDto: CreateUserDto) {
    try {
      const userResponse = await this.find(createUserDto);
      if (!userResponse.success) {
        throw LogsTypes.ErrorUserNotFound;
      }
      const user = userResponse.data;
      if (user.isAdmin) {
        throw LogsTypes.ErrorUserNotFound;
      }
      user.isBlocked = true;
      await this.usersRepository.save(user);
      return this.appResponseService.success(LogsTypes.DbUserBlocked, user.id, {
        user,
      });
    } catch (e) {
      return await this.appResponseService.error<User>(
        e,
        'error in users.service.block',
        null,
        { user: createUserDto },
      );
    }
  }

  async unblock(createUserDto: CreateUserDto) {
    try {
      const userResponse = await this.find(createUserDto);
      if (!userResponse.success) {
        throw LogsTypes.ErrorUserNotFound;
      }
      const user = userResponse.data;
      if (user.isAdmin) {
        throw LogsTypes.ErrorUserNotFound;
      }
      user.isBlocked = false;
      await this.usersRepository.save(user);
      return this.appResponseService.success(
        LogsTypes.DbUserUnblocked,
        user.id,
        { user },
      );
    } catch (e) {
      return await this.appResponseService.error<User>(
        e,
        'error in users.service.unblock',
        null,
        { user: createUserDto },
      );
    }
  }
}
