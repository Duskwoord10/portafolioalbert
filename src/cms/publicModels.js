export function cmsArticle(row, index) {
  if (!row.data) return row
  const data = row.data
  return { ...data, title: row.title, slug: row.slug, number: String(index + 1).padStart(2, '0'),
    category: data.category || 'Blog', theme: data.theme || 'aws', visualLabel: data.visualLabel || 'BLOG',
    readTime: Number(data.readTime) || 5, imageAlt: data.imageAlt || row.title,
    sections: data.sections || (data.blocks || []).map(block => ({ title: block.title || 'Sección',
      paragraphs: [block.text || ''], image: block.type === 'image' ? block.url : null })) }
}
