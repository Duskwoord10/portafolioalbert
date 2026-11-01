import { build } from 'esbuild'

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
