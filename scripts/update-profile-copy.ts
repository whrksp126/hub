/**
 * 프로필 대표 카피를 갱신한다. (헤드라인 포지셔닝 변경: 풀스택 개발자 → AI 네이티브 프로덕트 빌더)
 *
 * 대상 필드
 *  - headline : 홈 히어로 대문자 2줄
 *  - title    : 직함(메타/PDF)
 *  - tagline  : 페이지 메타 description + 푸터 문구
 *  - intro    : 히어로 본문 문단
 *  - bio      : 프로필 카드 아래 소개
 *
 * 실행: pnpm exec tsx scripts/update-profile-copy.ts
 */
import fs from 'node:fs'
import Database from 'better-sqlite3'

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const sqlite = new Database(process.env.DATABASE_PATH || './data/hub.db')
const USERNAME = 'geonho'

const copy = {
  headline: 'AI-NATIVE\nPRODUCT LEADER',
  title: '프로덕트 리더 · 풀스택 개발자',
  tagline: '기획부터 런칭·운영까지, 제품 전 과정을 맡아 왔습니다.',
  intro:
    '프론트엔드에서 백엔드·앱·인프라까지, 아이디어 발굴부터 사업화까지. 팀을 이끌며 여러 실서비스를 설계하고 런칭해 운영해 왔습니다.',
  bio: '기획부터 런칭·운영까지, 프론트엔드·백엔드·앱·인프라를 모두 다루는 개발자.',
}

const before = sqlite.prepare('select headline,title,tagline,intro,bio,cards from profiles where username=?').get(USERNAME) as
  | (Record<string, string> & { cards: string })
  | undefined
if (!before) throw new Error(`${USERNAME} 프로필 없음`)

// 서비스 카드 1번의 "풀스택 단독 개발" 도 새 포지셔닝에 맞춰 교체 (헤드라인 바로 아래라 문구가 부딪힘)
const cards = JSON.parse(before.cards) as { title: string }[]
const cardBefore = cards[0]?.title
if (cards[0]) cards[0].title = '제품 전 과정 리드\n기획 · 런칭 · 운영'

sqlite
  .prepare('update profiles set headline=?, title=?, tagline=?, intro=?, bio=?, cards=?, updated_at=? where username=?')
  .run(copy.headline, copy.title, copy.tagline, copy.intro, copy.bio, JSON.stringify(cards), Math.floor(Date.now() / 1000), USERNAME)

console.log(`[cards[0].title]\n  before: ${cardBefore?.replace(/\n/g, ' / ')}\n  after : ${cards[0]?.title.replace(/\n/g, ' / ')}`)

for (const k of Object.keys(copy) as (keyof typeof copy)[]) {
  console.log(`[${k}]\n  before: ${String((before as Record<string, unknown>)[k]).replace(/\n/g, ' / ')}\n  after : ${copy[k].replace(/\n/g, ' / ')}`)
}
sqlite.close()
