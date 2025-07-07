import { Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { UserContextDto } from '../../auth/dto/user-context.dto';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'access-token-secret',
    });
  }

  async validate(payload: { userId: string }): Promise<UserContextDto> {
    return {
      id: new Types.ObjectId(payload.userId),
    };
  }
}
