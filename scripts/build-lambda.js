import { build } from 'esbuild'
import { writeFile } from 'node:fs/promises'

await build({
  entryPoints:['./server/lambda.js'],
  outfile:'.aws-build/lambda.mjs',
  bundle:true,
  platform:'node',
  target:'node22',
  format:'esm',
  banner:{ js:"import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  minify:false,
  sourcemap:false,
  logLevel:'info',
})

// SAM's handler is lambda.handler; use a tiny CommonJS entrypoint to load the
// bundled ESM output on Node 22 without relying on package-level module flags.
await writeFile('.aws-build/lambda.js',
  "exports.handler = async (event) => (await import('./lambda.mjs')).handler(event)\n")
