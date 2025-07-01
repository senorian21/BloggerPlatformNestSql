// src/types/express.d.ts
import { IdType } from './bearer-auth.guard'; // Укажите правильный путь к IdType

declare global {
  namespace Express {
    interface Request {
      user?: IdType; // Добавляем поле user
    }
  }
}
