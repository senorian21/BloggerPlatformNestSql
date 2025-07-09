import { UserDocument } from '../../../domain/user.entity';

export class UserExternalDto {
  id: string;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView = (user: UserDocument): UserExternalDto => {
    const dto = new UserExternalDto();
    dto.id = user._id.toString();
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;
    return dto;
  };
}
