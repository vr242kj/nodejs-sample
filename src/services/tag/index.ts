import Tag, {ITag} from 'src/model/tag';
import {TagSaveDto} from 'src/dto/tag/tagSaveDto';
import {TagDto} from "../../dto/tag/tagDto";
import {ValidationError} from "../../system/validationError";
import {BadRequestError} from "../../system/badRequestError";
import {checkPostIdExistence} from "../../client";

export const listTagsSortedByDescTime = async (
  postId: number,
  size: number,
  from: number
): Promise<TagDto[]> => {

  validateParameters(postId, size, from);

  const tags = await Tag
    .find({
      ...(postId && { postId }),
    })
    .sort({createdAt: -1})
    .skip(Number(from))
    .limit(Number(size));

  return tags.map(tag => toTagDto(tag));
};

const validateParameters = (postId: number, size: number, from: number): void => {
  if (isNaN(postId) || isNaN(size) || isNaN(from)) {
    throw new BadRequestError('Invalid postId, size, or from parameters');
  }

  if (size < 0 || from < 0) {
    throw new BadRequestError('Size and from must be non-negative');
  }
};

const toTagDto = (tag: ITag): TagDto => {
  return ({
    _id: tag._id,
    name: tag.name,
    postId: tag.postId,
    createdAt: tag.createdAt,
  });
};

export const saveTag = async (
  tagDto: TagSaveDto
): Promise<string> => {
  await validateTag(tagDto);
  const tag = await new Tag(tagDto).save();
  return tag._id;
};

const validateTag = async (tagDto: TagSaveDto) => {
  const postId = tagDto.postId;
  if (!postId || !tagDto.name) {
    throw new ValidationError('Missing required fields');
  }
  await checkPostIdExistence(postId);
};

export const countTag = async (
  postIds: string[]
): Promise<Record<string, number>> => {
  const parsedPostIds: number[] = validateArrayOfPostId(postIds);

  const result = await Tag.aggregate([
    {$match: {postId: {$in: parsedPostIds}}},
    {$group: {_id: "$postId", count: {$sum: 1}}},
  ]);

  return toPostIdAndCountedTagRecord(parsedPostIds, result);
};

const validateArrayOfPostId = (postIdsString: string[]): number[] => {
  if (!Array.isArray(postIdsString)) {
    throw new BadRequestError('Invalid input, postIds should be an array');
  }

  return postIdsString.map((id: string) => {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      throw new BadRequestError('Invalid input, all values in postIds should be numbers');
    }
    return parsedId;
  });
};

const toPostIdAndCountedTagRecord = (parsedPostIds: number[], result: any[]): Record<string, number> => {
  const postIdAndCountedTag: Record<string, number> = parsedPostIds.reduce((acc: Record<string, number>, id) => {
    acc['id' + id.toString()] = 0;
    return acc;
  }, {});

  result.forEach(item => {
    postIdAndCountedTag['id' + item._id.toString()] = item.count;
  });

  return postIdAndCountedTag;
};
