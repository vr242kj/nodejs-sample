import log4js from 'log4js';
import httpStatus from 'http-status';
import { Request, Response } from 'express';
import {
  saveTag as saveTagApi,
  listTagsSortedByDescTime as listTagsSortedByDescTimeApi, countTag,
} from 'src/services/tag';
import { TagSaveDto } from 'src/dto/tag/tagSaveDto';
import errorHandler from "../../middlewares/errorHandler";

export const saveTag = async (req: Request, res: Response) => {
  const {
    name,
    createdAt,
    postId,
  } = new TagSaveDto(req.body);
  try {
    const id = await saveTagApi({
      name,
      createdAt,
      postId,
    });
    res.status(httpStatus.CREATED).send({
      id,
    });
  } catch (err) {
    log4js.getLogger().error('Error in creating tag.', err);
    errorHandler(err, res);
  }
};

export const listTagsSortedByDescTime = async (req: Request, res: Response) => {
  const postId = parseInt(req.params.postId as string, 10);
  const size = req.params.size ? parseInt(req.params.size as string, 10) : 5;
  const from = req.params.from ? parseInt(req.params.from as string, 10) : 0;
  try {
    const result = await listTagsSortedByDescTimeApi(postId, size, from);
    res.send(result);
  } catch (err) {
    log4js.getLogger().error('Error in retrieving tags.', err);
    errorHandler(err, res);
  }
};

export const countTagByPostId = async (req: Request, res: Response) => {
  const { postIds } = req.body;
  try {
    const postIdAndCountedTag = await countTag(postIds);
    res.json(postIdAndCountedTag);
  } catch (err) {
    log4js.getLogger().error('Error in counting tag', err);
    errorHandler(err, res);
  }
};
