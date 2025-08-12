import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  CreateBlogDomainDto,
  UpdateBlogDomainDto,
} from './dto/create-blog.domain.dto';
import { HydratedDocument, Model } from 'mongoose';

export const nameConstraints = {
  minLength: 3,
  maxLength: 15,
};

export const descriptionConstraints = {
  minLength: 3,
  maxLength: 500,
};

export const websiteUrlConstraints = {
  minLength: 3,
  maxLength: 100,
};
