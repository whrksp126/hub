---
name: portfolio-diagrams
description: >-
  포트폴리오 프로젝트 상세의 "다이어그램" 섹션을 작성한다. 아키텍처/흐름은 mermaid
  flowchart·sequenceDiagram(다크 테마 + @accent/@icon 토큰), 데이터 모델은 erDiagram
  텍스트로 작성하면 MySQL Workbench 스타일 ERD(React Flow)로 렌더된다. 텍스트 한 벌로
  편집/공개가 동일하게 그려지므로 다른 프로젝트·에이전트가 그대로 재사용한다.
argument-hint: "[diagram-type]"
---

# 포트폴리오 다이어그램 작성 스킬

프로젝트 상세 섹션의 시각화를 **텍스트(mermaid 문법)** 로 작성한다. 렌더러가 종류를 보고
자동으로 알맞은 스타일을 입힌다. 작성 위치: 프로젝트 `sections[]`의 한 항목.

| 섹션 kind | 입력(body) | 렌더 | 용도 |
|-----------|-----------|------|------|
| `diagram` | mermaid `graph`/`flowchart`/`sequenceDiagram` | 다크 테마 mermaid (`mermaid-diagram.tsx`) | 아키텍처·요청 흐름 |
| `erd` | mermaid `erDiagram` | Workbench 스타일 React Flow (`erd-diagram.tsx`) | 데이터 모델 |

`bullets[]`는 두 종류 모두 다이어그램 하단의 캡션/설명으로 렌더된다.

## 1) 아키텍처·시퀀스 — kind `diagram`

mermaid 표준 문법 + 두 가지 확장 토큰:

- `@accent` → 프로필 강조색(hex)으로 치환. classDef의 stroke 등에 사용해 테마와 통일.
- `@icon:<name>` → 노드 라벨 안에 인라인 lucide 라인 아이콘(SVG) 삽입. **이모지 금지, 아이콘만.**
  - 사용 가능 name: `smartphone monitor card cloud server database radio box shield zap globe`
  - 새 아이콘이 필요하면 `mermaid-diagram.tsx`의 `ICON_PATHS`에 path를 추가.

예:
```
graph TD
  classDef app fill:#2c1710,stroke:@accent,stroke-width:2px,color:#ffd9c9
  QR["@icon:smartphone 손님 휴대폰"] --> NGINX["@icon:shield nginx"]
  NGINX --> FLASK["@icon:server Flask"]:::app
  FLASK --> DB[("@icon:database MySQL")]
```
시퀀스는 `sequenceDiagram ...` 그대로(다크 테마 자동).

## 2) 데이터 모델 — kind `erd`

mermaid `erDiagram` 문법으로 작성하면 **MySQL Workbench 룩**(헤더바+테이블 아이콘, 컬럼별 키
아이콘, `Indexes` 풋터, crow's-foot 관계선)으로 렌더된다. dagre가 자동 배치, 팬/줌 가능.

문법:
- 관계: `EntityA <card>--<card> EntityB : label`
  - 카디널리티 토큰: `||`(정확히 1) · `|o`/`o|`(0 또는 1) · `}o`/`o{`(0 이상) · `}|`/`|{`(1 이상)
- 엔티티 컬럼: `엔티티 { ... }` 블록 안에 한 줄당 `TYPE name [KEY]`
  - `KEY` ∈ `PK`(금색 키) · `FK`(빨강 다이아) · `UK`(파랑 다이아) · 생략(일반)
  - **TYPE은 Workbench식 표기 권장**: `INT(11)`, `VARCHAR(45)`, `BIGINT`, `DATETIME`, `TEXT`, `TINYINT(1)` …
    (타입 토큰에 공백을 넣지 말 것 — `VARCHAR(45)` O, `VARCHAR (45)` X)

예:
```
erDiagram
  User ||--o{ Post : writes
  Post ||--o{ Comment : has
  User {
    INT(11) id PK
    VARCHAR(45) email UK
    VARCHAR(100) password
    DATETIME created_at
  }
  Post {
    INT(11) id PK
    INT(11) user_id FK
    VARCHAR(200) title
    TEXT body
  }
```

## 주의

- 한 텍스트가 편집기 미리보기와 공개 렌더에 동일하게 쓰인다(편집=결과).
- ERD는 클라이언트(canvas)에서만 그려지므로, 데이터 모델 설명은 별도 `features`/`specs` 섹션에
  텍스트로도 두면 크롤러/AEO에 유리하다(현재 OrderAndGo는 `데이터 모델 설계` features 섹션 병행).
- 이모지를 라벨/노드/관계 어디에도 쓰지 않는다. 아이콘은 lucide SVG(`@icon:`)만.
