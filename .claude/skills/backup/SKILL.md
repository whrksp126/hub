---
name: backup
description: >-
  hub.ghmate.com 데이터 백업/복원. SQLite DB(WAL 체크포인트 후 파일 복사 또는
  Litestream)와 MinIO(버킷 hub, media/ prefix) 객체를 안전하게 백업하고 복원 절차를 안내한다.
argument-hint: "[backup|restore]"
---

# 데이터 백업 / 복원

이 사이트의 상태는 두 곳에 있다: **SQLite DB**(콘텐츠/메타) + **MinIO 버킷 `hub`의 `media/`**(이미지/업로드).
둘 다 백업해야 완전 복구가 된다.

## SQLite 백업
- WAL 모드이므로 단순 파일 복사 전에 체크포인트가 안전하다.
- 권장: `sqlite3 data/<db>.db "PRAGMA wal_checkpoint(TRUNCATE);"` 후 `data/<db>.db` 복사,
  또는 핫백업 `sqlite3 data/<db>.db ".backup '/backup/hub-$(date +%F).db'"`.
- 연속 백업이 필요하면 **Litestream**으로 MinIO에 실시간 복제(별도 컨테이너/사이드카).

## MinIO 백업
- 이미지는 이미 MinIO에 영속. 별도 보관처가 필요하면 `mc mirror`로 다른 버킷/오프사이트에 복제.
- objectstore 운영은 글로벌 `objectstore` 스킬/엔드포인트(`objectstore.ghmate.com`, path-style)를 따른다.

## 복원
1. 컨테이너 정지 → `data/`에 백업 DB 파일 복원(같은 파일명) → WAL/SHM 잔여 파일 제거.
2. MinIO 버킷을 백업에서 복원(`mc mirror` 역방향).
3. `docker compose up -d --force-recreate app` 로 기동 → `/studio`·공개 페이지 확인.

## 주의
- `.env`·시크릿은 백업물에 평문 포함되지 않게 분리 보관. 백업 파일 권한 최소화.
- 복원 후 슬러그/미디어 relation 깨짐 여부를 샘플 점검.
