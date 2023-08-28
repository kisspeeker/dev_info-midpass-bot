import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TelegramModule } from './telegram/telegram.module';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { LoggerModule } from './logger/logger.module';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { CustomI18nModule } from './i18n/custom-i18n.module';

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
    TelegramModule,
    UserModule,
    OrderModule,
    LoggerModule,
    CustomI18nModule,
  ],
})
export class AppModule {}
