import { ImageResponse } from 'next/og'

// iOS 홈화면 북마크 아이콘. 파비콘과 동일한 다크 타일 + 오렌지 hG 심볼.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
<circle cx="60" cy="60" r="44" stroke="#f1531b" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="209 68" transform="rotate(20 60 60)"/>
<line x1="48" y1="41" x2="48" y2="81" stroke="#f4f4f2" stroke-width="10.5" stroke-linecap="round"/>
<path d="M48 60 C48 50 72 49 72 66 L72 81" stroke="#f4f4f2" stroke-width="10.5" fill="none" stroke-linecap="round"/>
<circle cx="48" cy="60" r="6" fill="#f1531b"/>
<circle cx="98" cy="74" r="7.5" fill="#f1531b"/>
</svg>`

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#0e0e0e',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={150}
          height={150}
          src={`data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`}
          alt="HubGmate"
        />
      </div>
    ),
    size,
  )
}
