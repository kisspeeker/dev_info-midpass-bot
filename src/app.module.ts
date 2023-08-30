import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';

import { CustomI18nModule } from 'src//i18n/custom-i18n.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { LoggerModule } from 'src/logger/logger.module';
import { UsersModule } from 'src/users/users.module';
import { OrdersModule } from 'src/orders/orders.module';
import { User } from 'src/users/entity/user.entity';
import { Order } from 'src/orders/entity/order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Путь к каталогу public
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
      database: 'info-midpass-bot.db',
      entities: [User, Order],
      synchronize: true,
    }),
    TelegramModule,
    UsersModule,
    OrdersModule,
    LoggerModule,
    CustomI18nModule,
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
