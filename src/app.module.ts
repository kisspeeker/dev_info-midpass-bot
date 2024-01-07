import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { DataSource } from 'typeorm';

import { CustomI18nModule } from 'src//i18n/custom-i18n.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { LoggerModule } from 'src/logger/logger.module';
import { UsersModule } from 'src/users/users.module';
import { OrdersModule } from 'src/orders/orders.module';
import { User } from 'src/users/entity/user.entity';
import { Order } from 'src/orders/entity/order.entity';
import { OrderAuditLog } from 'src/orders/entity/order-audit-log.entity';
import { KeyboardModule } from 'src/keyboard/keyboard.module';
import { MessageModule } from 'src/message/message.module';
import { BotModule } from 'src/bot/bot.module';
import { AutoupdateModule } from 'src/autoupdate/autoupdate.module';
import { AppResponseModule } from 'src/app-response/app-response.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'ru',
      loaderOptions: {
        path: join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'midpass.db',
      entities: [User, Order, OrderAuditLog],
      synchronize: true,
    }),
    TelegramModule,
    UsersModule,
    OrdersModule,
    LoggerModule,
    CustomI18nModule,
    ScheduleModule.forRoot(),
    KeyboardModule,
    MessageModule,
    BotModule,
    AutoupdateModule,
    AppResponseModule,
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
