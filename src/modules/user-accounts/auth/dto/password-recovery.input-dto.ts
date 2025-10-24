import { IsEmail, MinLength } from 'class-validator';

export class PasswordRecoveryInputDto {
  @IsEmail({}, { message: 'Некорректный email' })
  @MinLength(4, { message: 'Email должен быть длиннее 3 символов' })
  email: string;
}
