'use client'

import { Send } from 'lucide-react'
import { useState } from 'react'

// 백엔드 없이 동작하는 문의 폼 — 입력값으로 mailto를 구성해 메일 앱을 연다.
export function ContactForm({ email }: { email: string }) {
  const [name, setName] = useState('')
  const [from, setFrom] = useState('')
  const [type, setType] = useState('')
  const [message, setMessage] = useState('')

  const inputCls =
    'rounded-[14px] border border-white/10 bg-[var(--pf-surface)] px-[18px] py-4 text-[15px] text-[var(--pf-fg)] outline-none transition-colors focus:border-[var(--pf-ac)] placeholder:text-[var(--pf-fg-faint)]'

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const subject = `[포트폴리오 문의] ${type || '일반'} — ${name || '이름 미기재'}`
    const body = `이름: ${name}\n회신 이메일: ${from}\n유형: ${type}\n\n${message}`
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputCls}
      />
      <input
        type="email"
        placeholder="이메일"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className={inputCls}
      />
      <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} text-[var(--pf-fg-muted)]`}>
        <option value="">문의 유형 선택…</option>
        <option>채용 제안</option>
        <option>협업 / 외주</option>
        <option>기타</option>
      </select>
      <textarea
        placeholder="메시지"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className={`${inputCls} resize-y`}
      />
      <button
        type="submit"
        className="mt-1.5 flex items-center justify-center gap-2.5 rounded-full bg-[var(--pf-ac)] p-4 text-[14px] font-semibold text-[#141414] transition hover:brightness-110"
      >
        보내기
        <Send size={16} strokeWidth={2} />
      </button>
    </form>
  )
}
