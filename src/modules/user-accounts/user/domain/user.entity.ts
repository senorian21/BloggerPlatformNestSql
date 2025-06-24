import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  EmailConfirmation,
  EmailConfirmationSchema,
} from './email-confirmation.schema';
import { randomUUID } from 'crypto';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { add } from 'date-fns';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  login: string;
  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  email: string;
  @Prop({
    type: String,
    required: true,
  })
  passwordHash: string;
  @Prop({
    type: Date,
    required: true,
  })
  createdAt: Date;
  @Prop({
    type: EmailConfirmationSchema,
    required: true,
  })
  emailConfirmation: EmailConfirmation;
  @Prop({
    type: Date,
    default: null,
  })
  deletedAt: Date;

  static createInstance(dto: CreateUserDomainDto, hashedPassword: string) {
    const newUser = new this();
    newUser.login = dto.login;
    newUser.email = dto.email;
    newUser.passwordHash = hashedPassword;
    newUser.createdAt = new Date();
    newUser.emailConfirmation = {
      confirmationCode: randomUUID(),
      expirationDate: add(new Date(), { days: 7 }),
      isConfirmed: false,
    };
    return newUser as UserDocument;
  }
  softDeleteUser() {
    this.deletedAt = new Date();
  }
  registrationConfirmationUser() {
    this.emailConfirmation.isConfirmed = true;
  }
  updateCodeAndExpirationDate(
    newConfirmationCode: string,
    newExpirationDate: Date,
  ) {
    this.emailConfirmation.confirmationCode = newConfirmationCode;
    this.emailConfirmation.expirationDate = newExpirationDate;
  }
  updatePassword(hashedPassword: string) {
    this.passwordHash = hashedPassword;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
