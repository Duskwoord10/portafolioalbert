import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

const [snapshotPath, apiUrl] = process.argv.slice(2)
if (!snapshotPath || !/^https:\/\/[a-z0-9]+\.execute-api\.us-east-1\.amazonaws\.com$/.test(apiUrl || '') ||
    apiUrl === 'https://uueaour2lh.execute-api.us-east-1.amazonaws.com')
  throw new Error('Uso: node scripts/prepare-public-sitemap-cloudfront.js SNAPSHOT_JSON API_PRODUCCION')

const snapshot = JSON.parse(readFileSync(resolve(snapshotPath), 'utf8').replace(/^\uFEFF/, ''))
const config = snapshot.DistributionConfig
if (!snapshot.ETag || !config || !config.Aliases?.Items?.includes('albertsanfle.com') ||
    config.Origins?.Items?.length !== 1 ||
    config.Origins.Items[0].Id !== 's3-albertsanflepage' ||
    (config.CacheBehaviors?.Quantity || 0) !== 0)
  throw new Error('CloudFront público cambió; revisa la configuración antes de preparar una actualización.')

const domain = new URL(apiUrl).host
config.Origins.Items.push({ Id:'albert-cms-production-sitemap',DomainName:domain,
  OriginPath:'',CustomHeaders:{ Quantity:0 },
  CustomOriginConfig:{ HTTPPort:80,HTTPSPort:443,OriginProtocolPolicy:'https-only',
    OriginSslProtocols:{ Quantity:1,Items:['TLSv1.2'] } },
  ConnectionAttempts:3,ConnectionTimeout:10,OriginShield:{ Enabled:false } })
config.Origins.Quantity = config.Origins.Items.length
config.CacheBehaviors = { Quantity:1,Items:[{
  PathPattern:'/sitemap.xml',TargetOriginId:'albert-cms-production-sitemap',
  ViewerProtocolPolicy:'redirect-to-https',AllowedMethods:{ Quantity:2,Items:['GET','HEAD'],
    CachedMethods:{ Quantity:2,Items:['GET','HEAD'] } },
  Compress:true,CachePolicyId:'4135ea2d-6df8-44a3-9df3-4b5a84be39ad',
  SmoothStreaming:false,
}] }
const destination = resolve('.cms-build')
mkdirSync(destination,{ recursive:true })
const path = join(destination,`public-cloudfront-sitemap-${Date.now()}.json`)
writeFileSync(path,JSON.stringify(config,null,2)+'\n',{ flag:'wx' })
console.log(JSON.stringify({ path,previousETag:snapshot.ETag,changes:[
  'Nuevo origen exclusivo de la API de producción',
  'Comportamiento /sitemap.xml sin caché; origen S3 predeterminado sin cambios',
] },null,2))
