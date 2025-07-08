import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}
  async save(user: UserDocument) {
    await user.save();
  }
  async findById(userId: string) {
    const user = await this.UserModel.findById(userId);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User does not exist',
      });
    }
    return user;
  }
  async findByLoginOrEmail(loginOrEmail: string): Promise<UserDocument | null> {
    const user = await this.UserModel.findOne({
      $or: [{ email: loginOrEmail }, { login: loginOrEmail }],
    });
    return user;
  }
  async findByCode(code: string) {
    const user = await this.UserModel.findOne({
      'emailConfirmation.confirmationCode': code,
    });
    return user;
  }

  async doesExistByLoginOrEmail(login: string, email: string) {
    return await this.UserModel.findOne({
      $or: [{ login }, { email }],
      deletedAt: null,
    });
  }
}
