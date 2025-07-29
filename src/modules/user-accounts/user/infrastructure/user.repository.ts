import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { EmailConfirmationDto } from '../dto/email-confirmation.dto';
import {UserDto} from "../dto/user.dto";

@Injectable()
export class UserRepository {
  constructor(
    @InjectDataSource()
    protected datasource: DataSource,
  ) {}
  async findById(userId: number): Promise<UserDto> {
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

  async findByLoginOrEmail(loginOrEmail: string): Promise<UserDto | null> {
    const query = `
    SELECT * 
    FROM "User"
    WHERE "deletedAt" IS NULL 
      AND (email = $1 OR login = $1)
    LIMIT 1
  `;

    const result = await this.datasource.query(query, [loginOrEmail]);

    return result.length > 0 ? result[0] : null;
  }

  async findByCodeOrIdEmailConfirmation({
    code,
    userId,
  }: {
    code?: string;
    userId?: number;
  }): Promise<EmailConfirmationDto | null> {
    if (!code && !userId) {
      return null;
    }

    let sql: string;
    const params: (string | number)[] = [];

    if (code) {
      sql = `
        SELECT *
        FROM "emailConfirmation"
        WHERE "confirmationCode" = $1
        LIMIT 1
    `;
      params.push(code);
    } else {
      sql = `
        SELECT *
        FROM "emailConfirmation"
        WHERE "userId" = $1
        LIMIT 1
      `;
      params.push(userId!);
    }

    const result: EmailConfirmationDto[] = await this.datasource.query(
      sql,
      params,
    );
    return result.length > 0 ? result[0] : null;
  }

  async doesExistByLoginOrEmail(
    login: string,
    email: string,
  ): Promise<UserDto | null> {
    const result = await this.datasource.query(
      `SELECT *
     FROM "User" 
     WHERE (login = $1 OR email = $2) 
       AND "deletedAt" IS NULL
     LIMIT 1`,
      [login, email],
    );

    return result.length > 0 ? result[0] : null;
  }

  async createUser(dto: CreateUserDomainDto, hashedPassword: string): Promise<number> {
    const result = await this.datasource.query(
      `INSERT INTO "User" (login, email, "passwordHash")
         VALUES ($1, $2, $3)
           RETURNING id, login, email, "createdAt"`,
      [dto.login, dto.email, hashedPassword],
    );

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

  async updateCodeAndExpirationDate(
    newConfirmationCode: string,
    newExpirationDate: Date,
    userId: number,
  ): Promise<void> {
    await this.datasource.query(
      `UPDATE "emailConfirmation"
         SET "confirmationCode" = $1,
             "expirationDate" = $2
         WHERE "userId" = $3`,
      [newConfirmationCode, newExpirationDate, userId],
    );
  }

  async updatePassword(newPasswordHash: string, userId: number): Promise<void> {
    await this.datasource.query(
      `
        UPDATE "User"
        SET "passwordHash" = $1
        WHERE "id" = $2
    `,
      [newPasswordHash, userId],
    );
  }

  async registrationConfirmationUser(userId: number): Promise<void> {
    await this.datasource.query(
      `
        UPDATE "emailConfirmation"
        SET "isConfirmed" = true
        WHERE "userId" = $1
    `,
      [userId],
    );
  }

}
