import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LogsTypes } from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';
import { User } from 'src/users/entity/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { AppResponseService } from 'src/app-response/app-response.service';
import { OrdersService } from 'src/orders/orders.service';

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
      return this.usersRepository.save(
        this.usersRepository.create({
          id: String(createUserDto.id),
          firstName: createUserDto.first_name,
          lastName: createUserDto.last_name,
          userName: createUserDto.username ? `@${createUserDto.username}` : '',
          orders: [],
        }),
      );
    } catch (e) {
      throw e;
    }
  }

  async find(createUserDto: CreateUserDto) {
    try {
      return await this.usersRepository.findOne({
        where: [
          { id: String(createUserDto.id) },
          { userName: createUserDto.username },
        ],
        relations: ['orders'],
      });
    } catch (e) {
      throw e;
    }
  }

  async findAll() {
    try {
      return await this.usersRepository.find({ relations: ['orders'] });
    } catch (e) {
      throw e;
    }
  }

  async findAllFiltered() {
    try {
      const usersAll = await this.findAll();

      return usersAll.filter((user) => {
        return (
          !!user.filteredOrders.length &&
          user.filteredOrders.every(
            (order) => !OrdersService.isCompleteOrder(order),
          )
        );
      });
    } catch (e) {
      throw e;
    }
  }

  async block(createUserDto: CreateUserDto) {
    try {
      const user = await this.find(createUserDto);

      if (user.isOwner) {
        throw LogsTypes.ErrorUserNotFound;
      }

      user.isBlocked = true;
      return this.usersRepository.save(user);
    } catch (e) {
      throw e;
    }
  }

  async unblock(createUserDto: CreateUserDto) {
    try {
      const user = await this.find(createUserDto);

      if (user.isOwner) {
        throw LogsTypes.ErrorUserNotFound;
      }

      user.isBlocked = false;
      return this.usersRepository.save(user);
    } catch (e) {
      throw e;
    }
  }
}
