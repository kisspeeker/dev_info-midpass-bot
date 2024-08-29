import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LoggerService } from 'src/logger/logger.service';
import { User } from 'src/users/entity/user.entity';
import { TelegramUser } from 'src/types/telegram-user';
import { filterByActiveOrder, filterUser, filterOrderRelations } from 'src/constants/filters';
import { parseTelegramUser } from 'src/users/parsers/parse-telegram-user';

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
      const user = this.usersRepository.create(parseTelegramUser(telegramUser));
      
      return this.usersRepository.save(user);
    } catch (err) {
      throw err;
    }
  }

  async find({ telegramUser,isOwner = false }: {
    telegramUser: TelegramUser;
    isOwner?: User['isOwner'];
  }) {
    try {
      return await this.usersRepository.findOne({
        where: filterUser({ telegramUser, isOwner }),
        relations: filterOrderRelations(),
      });
    } catch (err) {
      throw err;
    }
  }

  async findAll() {
    try {
      return this.usersRepository.find({
        relations: filterOrderRelations(),
      });
    } catch (err) {
      throw err;
    }
  }

  async findAllFiltered() {
    try {
      return this.usersRepository.find({
        where: filterByActiveOrder(),
        relations: filterOrderRelations(),
      });
    } catch (err) {
      throw err;
    }
  }

  async block(telegramUser: TelegramUser) {
    try {
      const user = await this.find({ telegramUser });

      user.isBlocked = true;
      
      return this.usersRepository.save(user);
    } catch (err) {
      throw err;
    }
  }

  async unblock(telegramUser: TelegramUser) {
    try {
      const user = await this.find({ telegramUser });

      user.isBlocked = false;
      
      return this.usersRepository.save(user);
    } catch (err) {
      throw err;
    }
  }
}
