import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LoggerService } from 'src/logger/logger.service';
import { User } from 'src/users/entity/user.entity';
import { TelegramUser } from 'src/types/telegram-user';
import { getFilterUserByOrder } from 'src/users/constants/filter-users-by-order';
import { getFilterFindUser } from 'src/users/constants/filter-find-user';
import { getFilterRelations } from 'src/users/constants/filter-relations';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    // TODO: добавить вывод логов
    private readonly logger: LoggerService,
  ) {}

  async create(telegramUser: TelegramUser) {
    try {
      const user = this.usersRepository.create(new User(telegramUser));
      return this.usersRepository.save(user);
    } catch (e) {
      throw e;
    }
  }

  async find(telegramUser: TelegramUser, isOwner?: User['isOwner']) {
    try {
      return await this.usersRepository.findOne({
        where: getFilterFindUser(telegramUser, isOwner),
        relations: getFilterRelations(),
      });
    } catch (e) {
      throw e;
    }
  }

  async findAll() {
    try {
      return this.usersRepository.find({
        relations: getFilterRelations(),
      });
    } catch (e) {
      throw e;
    }
  }

  async findAllFiltered() {
    try {
      return this.usersRepository.find({
        where: getFilterUserByOrder(),
        relations: getFilterRelations(),
      });
    } catch (e) {
      throw e;
    }
  }

  async block(telegramUser: TelegramUser) {
    try {
      const user = await this.find(telegramUser);

      user.isBlocked = true;
      return this.usersRepository.save(user);
    } catch (e) {
      throw e;
    }
  }

  async unblock(telegramUser: TelegramUser) {
    try {
      const user = await this.find(telegramUser);

      user.isBlocked = false;
      return this.usersRepository.save(user);
    } catch (e) {
      throw e;
    }
  }
}
