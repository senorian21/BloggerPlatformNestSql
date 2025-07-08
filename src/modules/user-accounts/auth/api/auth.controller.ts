import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { loginInputDto } from './input-dto/login.input-dto';
import { PasswordRecoveryInputDto } from '../dto/password-recovery.input-dto';
import { newPasswordInputDto } from './input-dto/new-password.input-dto';
import { registrationConfirmationUser } from './input-dto/registration-confirmation.input-dto';
import { registrationInputDto } from './input-dto/registration.input-dto';
import { RegistrationEmailResending } from './input-dto/registration-email-resending.input-dto';
import { ExtractUserFromRequest } from '../../guards/decorators/param/user.decorator';
import { UserContextDto } from '../dto/user-context.dto';
import { JwtAuthGuard } from '../../guards/bearer/jwt-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PasswordRecoveryCommand } from '../application/usecases/password-recovery.usecase';
import { LoginUserCommand } from '../application/usecases/login-user.usecase';
import { NewPasswordCommand } from '../application/usecases/new-password.usecase';
import { RegistrationConfirmationUserCommand } from '../application/usecases/registration-confirmation-user.usecase';
import { RegisterUserCommand } from '../application/usecases/register-user.usecase';
import { RegistrationEmailResendingCommand } from '../application/usecases/registration-email-resending.usecase';
import { AboutUserQuery } from '../application/queries/me.query-handler';
import { AuthViewDto } from './view-dto/auth.view-dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() dto: PasswordRecoveryInputDto) {
    await this.commandBus.execute<PasswordRecoveryCommand, void>(
      new PasswordRecoveryCommand(dto),
    );
  }
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: loginInputDto) {
    const accessToken = await this.commandBus.execute<
      LoginUserCommand,
      { accessToken: string }
    >(new LoginUserCommand(dto));
    return accessToken;
  }
  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() dto: newPasswordInputDto) {
    await this.commandBus.execute<NewPasswordCommand, void>(
      new NewPasswordCommand(dto),
    );
  }
  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(@Body() dto: registrationConfirmationUser) {
    await this.commandBus.execute<RegistrationConfirmationUserCommand, void>(
      new RegistrationConfirmationUserCommand(dto),
    );
  }
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() dto: registrationInputDto) {
    await this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(dto),
    );
  }
  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(@Body() dto: RegistrationEmailResending) {
    await this.commandBus.execute<RegistrationEmailResendingCommand, void>(
      new RegistrationEmailResendingCommand(dto),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@ExtractUserFromRequest() user: UserContextDto) {
    const userEntity = await this.queryBus.execute<
      AboutUserQuery,
      AuthViewDto | null
    >(new AboutUserQuery(user.id.toString()));
    return userEntity;
  }
}
