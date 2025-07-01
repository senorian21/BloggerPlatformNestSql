import { IsEmail } from 'class-validator';

export class RegistrationEmailResending {
  @IsEmail()
  email: string;
}
