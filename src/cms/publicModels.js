export function cmsArticle(row, index) {
  if (!row.data) return row
  const data = row.data
  const optimizedBlogImages = new Set(['ai-assistant.png','api-observability.png','aws-architecture.png',
    'devops-pipeline.png','infrastructure-code.png'])
  const image = typeof data.image === 'string' && data.image.startsWith('/blog/') &&
    optimizedBlogImages.has(data.image.slice('/blog/'.length))
    ? data.image.replace(/\.png$/, '.jpg') : data.image
  return { ...data, title: row.title, slug: row.slug, number: String(index + 1).padStart(2, '0'),
    category: data.category || 'Blog', theme: data.theme || 'aws', visualLabel: data.visualLabel || 'BLOG',
    image, readTime: Number(data.readTime) || 5, imageAlt: data.imageAlt || row.title,
    sections: data.sections || (data.blocks || []).map(block => ({ title: block.title || 'Sección',
      paragraphs: [block.text || ''], image: block.type === 'image' ? block.url : null })) }
}
