// src/types/express.d.ts
import { IdType } from './bearer-auth.guard';
import { RefreshTokenContextDto } from '../src/modules/user-accounts/auth/dto/refreshToken.dto'; // Укажите правильный путь к IdType

declare global {
  namespace Express {
    interface Request {
      user?: IdType | RefreshTokenContextDto; // Добавляем поле user
    }
  }
}
