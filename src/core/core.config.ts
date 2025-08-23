import { Injectable } from '@nestjs/common';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { configValidationUtility } from '../setup/config-validation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

@Injectable()
export class CoreConfig {
  @IsNotEmpty({
    message: 'Set Env variable HOST, example: localhost',
  })
  host!: string;

  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3000',
    },
  )
  dbPort!: number;

  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3000',
    },
  )
  port!: number;

  @IsNotEmpty({
    message: 'Set Env variable USER_NAME, example: postgres',
  })
  username!: string;

  @IsNotEmpty({
    message: 'Set Env variable USER_PASSWORD, example: 1111111',
  })
  userPassword!: string;

  @IsNotEmpty({
    message: 'Set Env variable DB_NAME, example: bloggers-platform',
  })
  database!: string;

  @IsEnum(Environments, {
    message:
      'Set correct NODE_ENV value, available values: ' +
      configValidationUtility.getEnumValues(Environments).join(', '),
  })
  env!: string;

  constructor(private configService: ConfigService<any, true>) {
    this.host = this.configService.get('HOST');
    this.dbPort = Number(this.configService.get('DB_PORT'));
    this.username = this.configService.get('USER_NAME');
    this.userPassword = this.configService.get('USER_PASSWORD');
    this.database = this.configService.get('DB_NAME');
    this.env = this.configService.get('NODE_ENV');

    this.port = Number(this.configService.get('PORT'));

    configValidationUtility.validateConfig(this);
  }
}
