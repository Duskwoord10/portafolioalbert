import { useEffect, useRef, useState } from 'react'
import { cmsFetch } from '../cms/api.js'
import './translate-page.css'

const cache = new Map()
const pending = new Map()
const ignored = 'script,style,noscript,textarea,input,select,button,[contenteditable="true"],[data-no-translate]'

function cachedTranslation(text, target) {
  return cache.get(`${target}:${text}`)
}

async function translateBatch(texts, target) {
  const key = `${target}:${texts.join('\u241f')}`
  if (pending.has(key)) return pending.get(key)
  const request = cmsFetch('/public/translate', {
    method:'POST', credentials:'omit',
    body:JSON.stringify({ texts, sourceLanguage:'es', targetLanguage:target }),
  }).then(result => {
    if (!Array.isArray(result.translations) || result.translations.length !== texts.length)
      throw new Error('La respuesta de traducción no coincide con el contenido.')
    result.translations.forEach((value,index) => cache.set(`${target}:${texts[index]}`, value))
    return result.translations
  }).finally(() => pending.delete(key))
  pending.set(key, request)
  return request
}

export default function TranslatePageContent({ language }) {
  const originals = useRef(new Map())
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (language !== 'en') {
      for (const [node, entry] of originals.current) {
        if (node.isConnected && entry.translated && node.nodeValue === entry.translatedValue)
          node.nodeValue = entry.original
      }
      originals.current.clear()
      setStatus('')
      return undefined
    }

    let active = true
    let scanning = false
    let scanAgain = false
    const root = document.querySelector('.app-main')
    if (!root) return undefined

    async function scan() {
      if (scanning) { scanAgain = true; return }
      scanning = true
      const groups = []
      const group = []
      let groupChars = 0
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let node
      while ((node = walker.nextNode())) {
        const parent = node.parentElement
        if (!parent || parent.closest(ignored)) continue
        const value = node.nodeValue || ''
        const text = value.trim()
        if (text.length < 2 || text.length > 1500 ||
            /^(?:https?:\/\/|[^\s@]+@[^\s@]+\.[^\s@]+|[\d\s.,%+\-/]+)$/i.test(text)) continue
        const existing = originals.current.get(node)
        if (existing?.translated && value === existing.translatedValue) continue
        const original = existing && value === existing.originalValue ? existing.original : text
        originals.current.set(node, { original, originalValue:value, translated:existing?.translated || '', translatedValue:existing?.translatedValue || '' })
        if (cachedTranslation(text, 'en')) {
          const translated = cachedTranslation(text, 'en')
          const leading = value.match(/^\s*/)?.[0] || ''
          const trailing = value.match(/\s*$/)?.[0] || ''
          const translatedValue = `${leading}${translated}${trailing}`
          originals.current.set(node, { original, originalValue:value, translated, translatedValue })
          node.nodeValue = translatedValue
          continue
        }
        if (group.length >= 25 || groupChars + text.length > 5000) {
          groups.push(group.splice(0)); groupChars = 0
        }
        group.push({ node, text, original, value })
        groupChars += text.length
      }
      if (group.length) groups.push(group)

      if (groups.length) setStatus('loading')
      try {
        for (const items of groups) {
          if (!active) return
          const unique = [...new Set(items.map(item => item.text))]
          const translated = await translateBatch(unique, 'en')
          const byText = new Map(unique.map((text,index) => [text, translated[index]]))
          for (const item of items) {
            if (!item.node.isConnected || item.node.nodeValue !== item.value) continue
            const translation = byText.get(item.text)
            const leading = item.value.match(/^\s*/)?.[0] || ''
            const trailing = item.value.match(/\s*$/)?.[0] || ''
            const translatedValue = `${leading}${translation}${trailing}`
            originals.current.set(item.node, { original:item.original, originalValue:item.value, translated:translation, translatedValue })
            item.node.nodeValue = translatedValue
          }
        }
        if (active) setStatus('done')
      } catch {
        if (active) setStatus('error')
      } finally {
        scanning = false
        if (scanAgain && active) { scanAgain = false; void scan() }
      }
    }

    let scanTimer
    const scheduleScan = () => {
      if (scanTimer) return
      // Let the Spanish page paint and become interactive before spending time
      // translating text in the background.
      scanTimer = window.setTimeout(() => { scanTimer = undefined; void scan() }, 300)
    }
    scheduleScan()
    const observer = new MutationObserver(scheduleScan)
    observer.observe(root, { childList:true, characterData:true, subtree:true })
    return () => {
      active = false
      if (scanTimer) window.clearTimeout(scanTimer)
      observer.disconnect()
    }
  }, [language])

  return status === 'loading' ? <div className="aws-translation-status" role="status" aria-live="polite">Traduciendo con Amazon Translate…</div> :
    status === 'error' ? <div className="aws-translation-status is-error" role="status" aria-live="polite">No se pudo traducir ahora; se muestra el contenido original.</div> : null
}
