import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Only pages worth ranking. Per-user pages (results, saved, compare) are noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/planner`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
