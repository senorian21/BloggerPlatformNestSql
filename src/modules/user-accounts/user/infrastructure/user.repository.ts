import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {DataSource, IsNull, Repository} from 'typeorm';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { EmailConfirmationDto } from '../dto/email-confirmation.dto';
import { UserDto } from '../dto/user.dto';
import { User } from '../domain/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectDataSource()
    protected datasource: DataSource,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(userId: number): Promise<User> {
    const result = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
    if (result === null) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User does not exist',
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
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [
        { login, deletedAt: IsNull() },
        { email, deletedAt: IsNull() },
      ],
    });

    return user ?  user : null;
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

  async save(user: User): Promise<void> {
    await this.userRepository.save(user);
  }

  async softDelete(id: number): Promise<void> {
    await this.userRepository.softDelete(id);
  }
}
