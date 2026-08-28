import { Request, Response } from 'express';
import { sendSuccess } from '../utils/apiResponse';
import * as feedService from '../services/storefrontFeedService';

export async function getHomeFeed(_req: Request, res: Response): Promise<Response> {
  const feed = await feedService.getHomeFeed();
  // Set cache headers so edge/proxy/CDN caches this for 30s
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  return sendSuccess(res, feed);
}
