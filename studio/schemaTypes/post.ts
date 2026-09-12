import { defineField, defineType } from 'sanity'
import { BLOG_CATEGORIES } from '../../src/lib/blog-categories.js'

export default defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (R) => R.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3, validation: (R) => R.required() }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description:
        'Drives the filter chips on /blog and the label on the card. Pick the ONE best fit. Audience wins the tie-break: a post written for international students goes under "International students" even if it is about banking or jobs.',
      options: {
        list: BLOG_CATEGORIES.map((c) => ({ title: c.label, value: c.value })),
        layout: 'dropdown',
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description:
        'Optional. The <title> tag for Google. Keyword-first, aim 50-60 chars. Used verbatim (add " | Unify Social" only if it still fits). Falls back to Title. This is NOT the on-page headline.',
      validation: (R) => R.max(65).warning('Aim for 50-60 characters so it does not truncate in search results.'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
      description:
        'Optional. Meta description for search results: answer-first, with a reason to click. Aim 140-160 chars. Falls back to Description.',
      validation: (R) => R.max(165).warning('Aim for 140-160 characters.'),
    }),
    defineField({
      name: 'keyTakeaway',
      title: 'Key Takeaway',
      type: 'text',
      rows: 3,
      description:
        'Optional answer-first summary (aim 40-60 words) shown as a callout at the top of the post. Ideal for featured snippets and AI answers.',
    }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime', validation: (R) => R.required() }),
    defineField({ name: 'updatedAt', title: 'Updated At', type: 'datetime' }),
    defineField({ name: 'thumbnail', title: 'Thumbnail', type: 'image', options: { hotspot: true }, validation: (R) => R.required() }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Legacy field. Posts now sort by Published At (newest is featured); kept for backwards compatibility. Set to 0.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'craReference',
      title: 'CRA Reference',
      type: 'string',
      description: 'Optional. e.g. "T1 General, Schedule 1"',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true } },
        { type: 'table' },
        { type: 'richTable' },
      ],
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'faqs',
      title: 'FAQ',
      type: 'array',
      description:
        'Optional Q&A. Rendered as a visible FAQ section and emitted as FAQPage structured data for AI and search extraction.',
      of: [
        {
          type: 'object',
          name: 'faq',
          fields: [
            { name: 'question', title: 'Question', type: 'string', validation: (R: any) => R.required() },
            { name: 'answer', title: 'Answer', type: 'text', rows: 3, validation: (R: any) => R.required() },
          ],
          preview: { select: { title: 'question' } },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', category: 'category', media: 'thumbnail' },
    prepare({ title, category, media }: any) {
      const label = BLOG_CATEGORIES.find((c) => c.value === category)?.label
      return { title, subtitle: label ?? 'No category', media }
    },
  },
})
