import {BlogDto} from "../../dto/blog.dto";


export class BlogViewDto {
  id: number;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;

  static mapToView = (blog: BlogDto): BlogViewDto => {
    const dto = new BlogViewDto();
    dto.id = blog.id;
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.websiteUrl;
    dto.isMembership = blog.isMembership;
    dto.createdAt = blog.createdAt;
    return dto;
  };
}
