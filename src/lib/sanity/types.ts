import type { BlogCategory } from '../blog-categories.js'

export type { BlogCategory }

export interface SanityImageRef {
  _type: 'image'
  asset: { _ref: string; _type: 'reference' }
}

export interface SanityPostStub {
  _id: string
  title: string
  slug: { current: string }
  description: string
  publishedAt: string
  thumbnail: SanityImageRef
  /** Absent on posts that predate the field - normalise with `toBlogCategory()`. */
  category?: BlogCategory
}

export interface SanityFaq {
  question: string
  answer: string
}

export interface SanityPost extends SanityPostStub {
  updatedAt?: string
  craReference?: string
  seoTitle?: string
  seoDescription?: string
  keyTakeaway?: string
  faqs?: SanityFaq[]
  body: any[]
}
