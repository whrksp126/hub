/**
 * SkySwarm 정정 + 보강.
 *
 * 점검 결과 메타가 전부 틀려 있었다(기간 2024 → 실제 2026.05~07, 스택 Canvas/JavaScript →
 * 실제 TypeScript·Three.js/WebGL, "SaaS" → 과금 코드 제거됨). 섹션도 1개뿐이었다.
 * 코드로 확인된 사실만으로 다시 쓰고, 운영 사이트에서 찍은 스크린샷 3장을 붙인다.
 *
 * 실행: node scripts/rebuild-skyswarm.cjs
 */
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const now = Math.floor(Date.now() / 1000)
const idByName = new Map(db.prepare('select id, filename from media').all().map((m) => [m.filename, m.id]))

const MEDIA = [
  ['sky-01-studio-landing.png', 'https://objectstore.ghmate.com/hub/media/sky-01-studio-landing.png', 'SkySwarm 스튜디오 첫 화면'],
  ['sky-02-embed-demo.png', 'https://objectstore.ghmate.com/hub/media/sky-02-embed-demo.png', '다른 페이지에 태그로 심은 재생 화면'],
  ['sky-03-developer-docs.png', 'https://objectstore.ghmate.com/hub/media/sky-03-developer-docs.png', '임베드 문서'],
]
const insMedia = db.prepare('insert into media (filename,url,alt,mime,size,created_at) values (?,?,?,?,?,?)')
for (const [fn, url, alt] of MEDIA) {
  if (idByName.has(fn)) continue
  const r = insMedia.run(fn, url, alt, 'image/png', 0, now)
  idByName.set(fn, Number(r.lastInsertRowid))
  console.log(`[media] insert ${fn}`)
}
const M = (fn, caption) => ({ kind: 'image', mediaId: idByName.get(fn), caption })

