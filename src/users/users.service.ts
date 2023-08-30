import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { LogsTypes } from 'src/enums';
import { LoggerService } from 'src/logger/logger.service';
import { User } from 'src/users/entity/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

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
    this.logger.log(LogsTypes.DbUserCreated, newUser.id, newUser);

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

  async find(createUserDto: CreateUserDto) {
    let user = await this.usersRepository.findOne({
      where: { id: String(createUserDto.id) },
      relations: ['orders'],
    });

    if (!user) {
      this.logger.error(LogsTypes.ErrorUserNotFound, String(createUserDto.id));
      user = await this.create(createUserDto);
    }

    return user;
  }
}
