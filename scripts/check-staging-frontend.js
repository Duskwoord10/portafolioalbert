const origin = 'https://d34buqdfi1n3fd.cloudfront.net'
const htmlResponse = await fetch(`${origin}/admin`, { cache: 'no-store' })
if (!htmlResponse.ok) throw new Error(`Panel HTTP ${htmlResponse.status}`)
const html = await htmlResponse.text()
const mainPath = html.match(/<script[^>]+src="([^"]+)"/)?.[1]
if (!mainPath) throw new Error('El HTML del panel no declara un bundle principal.')
const mainResponse = await fetch(new URL(mainPath, origin), { cache: 'no-store' })
if (!mainResponse.ok) throw new Error(`Bundle HTTP ${mainResponse.status}`)
const main = await mainResponse.text()
const adminPath = main.match(/AdminApp-[A-Za-z0-9_-]+\.js/)?.[0]
if (!adminPath) throw new Error('No se encontró el bundle administrativo.')
const adminResponse = await fetch(`${origin}/assets/${adminPath}`, { cache: 'no-store' })
if (!adminResponse.ok) throw new Error(`Bundle administrativo HTTP ${adminResponse.status}`)
const admin = await adminResponse.text()
console.log(JSON.stringify({ htmlStatus: htmlResponse.status, mainStatus: mainResponse.status,
  adminStatus: adminResponse.status, htmlBundle: mainPath, adminBundle: adminPath,
  loginPathPresent: admin.includes('/login'),
  externalApiEmbedded: [main, admin].some(bundle => bundle.includes('uueaour2lh.execute-api.us-east-1.amazonaws.com')) }))
