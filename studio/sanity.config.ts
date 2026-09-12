import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {table} from '@sanity/table'
import {media} from 'sanity-plugin-media'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'unify-landing',

  projectId: 'j4gu2dbr',
  dataset: 'production',

  plugins: [
    structureTool({structure}),
    visionTool(),
    table(),
    media(),
  ],

  schema: {
    types: schemaTypes,
  },

  // The post schema imports the shared category list from ../src/lib (outside
  // the Studio root). Vite's dev server refuses files outside the root unless
  // they are allow-listed; `sanity build` / `sanity deploy` are unaffected.
  vite: (config) => ({
    ...config,
    server: {
      ...config.server,
      fs: {...config.server?.fs, allow: [...(config.server?.fs?.allow ?? []), '..']},
    },
  }),
})
