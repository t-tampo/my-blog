import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlModuleOptions } from '@nestjs/graphql';
import { PrismaClientOptions } from '@prisma/client/runtime';
import * as path from 'path';
import { LoggingWinston } from '@google-cloud/logging-winston';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModuleOptions,
} from 'nest-winston';
import winston from 'winston';

/**
 * アプリケーションモジュールで利用する設定値は、ここから取得します。
 */
@Injectable()
export class PbEnv {
  constructor(private configService: ConfigService) {}

  get isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }

  get GqlModuleOptionsFactory(): GqlModuleOptions {
    // 開発：コードからスキーマを生成し、Playgroundも利用する。
    // バックエンドのコードが正なのでコードファーストアプローチを使う
    const devOptions: GqlModuleOptions = {
      autoSchemaFile: path.join(
        process.cwd(),
        'src/generated/graphql/schema.gql',
      ),
      sortSchema: true,
      debug: true,
      playground: true,
    };

    // 本番環境：実行だけ
    const prdOptions: GqlModuleOptions = {
      autoSchemaFile: true,
      debug: false,
      playground: false,
    };
    if (this.isProduction) {
      return prdOptions;
    } else {
      return devOptions;
    }
  }

  /**
   * 参考程度に。ローカルと本番のログ設定を行っています。
   */
  get PrismaOptionsFactory(): PrismaClientOptions {
    const logOptions = {
      development: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      production: [{ emit: 'event', level: 'warn' }],
      test: [
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    };
    return {
      errorFormat: 'colorless',
      rejectOnNotFound: true,
      log: logOptions[this.NodeEnv],
    };
  }

  get WinstonModuleOptionsFactory(): WinstonModuleOptions {
    const loggingConsole = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.errors({ stack: true }),
        nestWinstonModuleUtilities.format.nestLike('PB_BACKEND', {
          prettyPrint: true,
        }),
      ),
    });
    const loggingCloudLogging = new LoggingWinston({
      serviceContext: {
        service: 'pb-backend',
        version: '1.0.0',
      },
    });
    return {
      level: this.isProduction ? 'info' : 'debug',
      transports: this.isProduction
        ? [loggingConsole, loggingCloudLogging]
        : [loggingConsole],
    };
  }

  get service() {
    return this.configService;
  }

  get NodeEnv(): string {
    return this.configService.get('NODE_ENV');
  }

  get Port(): number {
    return this.configService.get('PORT');
  }

  get DatabaseUrl(): string {
    return this.configService.get('DATABASE_URL');
  }
}
