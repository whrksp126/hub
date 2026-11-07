// 2026-11 최신화: orderandgo-current.json 대비 CHANGES.md 반영 (담당 에이전트 refresh-2026-11)
const Database = require('better-sqlite3')
const db = new Database(process.env.DATABASE_PATH || './data/hub.db')
const p = db.prepare("select id, metrics, stack, sections from projects where slug='orderandgo'").get()
const metrics = JSON.parse(p.metrics), stack = JSON.parse(p.stack), S = JSON.parse(p.sections)
const termImg = Number(process.argv[2])

metrics[0].label = '단말기 50대가 동시에 결제를 가져가도 받는 건 항상 한 대 (500회 시험)'
metrics[1].label = '매장 반경 밖 QR 주문 차단 (기본값, 매장별 조정)'
metrics[2] = { value: '17ms', label: 'POS에서 결제를 누른 뒤 단말기가 받기까지 (중간값, 로컬 측정)' }

stack.splice(stack.indexOf('Socket.IO(실시간)'), 1, 'Socket.IO(실시간 · 결제 단말기 wss 포함)')
stack.splice(stack.indexOf('토스 단말기 SDK') + 1, 0, 'Firebase 전화 인증')

const sec = (h) => S.find((s) => s.heading && s.heading.includes(h))
sec('② 매장에 이미').body = '카드 결제와 영수증 출력까지 소프트웨어 안에서 끝납니다. 토스 단말기를 쓰는 매장이라면 새 결제기 없이 그대로 연결해 씁니다. POS에서 결제를 누르면 단말기 화면이 곧바로 바뀌고, 결제 취소와 나눠 내기도 됩니다.'
if (termImg) sec('③ 사장님').media.push({ kind: 'image', mediaId: termImg, caption: '단말기 연결 — 단말기가 스스로 보낸 가맹점 정보와 실시간 연결 상태' })

const f = sec('핵심 기능').bullets
f[0] = '손님 QR 주문 — 테이블 QR을 찍어 메뉴·옵션·장바구니·직원호출까지, 앱 설치 없이 · 매장 반경·착석 테이블 확인으로 가짜 주문 차단'
f[4] = '결제·영수증 — 매장 단말기로 카드·현금·현금영수증, POS와 단말기 실시간 연동, 결제 취소와 나눠 내기, 종이 영수증 출력'
f[5] = '매장 관리 — 메뉴 3단 분류, 테이블 배치, 매출 정산, 단말기·프린터·QR·직원호출 설정을 한 가지 화면 규격으로'
f.push('사장님 계정 — 휴대폰 번호로 가입하고, 매장 여러 곳을 만들어 오가며 관리한다',
  '가입 없이 체험 — 업종·메뉴·테이블을 고르면 내 매장 미리보기가 바로 만들어지고, 가입하면 그대로 매장이 된다',
  '영업일 마감 — 전날 결제·조리가 남은 테이블을 찾아 유지하거나 정리한다')

const t = sec('무엇을 했나').bullets
t[1] = t[1] + ' · 2026-09 멀티테넌트 보안 보강, 2026-11 단말기 실시간 통신 전환'

const c = sec('기술적으로 풀어낸').bullets
c[0] = '결제 단말기를 서버처럼 세웠더니 보안 연결(HTTPS) 화면에서 접속이 막혔다 — 1초마다 물어보는 방식으로 먼저 돌려 놓고, 결제 상태는 서버 한 곳에서만 관리하게 설계했다. 이후 연결 방향을 뒤집어 단말기가 서버로 접속(wss)하게 바꿨고, 이제 결제를 누르는 즉시 단말기에 전달된다. 단말기 50대가 동시에 받아 가도 결제되는 건 한 대뿐이다(500회 시험, 중복 0건)'
c[1] = '꺼진 단말기가 "온라인"으로 보였다 — 단말기가 3초마다 보내는 신호를 기준으로, 10초 안에 소식이 없으면 끊김으로 표시하게 바꿨다'
c.push('매장끼리 데이터가 섞일 틈을 막았다 — 화면 묶음 단위 로그인 검사, 소유 확인 함수, 매장별 실시간 채널로 다른 매장의 주문·결제에 손댈 수 없게 했다')

sec('한계와 다음').bullets.push('결제 상태를 서버 메모리에 두고 있어 서버 한 대(워커 하나) 운영이 전제다. 매장이 늘면 공유 저장소(Redis)로 옮기는 게 다음 일이다')

db.prepare('update projects set metrics=?, stack=?, sections=?, updated_at=? where id=?')
  .run(JSON.stringify(metrics), JSON.stringify(stack), JSON.stringify(S), Math.floor(Date.now() / 1000), p.id)
console.log('orderandgo updated')
