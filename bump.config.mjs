import { defineConfig } from 'bumpp'

export default defineConfig({
  recursive: true,
  execute: 'pnpm test',
  commit: 'v',
  tag: 'v',
})
