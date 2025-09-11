import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import path from 'path';

// Определяем имя env-файла
const envFile = process.env.ENV_FILE_PATH
    ? process.env.ENV_FILE_PATH
    : `.env.${process.env.NODE_ENV || 'development'}`;

// Загружаем переменные из нужного файла
config({ path: path.resolve(process.cwd(), envFile) });

export default new DataSource({
    type: 'postgres',
    host: process.env.HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.USER_NAME,
    password: process.env.USER_PASSWORD,
    database: process.env.DB_NAME,
    migrations: ['migrations/*.ts'],
    entities: ['src/**/*.entity.ts'],
});


