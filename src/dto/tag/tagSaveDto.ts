export class TagSaveDto {
  name?: string;
  createdAt?: Date;
  postId?: number;

  constructor(data: Partial<TagSaveDto>) {
    this.name = data.name;
    this.createdAt = data.createdAt ? data.createdAt : new Date();
    this.postId = data.postId;
  }
}