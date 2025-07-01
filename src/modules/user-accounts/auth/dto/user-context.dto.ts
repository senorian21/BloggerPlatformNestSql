import { Types } from 'mongoose';

export class UserContextDto {
  id: Types.ObjectId;
}

export type Nullable<T> = { [P in keyof T]: T[P] | null };
