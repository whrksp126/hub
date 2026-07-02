'use client'

import {
  Background,
  Handle,
  Position,
  ReactFlow,
  useReactFlow,
  useStore,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { Diamond, Key, Table2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ZoomSlider } from '@/components/portfolio/sections/zoom-controls'

const ERD_MIN_ZOOM = 0.4
const ERD_MAX_ZOOM = 2.2

// React Flow용 줌 슬라이더 어댑터 — <ReactFlow> 자식으로 렌더해야 컨텍스트 사용 가능.
// 확대/축소는 항상 콘텐츠 중앙(center)을 기준으로 setCenter 해서 시점이 튀지 않게 한다.
function FlowZoomControls({ center }: { center: { x: number; y: number } }) {
  const { setCenter, fitView } = useReactFlow()
  const scale = useStore((s) => s.transform[2])
  const clamp = (s: number) => Math.max(ERD_MIN_ZOOM, Math.min(ERD_MAX_ZOOM, s))
  const go = (s: number) => setCenter(center.x, center.y, { zoom: clamp(s), duration: 0 })
  return (
    <ZoomSlider
      scale={scale}
      min={ERD_MIN_ZOOM}
      max={ERD_MAX_ZOOM}
      onIn={() => go(scale * 1.3)}
      onOut={() => go(scale / 1.3)}
      onSet={(s) => go(s)}
      onReset={() => fitView({ padding: 0.16 })}
    />
  )
}

// ───────────────────────────────────────────────────────────────────────────
// ERD 다이어그램 — mermaid `erDiagram` 텍스트를 그대로 입력받아 MySQL Workbench
// 스타일(헤더바·컬럼별 키 아이콘·타입·Indexes 풋터·crow's-foot)로 렌더한다.
// 작성 포맷이 mermaid와 동일해 다른 프로젝트/에이전트가 그대로 재사용 가능(스킬).
// 단 타입 토큰은 `VARCHAR(45)` 같은 Workbench식 표기를 허용한다.
// ───────────────────────────────────────────────────────────────────────────

type ColKey = 'PK' | 'FK' | 'UK' | null
type Col = { type: string; name: string; key: ColKey }
type Entity = { name: string; cols: Col[] }
type Rel = { from: string; to: string; leftCard: string; rightCard: string; label: string }

const HEADER_H = 38
const ROW_H = 27
const FOOTER_H = 28
const CHAR_W = 7.1

function parseCols(into: Col[], text: string) {
  for (const tokRaw of text.split(';')) {
    const tok = tokRaw.trim()
    if (!tok || tok === '}') continue
    const parts = tok.split(/\s+/)
    if (parts.length < 2) continue
    const [type, name, ...rest] = parts
    const key: ColKey = rest.includes('PK') ? 'PK' : rest.includes('FK') ? 'FK' : rest.includes('UK') ? 'UK' : null
    into.push({ type, name, key })
  }
}

function parseErDiagram(src: string): { entities: Entity[]; rels: Rel[] } {
  const lines = src.split('\n').map((l) => l.trim())
  const map = new Map<string, Col[]>()
  const ensure = (n: string) => {
    if (!map.has(n)) map.set(n, [])
    return map.get(n)!
  }
  const rels: Rel[] = []
  // A ||--o{ B : label   (-- 실선 / .. 점선 모두 허용)
  const relRe = /^(\w+)\s+([|}{o]{2})(?:--|\.\.)([|}{o]{2})\s+(\w+)\s*:\s*(.*)$/
  let cur: Col[] | null = null

  for (const raw of lines) {
    if (!raw || raw.startsWith('erDiagram') || raw.startsWith('%%')) continue
    if (cur) {
      if (raw === '}') {
        cur = null
        continue
      }
      const inner = raw.endsWith('}') ? raw.slice(0, -1) : raw
      parseCols(cur, inner)
      if (raw.endsWith('}')) cur = null
      continue
    }
    const block = raw.match(/^(\w+)\s*\{(.*)$/)
    if (block) {
      cur = ensure(block[1])
      const rest = block[2].trim()
      if (rest) {
        parseCols(cur, rest.endsWith('}') ? rest.slice(0, -1) : rest)
        if (rest.endsWith('}')) cur = null
      }
      continue
    }
    const m = raw.match(relRe)
    if (m) {
      const [, a, c1, c2, b, label] = m
      ensure(a)
      ensure(b)
      rels.push({ from: a, to: b, leftCard: c1, rightCard: c2, label: (label || '').replace(/"/g, '').trim() })
    }
  }
  const entities: Entity[] = [...map.entries()].map(([name, cols]) => ({ name, cols }))
  return { entities, rels }
}

// crow's-foot 종류 정규화 — 마커 id로 사용.
function cardKind(tok: string): 'one' | 'zeroOrOne' | 'zeroOrMany' | 'oneOrMany' {
  const many = tok.includes('{') || tok.includes('}')
  const optional = tok.includes('o')
  if (many) return optional ? 'zeroOrMany' : 'oneOrMany'
  return optional ? 'zeroOrOne' : 'one'
}

function entityWidth(e: Entity): number {
  const longest = Math.max(e.name.length + 4, ...e.cols.map((c) => c.name.length + c.type.length + 5))
  return Math.min(330, Math.max(196, Math.round(longest * CHAR_W) + 56))
}
function entityHeight(e: Entity): number {
  return HEADER_H + e.cols.length * ROW_H + FOOTER_H
}

// ── 커스텀 노드: Workbench 테이블 ─────────────────────────────────────────
type TableData = { entity: Entity; width: number }

function KeyIcon({ k }: { k: ColKey }) {
  if (k === 'PK') return <Key size={12} className="text-[#e3b341]" fill="currentColor" strokeWidth={1.6} />
  if (k === 'FK') return <Diamond size={11} className="text-[#e0685c]" fill="currentColor" />
  if (k === 'UK') return <Diamond size={11} className="text-[#5c9ce0]" fill="currentColor" />
  return <Diamond size={10} className="text-white/30" strokeWidth={1.8} />
}

function TableNode({ data }: NodeProps<Node<TableData>>) {
  const { entity, width } = data
  return (
    <div
      className="overflow-hidden rounded-[9px] border border-white/12 bg-[#1a1a1a] font-sans shadow-[0_10px_28px_rgba(0,0,0,0.5)]"
      style={{ width }}
    >
      <Handle type="target" position={Position.Left} id="l" style={{ opacity: 0, left: 0 }} />
      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0, right: 0 }} />
      {/* 헤더 */}
      <div
        className="flex items-center gap-1.5 border-b border-white/10 px-2.5 font-semibold text-[#ededed]"
        style={{ height: HEADER_H, background: 'linear-gradient(180deg,#2b2b2f 0%,#212124 100%)' }}
      >
        <Table2 size={13} className="text-[var(--pf-ac)]" />
        <span className="truncate text-[12.5px] tracking-[-0.01em]">{entity.name}</span>
      </div>
      {/* 컬럼 */}
      <div>
        {entity.cols.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 px-2.5"
            style={{ height: ROW_H, background: i % 2 ? 'rgba(255,255,255,0.035)' : 'transparent', borderTop: i ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
          >
            <span className="flex w-3.5 flex-none justify-center">
              <KeyIcon k={c.key} />
            </span>
            <span className={`truncate text-[12px] ${c.key === 'PK' ? 'font-bold text-[#f3f3f3]' : 'font-medium text-[#d7d7d7]'}`}>
              {c.name}
            </span>
            <span className="pf-mono ml-auto flex-none pl-2 text-[10.5px] uppercase tracking-tight text-[#7d7d7d]">{c.type}</span>
          </div>
        ))}
      </div>
      {/* Indexes 풋터 */}
      <div
        className="flex items-center gap-1.5 border-t border-white/10 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
        style={{ height: FOOTER_H, background: 'rgba(255,255,255,0.03)', color: '#767676' }}
      >
        Indexes
      </div>
    </div>
  )
}

const nodeTypes = { erTable: TableNode }
const EDGE_COLOR = '#8b98ab'

// crow's-foot SVG 마커 정의(문서 전역). markerStart는 auto-start-reverse로 자동 반전.
// React Flow에는 마커 "id"만 넘기고(문자열) → 내부에서 url(#id)로 참조한다.
function ErdMarkers() {
  const common = { stroke: EDGE_COLOR, strokeWidth: 1.8, fill: 'none' as const, strokeLinecap: 'round' as const }
  const m = (id: string, children: React.ReactNode) => (
    <marker
      id={id}
      viewBox="0 0 28 28"
      refX="26"
      refY="14"
      markerWidth="26"
      markerHeight="26"
      orient="auto-start-reverse"
      markerUnits="userSpaceOnUse"
    >
      {children}
    </marker>
  )
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        {/* one(||): 엔티티 옆 수직 바 1개 */}
        {m('erd-one', <path d="M17,6 L17,22 M17,14 L26,14" {...common} />)}
        {/* zeroOrOne(|o): 바 + 원 */}
        {m(
          'erd-zeroOrOne',
          <>
            <path d="M19,6 L19,22 M9,14 L26,14" {...common} />
            <circle cx="9" cy="14" r="5" stroke={EDGE_COLOR} strokeWidth={1.6} fill="#fff" />
          </>,
        )}
        {/* oneOrMany(|{): 바 + 까마귀발 */}
        {m('erd-oneOrMany', <path d="M10,14 L26,5 M10,14 L26,14 M10,14 L26,23 M7,6 L7,22" {...common} />)}
        {/* zeroOrMany(o{): 원 + 까마귀발 */}
        {m(
          'erd-zeroOrMany',
          <>
            <path d="M12,14 L26,5 M12,14 L26,14 M12,14 L26,23" {...common} />
            <circle cx="6" cy="14" r="4.2" stroke={EDGE_COLOR} strokeWidth={1.6} fill="#fff" />
          </>,
        )}
      </defs>
    </svg>
  )
}

type Bounds = [[number, number], [number, number]]

function buildGraph(entities: Entity[], rels: Rel[]): { nodes: Node<TableData>[]; edges: Edge[]; bounds: Bounds; center: { x: number; y: number } } {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 36, ranksep: 96, marginx: 12, marginy: 12 })
  g.setDefaultEdgeLabel(() => ({}))
  const sizes = new Map<string, { w: number; h: number }>()
  for (const e of entities) {
    const w = entityWidth(e)
    const h = entityHeight(e)
    sizes.set(e.name, { w, h })
    g.setNode(e.name, { width: w, height: h })
  }
  for (const r of rels) if (sizes.has(r.from) && sizes.has(r.to)) g.setEdge(r.from, r.to)
  dagre.layout(g)

  const nodes: Node<TableData>[] = entities.map((e) => {
    const { w, h } = sizes.get(e.name)!
    const p = g.node(e.name)
    return {
      id: e.name,
      type: 'erTable',
      position: { x: (p?.x ?? 0) - w / 2, y: (p?.y ?? 0) - h / 2 },
      data: { entity: e, width: w },
      draggable: true,
    }
  })
  const edges: Edge[] = rels
    .filter((r) => sizes.has(r.from) && sizes.has(r.to))
    .map((r, i) => ({
      id: `e${i}`,
      source: r.from,
      target: r.to,
      sourceHandle: 'r',
      targetHandle: 'l',
      type: 'smoothstep',
      label: r.label || undefined,
      // React Flow는 문자열 마커를 url(#id)로 감싸므로 id만 전달한다.
      markerStart: `erd-${cardKind(r.leftCard)}`,
      markerEnd: `erd-${cardKind(r.rightCard)}`,
      style: { stroke: EDGE_COLOR, strokeWidth: 1.5 },
      labelStyle: { fill: '#cbcbcb', fontSize: 11, fontWeight: 600 },
      labelBgStyle: { fill: '#141414', fillOpacity: 0.95 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    }))

  // 팬 제한용 경계(노드 전체 박스 + 여유 패딩).
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    const { w, h } = sizes.get(n.id)!
    minX = Math.min(minX, n.position.x)
    minY = Math.min(minY, n.position.y)
    maxX = Math.max(maxX, n.position.x + w)
    maxY = Math.max(maxY, n.position.y + h)
  }
  const PAD = 360
  const bounds: Bounds = nodes.length
    ? [
        [minX - PAD, minY - PAD],
        [maxX + PAD, maxY + PAD],
      ]
    : [
        [-1000, -1000],
        [1000, 1000],
      ]
  const center = nodes.length ? { x: (minX + maxX) / 2, y: (minY + maxY) / 2 } : { x: 0, y: 0 }
  return { nodes, edges, bounds, center }
}

