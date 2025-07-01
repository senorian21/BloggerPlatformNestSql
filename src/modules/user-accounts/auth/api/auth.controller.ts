import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { loginInputDto } from './input-dto/login.input-dto';
import { PasswordRecoveryInputDto } from '../dto/password-recovery.input-dto';
import { newPasswordInputDto } from './input-dto/new-password.input-dto';
import { registrationConfirmationUser } from './input-dto/registration-confirmation.input-dto';
import { registrationInputDto } from './input-dto/registration.input-dto';
import { RegistrationEmailResending } from './input-dto/registration-email-resending.input-dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() dto: PasswordRecoveryInputDto) {
    await this.authService.passwordRecovery(dto);
  }
  @Post('login')
  async login(@Body() dto: loginInputDto) {
    const accessToken = await this.authService.loginUser(dto);
    return accessToken;
  }
  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() dto: newPasswordInputDto) {
    await this.authService.newPassword(dto);
  }
  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(@Body() dto: registrationConfirmationUser) {
    await this.authService.registrationConfirmationUser(dto);
  }
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() dto: registrationInputDto) {
    await this.authService.registerUser(dto);
  }
  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(@Body() dto: RegistrationEmailResending) {
    await this.authService.registrationEmailResending(dto);
  }
}
