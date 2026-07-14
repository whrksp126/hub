import { ImageResponse } from 'next/og'

// 사이트 기본 OG/트위터 카드. 개별 페이지가 이미지를 지정하지 않으면 이 카드가 쓰인다.
// Satori는 CJK 기본 폰트가 없어 한글이 깨지므로, 디자인 시스템의 영문 디스플레이 톤으로 구성.
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'HubGmate — Developer portfolio on autopilot'

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
<circle cx="60" cy="60" r="45" stroke="#f1531b" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="214 69" transform="rotate(20 60 60)"/>
<line x1="47" y1="40" x2="47" y2="83" stroke="#f4f4f2" stroke-width="10" stroke-linecap="round"/>
<path d="M47 60 C47 50 72 49 72 66 L72 83" stroke="#f4f4f2" stroke-width="10" fill="none" stroke-linecap="round"/>
<circle cx="47" cy="60" r="6.5" fill="#f1531b"/>
<circle cx="98" cy="74" r="8" fill="#f1531b"/>
</svg>`

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#0a0a0b',
          color: '#f4f4f2',
          padding: '80px 88px',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 상단: 마크 + 워드마크 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img width={92} height={92} src={`data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`} alt="" />
          <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em' }}>
            <span>Hub</span>
            <span style={{ color: '#f1531b' }}>G</span>
            <span style={{ color: '#9a9a9a' }}>mate</span>
          </div>
        </div>

        {/* 하단: 디스플레이 헤드라인 + 도메인 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 0.94,
              textTransform: 'uppercase',
            }}
          >
            <span>Portfolio,</span>
            <span style={{ color: '#5e5e5e' }}>on autopilot</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, color: '#9a9a9a' }}>
            <span style={{ color: '#f1531b' }}>●</span>
            <span>hub.ghmate.com</span>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
