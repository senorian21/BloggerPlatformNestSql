import { IsEmail } from 'class-validator';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import {
  loginConstraints,
  passwordConstraints,
} from '../../../user/domain/user.entity';

export class registrationInputDto {
  @IsStringWithTrim(loginConstraints.minLength, loginConstraints.maxLength)
  login: string;
  @IsStringWithTrim(
    passwordConstraints.minLength,
    passwordConstraints.maxLength,
  )
  password: string;
  @IsEmail()
  email: string;
}
