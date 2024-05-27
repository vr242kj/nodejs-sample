import express from 'express';
import ping from 'src/controllers/ping';
import tags from "./tags";

const router = express.Router();

router.get('/ping', ping);
router.use('/tags', tags);

export default router;
