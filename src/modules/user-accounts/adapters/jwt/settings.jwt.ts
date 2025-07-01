import { config } from 'dotenv';
import * as process from 'node:process';

config();

export const appConfig = {
  SECRET_ACCESS_TOKEN: process.env.SECRET_ACCESS_TOKEN as string,
  TIME_ACCESS_TOKEN: process.env.TIME_ACCESS_TOKEN as string,
  SECRET_REFRESH_TOKEN: process.env.SECRET_REFRESH_TOKEN as string,
  TIME_REFRESH_TOKEN: process.env.TIME_REFRESH_TOKEN as string,
};
