import { useEffect } from 'react'

export function usePageMetadata(title, description, path, image) {
  useEffect(() => {
    const previousTitle = document.title
    const nodes = [], restores = []
    function setMeta(selector, attrs) {
      let node = document.head.querySelector(selector)
      if (!node) { node = document.createElement(attrs.tag || 'meta'); document.head.append(node); nodes.push(node) }
      else restores.push([node, Object.entries(attrs).filter(([key]) => key !== 'tag')
        .map(([key]) => [key, node.getAttribute(key)])])
      Object.entries(attrs).filter(([key]) => key !== 'tag').forEach(([key, value]) => node.setAttribute(key, value))
    }
    if (title) document.title = `${title} | Albert Sanfle`
    if (description) {
      setMeta('meta[name="description"]', { name:'description', content:description.slice(0, 160) })
      setMeta('meta[property="og:description"]', { property:'og:description', content:description.slice(0, 200) })
    }
    if (title) setMeta('meta[property="og:title"]', { property:'og:title', content:title })
    if (image) setMeta('meta[property="og:image"]', { property:'og:image', content:image })
    if (path) setMeta('link[rel="canonical"]', { tag:'link', rel:'canonical', href:`https://albertsanfle.com${path}` })
    return () => { document.title = previousTitle; nodes.forEach(node => node.remove())
      restores.forEach(([node, attrs]) => attrs.forEach(([key, value]) => value === null ? node.removeAttribute(key) : node.setAttribute(key, value))) }
  }, [title, description, path, image])
}
