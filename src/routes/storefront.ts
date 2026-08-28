import { Router } from 'express';
import { getHomeFeed } from '../controllers/storefrontFeedController';

const router = Router();

router.get('/home-feed', getHomeFeed);

export default router;
