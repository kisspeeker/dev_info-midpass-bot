import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { LogsTypes } from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';
import { User } from 'src/users/entity/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import {
  AppResponse,
  AppResponseService,
} from 'src/app-response/app-response.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: LoggerService,
    private readonly appResponseService: AppResponseService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<AppResponse<User | unknown>> {
    try {
      const newUser = this.usersRepository.create({
        id: String(createUserDto.id),
        firstName: createUserDto.first_name,
        lastName: createUserDto.last_name,
        userName: createUserDto.username ? `@${createUserDto.username}` : '',
        orders: [],
      });

      await this.usersRepository.save(newUser);
      this.logger.log(LogsTypes.DbUserCreated, newUser.id, newUser);

      return this.appResponseService.success(newUser);
    } catch (e) {
      return this.appResponseService.error(LogsTypes.ErrorUserCreate, e, {
        id: createUserDto.id,
      });
    }
  }

  async findAll() {
    try {
      return this.appResponseService.success(
        await this.usersRepository.find({ relations: ['orders'] }),
      );
    } catch (e) {
      return this.appResponseService.error(LogsTypes.ErrorUsersFindAll, e);
    }
  }

  async findAllWithOrders() {
    try {
      const queryBuilder: SelectQueryBuilder<User> =
        this.usersRepository.createQueryBuilder('user');

      queryBuilder.innerJoinAndSelect('user.orders', 'order');
      queryBuilder.groupBy('user.id');
      queryBuilder.having('COUNT(order.uid) > 0');

      return this.appResponseService.success(await queryBuilder.getMany());
    } catch (e) {
      return this.appResponseService.error(
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
        if (!newUserResponse.success) {
          throw newUserResponse.error;
        }
        user = (await this.create(createUserDto)).data as User;
      }

      return this.appResponseService.success(user);
    } catch (e) {
      return this.appResponseService.error(LogsTypes.ErrorUserFind, e);
    }
  }
}
