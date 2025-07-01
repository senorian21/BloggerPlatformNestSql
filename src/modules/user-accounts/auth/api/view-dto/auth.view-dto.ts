import { UserDocument } from '../../../user/domain/user.entity';

export class AuthViewDto {
  userId: string;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView = (user: UserDocument): AuthViewDto => {
    const dto = new AuthViewDto();
    dto.email = user.email;
    dto.login = user.login;
    dto.userId = user._id.toString();
    return dto;
  };
}
