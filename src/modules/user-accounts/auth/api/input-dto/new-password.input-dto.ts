import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { passwordConstraints } from '../../../user/domain/user.entity';
import { IsString } from 'class-validator';

export class newPasswordInputDto {
  @IsStringWithTrim(
    passwordConstraints.minLength,
    passwordConstraints.maxLength,
  )
  newPassword: string;
  @IsString()
  recoveryCode: string;
}
