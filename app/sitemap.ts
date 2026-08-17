import type { MetadataRoute } from 'next';
import { universities, popularComparePairs, SITE_URL } from '@/lib/data';

// 전 학교 URL이 사이트맵에 들어가야 색인이 시작된다.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/about/`, lastModified: now, priority: 0.5 },
    { url: `${SITE_URL}/method/`, lastModified: now, priority: 0.5 },
    ...universities.map(u => ({
      url: `${SITE_URL}/univ/${u.id}/`, lastModified: now, priority: 0.8,
    })),
    ...popularComparePairs().map(([a, b]) => ({
      url: `${SITE_URL}/compare/${a}-vs-${b}/`, lastModified: now, priority: 0.4,
    })),
  ];
}

export const dynamic = 'force-static';