export function ErdDiagram({ code, className = '' }: { code: string; className?: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { nodes, edges, bounds, center } = useMemo(() => {
    const { entities, rels } = parseErDiagram(code || '')
    return buildGraph(entities, rels)
  }, [code])

  // 다른 다이어그램 프레임과 동일한 높이/라운드 + 다크 캔버스(사이트 톤 일치).
  const shell = `relative w-full overflow-hidden rounded-[16px] border border-white/[0.06] bg-[#131313] ${className}`
  const height = 'h-[clamp(360px,56vh,560px)]'

  if (!mounted) return <div className={`${shell} ${height}`} aria-hidden />
  if (nodes.length === 0)
    return (
      <div className={`${shell} ${height} flex items-center justify-center text-[13px] text-[var(--pf-fg-faint)]`}>
        ERD 정의가 비어 있습니다.
      </div>
    )

  return (
    <div className={`${shell} ${height}`}>
      <ErdMarkers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        minZoom={ERD_MIN_ZOOM}
        maxZoom={ERD_MAX_ZOOM}
        translateExtent={bounds}
        zoomOnScroll={false}
        zoomOnDoubleClick
        panOnScroll={false}
        preventScrolling={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#2a2a2a" gap={22} size={1} />
        <FlowZoomControls center={center} />
      </ReactFlow>
    </div>
  )
}

// 편집용: erDiagram 소스 textarea + 라이브 ERD 프리뷰(blur 시 커밋).
export function ErdDiagramEditor({ code, onCommit }: { code: string; onCommit: (v: string) => void }) {
  const [v, setV] = useState(code)
  useEffect(() => setV(code), [code])
  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== code && onCommit(v)}
        spellCheck={false}
        rows={Math.min(20, Math.max(8, v.split('\n').length + 1))}
        placeholder={'erDiagram\n  User ||--o{ Store : owns\n  User {\n    INT id PK\n    VARCHAR(45) email UK\n  }'}
        className="pf-mono w-full rounded-xl border border-white/10 bg-[#0f0f0f] p-3 text-[12px] leading-[1.6] text-[var(--pf-fg-dim)] outline-none focus:border-[var(--pf-ac)]"
      />
      <ErdDiagram code={code} />
    </div>
  )
}

export default ErdDiagram
