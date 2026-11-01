import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate'

const client = new TranslateClient({ region: process.env.AWS_REGION || 'us-east-1' })
const cache = new Map()
const ttlMs = 24 * 60 * 60 * 1000
const maxCacheEntries = 2000
const maxTexts = 30
const maxTextChars = 1500
const maxBatchChars = 6000

export function createTranslationService(translateClient, options = {}) {
  const entries = options.cache || cache
  const now = options.now || Date.now

  return async function translateTexts(texts, sourceLanguage, targetLanguage) {
    if (!Array.isArray(texts) || texts.length < 1 || texts.length > maxTexts ||
        !['es', 'en'].includes(sourceLanguage) || !['es', 'en'].includes(targetLanguage) ||
        sourceLanguage === targetLanguage || texts.some(text => typeof text !== 'string' ||
          !text.trim() || text.length > maxTextChars) ||
        texts.reduce((total, text) => total + text.length, 0) > maxBatchChars)
      throw Object.assign(new Error('Invalid translation request'), { status:400 })

    const unique = [...new Set(texts)]
    const missing = []
    for (const text of unique) {
      const key = `${sourceLanguage}:${targetLanguage}:${text}`
      const entry = entries.get(key)
      if (entry && now() - entry.time < ttlMs) continue
      if (entry) entries.delete(key)
      missing.push({ key, text })
    }

    let cursor = 0
    const workers = Array.from({ length:Math.min(5, missing.length) }, async () => {
      while (cursor < missing.length) {
        const item = missing[cursor++]
        const response = await translateClient.send(new TranslateTextCommand({
          Text:item.text,
          SourceLanguageCode:sourceLanguage,
          TargetLanguageCode:targetLanguage,
        }))
        if (typeof response.TranslatedText !== 'string')
          throw new Error('Translation response was empty')
        entries.set(item.key, { value:response.TranslatedText, time:now() })
        while (entries.size > maxCacheEntries) entries.delete(entries.keys().next().value)
      }
    })
    await Promise.all(workers)

    return texts.map(text => entries.get(`${sourceLanguage}:${targetLanguage}:${text}`).value)
  }
}

export const translateTexts = createTranslationService(client)
