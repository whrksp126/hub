// 새 글 생성 시 채워줄 예시 Plate 본문(안전한 기본 노드만 사용).
const p = (text: string, marks: Record<string, unknown> = {}) => ({
  type: 'p',
  children: [{ text, ...marks }],
})
const h = (level: 1 | 2 | 3, text: string) => ({ type: `h${level}`, children: [{ text }] })
const quote = (text: string) => ({ type: 'blockquote', children: [{ text }] })

export function blogSample() {
  return [
    h(2, '들어가며'),
    p('이 글은 예시 내용입니다. 자유롭게 지우고 직접 작성하세요. ‘/’ 를 입력하면 제목·목록·코드·이미지·콜아웃 등 다양한 블록을 넣을 수 있습니다.'),
    h(2, '본론'),
    p('여기에 핵심 내용을 적습니다. 이미지는 드래그&드롭으로 업로드되고, 코드 블록은 자동으로 하이라이트됩니다.'),
    quote('인용구는 이렇게 강조됩니다.'),
    h(2, '마치며'),
    p('정리와 다음 단계를 적어주세요.'),
  ]
}

