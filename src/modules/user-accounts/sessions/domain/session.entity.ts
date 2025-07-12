import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class Session {
  @Prop({
    type: String,
    required: true,
  })
  userId: string;
  @Prop({
    type: Date,
    required: true,
  })
  createdAt: Date;
  @Prop({
    type: Date,
    required: true,
  })
  expiresAt: Date;
  @Prop({
    type: String,
    required: true,
  })
  deviceId: string;
  @Prop({
    type: String,
    required: true,
  })
  ip: string;
  @Prop({
    type: String,
    required: true,
  })
  deviceName: string;
  @Prop({
    type: Date,
    default: null,
  })
  deletedAt: Date;

  static createSession(
    userId: string,
    iat: number,
    exp: number,
    deviceId: string,
    ip: string,
    deviceName: string,
  ) {
    const newSession = new this();
    newSession.userId = userId;
    newSession.createdAt = new Date(iat * 1000);
    newSession.expiresAt = new Date(exp * 1000);
    newSession.deviceId = deviceId;
    newSession.deviceName = deviceName;
    newSession.ip = ip;
    return newSession as SessionDocument;
  }
  updateSession(iat: number, exp: number) {
    this.createdAt = new Date(iat * 1000);
    this.expiresAt = new Date(exp * 1000);
  }
  deleteSession() {
    this.deletedAt = new Date();
  }
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.loadClass(Session);

export type SessionDocument = HydratedDocument<Session>;

export type SessionModelType = Model<SessionDocument> & typeof Session;
