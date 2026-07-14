import { ImageResponse } from 'next/og'

// iOS 홈화면 아이콘. iOS는 투명 영역 뒤에 검정을 합성하므로(불투명 권장)
// 검정 타일 대신 오렌지 타일 + 흰 hG 심볼로 채운다. 모서리는 iOS가 마스킹.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a45"/><stop offset="1" stop-color="#f1531b"/></linearGradient></defs>
<rect width="120" height="120" fill="url(#g)"/>
<circle cx="60" cy="60" r="42" stroke="#ffffff" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="200 64" transform="rotate(20 60 60)"/>
<line x1="48" y1="41" x2="48" y2="81" stroke="#ffffff" stroke-width="10.5" stroke-linecap="round"/>
<path d="M48 60 C48 50 72 49 72 66 L72 81" stroke="#ffffff" stroke-width="10.5" fill="none" stroke-linecap="round"/>
<circle cx="48" cy="60" r="6" fill="#0e0e0e"/>
</svg>`

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={180} height={180} src={`data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`} alt="HubGmate" />
      </div>
    ),
    size,
  )
}
