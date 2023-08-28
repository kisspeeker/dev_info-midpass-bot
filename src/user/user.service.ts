import { Injectable } from '@nestjs/common';
import { User } from './user.interface';
import { LoggerService } from 'src/logger/logger.service';
import { Context } from 'telegraf';
import { LogsTypes } from 'src/enums';

@Injectable()
export class UserService {
  private users: User[] = [];

  constructor(private readonly logger: LoggerService) {}

  static useFactory(raw: User | unknown): User {
    if (typeof raw !== 'object' || raw === null) {
      throw new Error('Invalid rawOrder type');
    }

    const currentUser = raw as Partial<User>;

    return {
      id: String(currentUser.id),
      firstName: currentUser.first_name || currentUser.firstName,
      lastName: currentUser.last_name || currentUser.lastName,
      userName:
        currentUser.userName ||
        (currentUser.username ? `@${currentUser.username}` : ''),
      orders: Array.isArray(currentUser.orders) ? currentUser.orders : [],
    };
  }

  findUserById(id = '') {
    return this.users.find((user: User) => user.id === id);
  }

  findUserIndexById(id = '') {
    return this.users.findIndex((user: User) => user.id === id);
  }

  createUser(ctx: Context) {
    const newUser = UserService.useFactory(ctx.from);
    this.users.push(newUser);
    return newUser;
  }

  updateUser(user: User) {
    const userIndex = this.findUserIndexById(user.id);
    if (userIndex >= 0) {
      this.users[userIndex] = UserService.useFactory(user);
      return this.users[userIndex];
    }
    // TODO: user is not defined
    this.logger.log(LogsTypes.Error, 'user is not defined', user);
  }
}
