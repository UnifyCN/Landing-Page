import { sanityClient } from './client'
import type { SanityPost, SanityPostStub } from './types'

const stub = `_id, title, slug, description, publishedAt, thumbnail, category`

export const getAllPosts = (): Promise<SanityPostStub[]> =>
  sanityClient.fetch(`*[_type == "post"] | order(publishedAt desc) { ${stub} }`)

export const getPostBySlug = (slug: string): Promise<SanityPost | null> =>
  sanityClient.fetch(
    `*[_type == "post" && slug.current == $slug][0] { ${stub}, updatedAt, craReference, seoTitle, seoDescription, keyTakeaway, faqs[]{question, answer}, body }`,
    { slug }
  )


export const getAllPostSlugs = async (): Promise<string[]> => {
  const posts = await sanityClient.fetch<{ slug: { current: string } }[]>(
    `*[_type == "post"] { slug }`
  )
  return posts.map((p) => p.slug.current)
}
