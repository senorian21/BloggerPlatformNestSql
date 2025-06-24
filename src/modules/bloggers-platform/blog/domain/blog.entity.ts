import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  CreateBlogDomainDto,
  UpdateBlogDomainDto,
} from './dto/create-blog.domain.dto';
import { HydratedDocument, Model } from 'mongoose';

@Schema()
export class Blog {
  @Prop({ type: String, required: true })
  name: string;
  @Prop({ type: String, required: true })
  description: string;
  @Prop({ type: String, required: true })
  websiteUrl: string;
  @Prop({ type: Date, required: true })
  createdAt: Date;
  @Prop({ type: Boolean, required: true })
  isMembership: boolean;
  @Prop({ type: Date, default: null })
  deletedAt: Date;
  static createInstance(dto: CreateBlogDomainDto): BlogDocument {
    const blog = new this();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    blog.createdAt = new Date();
    blog.isMembership = false;
    return blog as BlogDocument;
  }
  updateBlog(dto: UpdateBlogDomainDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }
  softDeleteBlog() {
    this.deletedAt = new Date();
  }
}

export const BolgShema = SchemaFactory.createForClass(Blog);

BolgShema.loadClass(Blog);

export type BlogDocument = HydratedDocument<Blog>;

export type BlogModelType = Model<BlogDocument> & typeof Blog;
