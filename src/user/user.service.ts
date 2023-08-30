import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Context } from 'telegraf';

import { LogsTypes } from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';
import { User } from 'src/user/entity/user.entity';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: LoggerService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const newUser = this.usersRepository.create({
      id: String(createUserDto.id),
      firstName: createUserDto.first_name,
      lastName: createUserDto.last_name,
      userName: createUserDto.username ? `@${createUserDto.username}` : '',
      orders: [],
    });

    await this.usersRepository.save(newUser);

    return newUser;
  }

  async findAll() {
    return await this.usersRepository.find({ relations: ['orders'] });
  }

  async findAllWithOrders() {
    const queryBuilder: SelectQueryBuilder<User> =
      this.usersRepository.createQueryBuilder('user');

    queryBuilder.innerJoinAndSelect('user.orders', 'order');
    queryBuilder.groupBy('user.id');
    queryBuilder.having('COUNT(order.uid) > 0');

    return queryBuilder.getMany();
  }

  async find(ctx: Context) {
    let user = await this.usersRepository.findOne({
      where: { id: String(ctx.from.id) },
      relations: ['orders'],
    });

    if (!user) {
      this.logger.error(LogsTypes.ErrorUserNotFound, String(ctx.from.id));
      user = await this.create(ctx.from);
    }

    return user;
  }
}
