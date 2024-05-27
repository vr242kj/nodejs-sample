import express from 'express';
import {
  countTagByPostId,
  listTagsSortedByDescTime,
  saveTag,
} from 'src/controllers/tags';

const router = express.Router();

router.post('', saveTag);
router.get('/:postId/:size?/:from?', listTagsSortedByDescTime);
router.post('/_counts', countTagByPostId);

export default router;