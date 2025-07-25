import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    @InjectDataSource()
    protected datasource: DataSource,
  ) {}
  async save(user: UserDocument): Promise<void> {
    await user.save();
  }
  async findById(userId: number): Promise<UserDocument> {
    const result = await this.datasource.query(
      `SELECT * FROM "User" WHERE id = $1`,
      [userId],
    );
    if (result.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User does not exist',
      });
    }

    const user = result[0];

    if (user.deletedAt != null) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `User with id ${userId} is already deleted`,
      });
    }
    return result;
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UserDocument | null> {
    const user = await this.UserModel.findOne({
      $or: [{ email: loginOrEmail }, { login: loginOrEmail }],
    });
    return user;
  }
  async findByCode(code: string): Promise<UserDocument | null> {
    const user = await this.UserModel.findOne({
      'emailConfirmation.confirmationCode': code,
    });
    return user;
  }

  async doesExistByLoginOrEmail(
    login: string,
    email: string,
  ): Promise<UserDocument | null> {
    const result = await this.datasource.query(
      `SELECT 
        id::TEXT AS "id",
        login,
        email,
        "passwordHash",
        "createdAt",
        "deletedAt"
     FROM "User" 
     WHERE (login = $1 OR email = $2) 
       AND "deletedAt" IS NULL
     LIMIT 1`,
      [login, email],
    );

    return result.length > 0 ? result[0] : null;
  }

  async createUser(dto: CreateUserDomainDto, hashedPassword: string) {
    const result = await this.datasource.query(
      `INSERT INTO "User" (login, email, "passwordHash")
         VALUES ($1, $2, $3)
           RETURNING id, login, email, "createdAt"`,
      [dto.login, dto.email, hashedPassword],
    );

    // Добавлена проверка на случай ошибки вставки
    if (result.length === 0) {
      throw new Error('Failed to create user');
    }

    const userId = result[0].id;
    const confirmationCode = randomUUID();
    const expirationDate = add(new Date(), { days: 7 });

    await this.datasource.query(
      `INSERT INTO "emailConfirmation" ("userId", "confirmationCode", "expirationDate")
         VALUES ($1, $2, $3)`,
      [userId, confirmationCode, expirationDate],
    );

    return userId;
  }

  async softDeleteUser(id: number): Promise<void> {
    const deleteAt = new Date();
    const result = await this.datasource.query(
      `UPDATE "User"
         SET "deletedAt" = $1
         WHERE id = $2
           AND "deletedAt" IS NULL`,
      [deleteAt, id],
    );
  }
}