const sections = [
  {
    kind: 'lead',
    heading: '한 줄로 말하면',
    body: '사진 한 장을 올리면 브라우저 안에서 수천 개의 점으로 바꿔, 드론쇼처럼 형태가 바뀌는 그래픽을 만듭니다. 만든 결과는 태그 한 줄로 아무 웹페이지에나 심을 수 있습니다.',
    bullets: [
      '서버가 필요 없다 — 이미지 변환도, 깊이 추정도 전부 사용자 브라우저에서 돈다',
      '입체로 보인다 — 평면 사진에서 앞뒤 거리를 추정해 옆에서 보면 두께가 있다',
      '어디에나 붙는다 — 스크립트 한 줄과 태그 하나면 남의 사이트에서도 재생된다',
    ],
  },
  {
    kind: 'gallery',
    heading: '① 사진을 점 수천 개로 바꿉니다',
    body: '사진을 그대로 점으로 찍으면 밝은 곳에 몰리고 빈 곳이 생깁니다. 밝기와 윤곽선으로 가중치를 만든 뒤 고르게 흩뿌리고, 뭉친 점들을 반복해서 밀어내 간격을 고르게 맞춥니다. 배경은 앞뒤 거리 분포를 보고 걷어냅니다.',
    media: [M('sky-01-studio-landing.png', '스튜디오 첫 화면 — 올린 이미지가 점 무리로 바뀐다')],
  },
  {
    kind: 'gallery',
    heading: '② 브라우저 안에서 앞뒤 거리를 추정합니다',
    body: '입체로 만들려면 평면 사진에서 앞뒤 거리를 알아내야 합니다. GPU 서버를 두는 대신 작은 깊이 추정 모델을 브라우저에서 직접 돌립니다. WebGPU가 안 되면 WASM으로 내려가고, 그마저 실패하면 밝기를 거리 삼아 변환을 끝까지 마칩니다.',
    media: [M('sky-02-embed-demo.png', '만든 그래픽을 다른 페이지에 태그로 심어 재생한 화면')],
  },
  {
    kind: 'gallery',
    heading: '③ 태그 한 줄로 남의 사이트에서 재생됩니다',
    body: '발행하면 점 위치와 색을 담은 파일 하나가 생깁니다. 스크립트 한 줄과 태그 하나를 넣으면 어떤 페이지에서도 그대로 재생됩니다. 파일 형식은 “모든 구간의 점 개수가 같은가” 같은 규칙을 스스로 검사해, 깨진 파일이 재생되지 않게 막습니다.',
    media: [M('sky-03-developer-docs.png', '임베드 문서 — 스크립트 한 줄과 태그 하나')],
  },
  {
    kind: 'features',
    heading: '핵심 기능',
    bullets: [
      '이미지 → 점 변환 — 밝기·윤곽·앞뒤 거리를 섞어 점을 고르게 배치한다',
      '입체 모드 — 브라우저에서 깊이를 추정해 옆에서 보면 두께가 있다',
      '시퀀스 — 이미지·텍스트·도형을 이어 붙이면 점들이 형태 사이를 흘러간다',
      '임베드 — 스크립트 한 줄 + 태그 하나. iframe이나 코드 호출로도 붙는다',
      '공유 — 발행하면 주소가 생기고, SNS에 붙이면 미리보기 카드가 뜬다',
    ],
  },
  {
    kind: 'challenge',
    heading: '기술적으로 풀어낸 문제들',
    bullets: [
      '점이 한쪽에 몰렸다 — 밝은 영역에 점이 뭉치고 어두운 곳은 비었다. 가중치를 만들어 고르게 흩뿌린 뒤, 뭉친 점을 반복해서 밀어내 간격을 맞췄다',
      '형태가 바뀔 때 프레임이 떨어졌다 — 점마다 출발·도착 위치와 색을 미리 넣어두고, 중간 계산을 전부 그래픽 카드에 맡겼다. 화면을 그릴 때마다 계산하는 값은 몇 개뿐이다',
      '형태가 바뀌어도 같은 점이어야 했다 — 첫 형태를 기준으로 가장 가까운 점끼리 짝지어, “3번 점”이 처음부터 끝까지 같은 점으로 남게 했다',
    ],
  },
  {
    kind: 'timeline',
    heading: '무엇을 했나',
    body: '개인 프로젝트. 약 6주 동안 혼자 만들어 배포했습니다.',
    bullets: [
      '2026.05~06 — 이미지 변환·렌더러·스튜디오를 만들고 브라우저 깊이 추정을 붙였다',
      '2026.07 — 파일 형식과 임베드 배포 경로를 정리하고 서버·문서까지 올렸다',
    ],
  },
  {
    kind: 'default',
    heading: '한계와 다음',
    bullets: [
      '만들어서 배포까지 했지만 사용자를 모으지 못했다. 공개된 작품이 아직 없다',
      '형태가 바뀌는 순간이 이 프로젝트의 핵심인데, 지금 화면만으로는 전달되지 않는다. 영상이 필요하다',
      '테스트를 한 줄도 쓰지 않았다. 형식 검증만 코드로 막아 뒀다',
    ],
  },
]

const stack = ['TypeScript', 'Three.js (WebGL/GLSL)', 'React', 'Transformers.js', 'Node.js · Express', 'MySQL', 'Docker']

db.prepare(`update projects set tag=?, year=?, role=?, url=?, summary=?, metrics=?, sections=?, stack=?, updated_at=? where slug='skyswarm'`)
  .run(
    '웹 · 3D 파티클 그래픽',
    '2026.05 — 배포 중',
    '개인 프로젝트 · 단독',
    'skyswarm-front.ghmate.com',
    '사진 한 장을 브라우저 안에서 점 수천 개로 바꿔, 드론쇼처럼 형태가 흐르는 그래픽을 만드는 웹 서비스. 만든 결과는 태그 한 줄로 아무 페이지에나 심을 수 있습니다.',
    JSON.stringify([
      { value: '5,000점', label: '사진 한 장을 바꾸는 기본 점 개수' },
      { value: '서버 0', label: '이미지 변환·깊이 추정을 전부 브라우저에서 처리' },
      { value: '태그 1개', label: '남의 사이트에 붙이는 데 필요한 코드' },
    ]),
    JSON.stringify(sections),
    JSON.stringify(stack),
    now,
  )
console.log('[skyswarm] 섹션 ' + sections.length + ' · 미디어 3 로 재작성')
db.close()
