import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../../user/domain/user.entity';
import { AuthViewDto } from '../../api/view-dto/auth.view-dto';
import { Types } from 'mongoose';

@Injectable()
export class AuthQueryRepository {
  constructor(
    @InjectModel(User.name)
    private userModel: UserModelType,
  ) {}
  async me(id: string) {
    const objectId = new Types.ObjectId(id); // ✅ Преобразование строки в ObjectId
    const user = await this.userModel.findOne({ _id: objectId });
    if (!user || user.deletedAt !== null) {
      return null;
    }
    return AuthViewDto.mapToView(user);
  }
}
