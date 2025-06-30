import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import {
  loginConstraints,
  passwordConstraints,
} from '../../domain/user.entity';
import { IsEmail } from 'class-validator';

export class CreateUserDto {
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
