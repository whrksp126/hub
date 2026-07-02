// 외부 동영상 URL을 iframe src로 정규화(YouTube/Vimeo의 watch/share 링크 → embed 링크).
export function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    if (host.endsWith('youtube.com')) {
      const id = u.searchParams.get('v') || u.pathname.split('/').pop()
      return `https://www.youtube.com/embed/${id}`
    }
    if (host.endsWith('vimeo.com')) return `https://player.vimeo.com/video/${u.pathname.split('/').filter(Boolean).pop()}`
    return url
  } catch {
    return url
  }
}

// 임베드(유튜브/비메오)로 봐야 하는 URL인지.
export function isEmbedUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(url)
}
