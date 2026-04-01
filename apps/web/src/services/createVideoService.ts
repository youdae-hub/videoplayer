import type { VideoService } from './types';
import { mockVideoService } from './mockVideoService';
import { createStrapiVideoService } from './strapiVideoService';
import { createCustomVideoService } from './customVideoService';

export function createVideoService(): VideoService {
  const mode = import.meta.env.VITE_API_MODE || 'mock';

  if (mode === 'strapi') {
    return createStrapiVideoService();
  }

  if (mode === 'custom') {
    return createCustomVideoService();
  }

  return mockVideoService;
}

export const videoService = createVideoService();
