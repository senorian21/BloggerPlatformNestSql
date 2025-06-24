import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';

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
    return user;
  }
  async doesExistByLoginOrEmail(login: string, email: string) {
    return await this.UserModel.findOne({
      $or: [{ login }, { email }],
      deletedAt: null,
    });
  }
}
