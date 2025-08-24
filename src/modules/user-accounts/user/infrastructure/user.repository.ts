import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';
import { EmailConfirmationDto } from '../dto/email-confirmation.dto';
import { UserDto } from '../dto/user.dto';
import { User } from '../domain/user.entity';
import { EmailConfirmation } from '../domain/email-confirmation.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectDataSource()
    protected datasource: DataSource,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(EmailConfirmation)
    private emailConfirmationRepository: Repository<EmailConfirmation>,
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

  async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: [
        { email: loginOrEmail, deletedAt: IsNull() },
        { login: loginOrEmail, deletedAt: IsNull() },
      ],
      relations: ['users', 'users.emailConfirmation'],
    });
  }

  async findByCodeOrIdEmailConfirmation({
    code,
    userId,
  }: {
    code?: string;
    userId?: number;
  }): Promise<EmailConfirmation | null> {
    if (!code && !userId) {
      return null;
    }

    return this.emailConfirmationRepository.findOne({
      where: code ? { confirmationCode: code } : { users: { id: userId! } },
      relations: ['users'],
    });
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

    return user ? user : null;
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



  async save(user: User): Promise<void> {
    await this.userRepository.save(user);
  }

  async saveEmailConfirmation(emailConfirmation: EmailConfirmation): Promise<void> {
    await this.emailConfirmationRepository.save(emailConfirmation);
  }

  async softDelete(id: number): Promise<void> {
    await this.userRepository.softDelete(id);
  }
}
