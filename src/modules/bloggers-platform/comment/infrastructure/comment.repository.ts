import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: CommentModelType,
  ) {}
  async save(comment: CommentDocument) {
    await comment.save();
  }

  async findById(id: string): Promise<CommentDocument | null> {
    const comment = await this.commentModel.findById(id);
    if (!comment || comment.deletedAt !== null) {
      return null;
    }
    return comment;
  }
}
