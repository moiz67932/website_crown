// src/types/db.ts
export type DiscoveredTopic = {
  id: string
  topic: string
  source: string | null
  url: string | null
  traffic: string | null
  created_at: string
}

export type BulkJob = {
  id: string
  job_name: string
  started_at: string
  finished_at: string | null
  status: string | null
  logs: string | null
}

export type PostRow = {
  id: string
  slug: string
  status: 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published' | string
  city: string | null
  title_primary: string
  meta_description: string | null
  content_md: string | null
  hero_image_url: string | null
  scheduled_at: string | null
  published_at: string | null
  post_type?: string | null
  seo_score?: number | null
  reviewer?: string | null
  created_at?: string
  updated_at?: string
}
