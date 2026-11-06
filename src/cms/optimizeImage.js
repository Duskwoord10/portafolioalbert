const MAX_EDGE = 1600
const MIN_BYTES = 350_000

// Compress oversized uploads in the browser before they cross API Gateway.
// Keep the original when the browser cannot decode it or compression saves too little.
export async function optimizeImageFile(file) {
  if (!file?.type?.startsWith('image/') || file.size < MIN_BYTES || typeof createImageBitmap !== 'function') return file
  let bitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 700_000) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return file
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.82))
    if (!blob || blob.size >= file.size * 0.88) return file
    const name = file.name.replace(/\.[^.]+$/, '') || 'imagen'
    return new File([blob], `${name}.webp`, { type: 'image/webp', lastModified: file.lastModified })
  } catch {
    return file
  } finally {
    bitmap?.close()
  }
}
