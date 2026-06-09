import { revalidatePath } from 'next/cache'

// 컬렉션 훅에서 호출. 시드 스크립트 등 next 렌더 컨텍스트 밖에서 호출돼도 안전.
export function safeRevalidate(...paths: (string | null | undefined)[]) {
  for (const path of paths) {
    if (!path) continue
    try {
      revalidatePath(path)
    } catch {
      /* next 컨텍스트 밖(시드/CLI) — 무시 */
    }
  }
}
