import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class RateLimiter {
  @Prop({
    type: String,
    required: true,
  })
  IP: string;
  @Prop({
    type: String,
    required: true,
  })
  URL: string;
  @Prop({
    type: Date,
    required: true,
  })
  date: Date;

  static createInstance(IP: string, URL: string, date: Date) {
    const limit = new this();
    limit.IP = IP;
    limit.URL = URL;
    limit.date = date;
    return limit;
  }
}
export const RateLimiterSchema = SchemaFactory.createForClass(RateLimiter);

RateLimiterSchema.loadClass(RateLimiter);

export type RateLimiterDocument = HydratedDocument<RateLimiter>;

export type RateLimiterModelType = Model<RateLimiterDocument> &
  typeof RateLimiter;
