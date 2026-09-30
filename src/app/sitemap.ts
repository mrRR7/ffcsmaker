import { MetadataRoute } from 'next'

// Only pages worth ranking. Per-user pages (results, saved, compare) are noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://ffcsmaker.vercel.app/', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://ffcsmaker.vercel.app/planner', changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://ffcsmaker.vercel.app/privacy', changeFrequency: 'yearly', priority: 0.2 },
    { url: 'https://ffcsmaker.vercel.app/terms', changeFrequency: 'yearly', priority: 0.2 },
  ]
}
