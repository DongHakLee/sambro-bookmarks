# Claude Context - Sambro Bookmarks

이 파일은 Sambro Bookmarks 프로젝트의 중요 정보를 정리해둔 것입니다. Claude가 프로젝트를 이해하고 작업할 때 참조합니다.

## 프로젝트 개요

**이름**: Sambro Bookmarks & Prompts Manager
**설명**: 개인용 북마크와 프롬프트를 관리하는 웹 애플리케이션 + 브라우저 확장

**주요 기능**:
- 📚 북마크 저장 (URL, 메타데이터 자동 추출)
- 📝 프롬프트 저장 (텍스트 선택 후 저장)
- 🏷️ 태그 및 폴더로 정리
- 🔍 전체 텍스트 검색
- 📌 중요 항목 고정 (Pin)

## 기술 스택

### Frontend
- **Framework**: React 18.3.1 + TypeScript
- **Build**: Vite 5.4.0
- **Styling**: TailwindCSS 3.4.10
- **Router**: React Router DOM 6.26.0

### Backend
- **Database**: Supabase (PostgreSQL 17)
- **Auth**: Public access (현재, 향후 RLS 적용 가능)
- **API**: Supabase REST API

### Browser Extension
- **Platform**: Chrome Extension Manifest V3
- **Permissions**: activeTab, scripting

## 프로젝트 구조

```
sambro_db/
├── web/                          # React 웹 앱
│   ├── src/
│   │   ├── components/           # React 컴포넌트
│   │   │   ├── BookmarkCard.tsx  # 북마크 카드
│   │   │   ├── AddBookmarkForm.tsx
│   │   │   ├── PromptCard.tsx    # 프롬프트 카드 (NEW)
│   │   │   ├── CreatePromptForm.tsx
│   │   │   ├── PromptList.tsx
│   │   │   ├── TagFilter.tsx
│   │   │   └── FolderSelector.tsx
│   │   ├── lib/
│   │   │   ├── supabase.ts       # Supabase 클라이언트
│   │   │   ├── prompt-types.ts   # 프롬프트 타입 (NEW)
│   │   │   └── prompts.ts        # 프롬프트 API (NEW)
│   │   └── App.tsx               # 메인 앱 (탭 네비게이션)
│   ├── package.json
│   └── vite.config.ts
│
├── extension/                    # Chrome 확장 프로그램
│   ├── manifest.json
│   ├── content.js                # 페이지 메타데이터 추출
│   └── popup/
│       ├── popup.html            # 팝업 UI (Bookmark/Prompt 탭)
│       ├── popup.js              # 저장 로직
│       └── popup.css
│
└── supabase/
    ├── schema.sql                # 북마크 테이블
    └── prompts_schema.sql        # 프롬프트 테이블 (NEW)
```

## 자주 사용하는 명령어

### 개발

```bash
# 웹 앱 개발 서버 시작
cd web
npm run dev
# http://localhost:5173

# 타입检查 + 빌드
npm run build

# 의존성 설치
npm install
```

### 배포

```bash
# Vercel 프로덕션 배포 (가장 자주 사용)
cd web
npx vercel --prod

# Vercel 프리뷰 배포
npx vercel

# 배포 로그 확인
npx vercel inspect [deployment-url] --logs
```

### Git

```bash
# GitHub 푸시 (PAT 설정 필요)
git add .
git commit -m "Your message"
git push origin main

# 충돌 발생 시
git pull --rebase origin main
# 충돌 해결 후
git rebase --continue
git push origin main
```

### 데이터베이스

```bash
# Supabase 마이그레이션은 SQL Editor에서 직접 실행
# 순서:
# 1. CREATE EXTENSION IF NOT EXISTS pg_trgm;
# 2. supabase/schema.sql 실행
# 3. supabase/prompts_schema.sql 실행
```

## 환경 변수

### Supabase 정보

**Project ID**: `sgywqmbkblvnfxlgdocr`
**Project URL**: `https://sgywqmbkblvnfxlgdocr.supabase.co`
**Region**: ap-southeast-2

**환경 변수**:
- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon/public key

**파일 위치**:
- 웹: `web/.env`
- 확장: `extension/popup/popup.js` (상단)

### GitHub

**Token**: 환경 변수 `GITHUB_TOKEN`에 저장
```bash
setx GITHUB_TOKEN "ghp_YourTokenHere"
```

**Repository**: https://github.com/DongHakLee/sambro-bookmarks

## 배포 정보

**Production URL**: https://sambro-bookmarks.vercel.app
**Vercel Project**: https://vercel.com/lee-dong-haks-projects/web

**배포 방법**:
1. **자동**: GitHub main 브랜치에 푸시 → Vercel 자동 배포
2. **수동**: `npx vercel --prod`

## 데이터베이스 스키마

### 테이블

| 테이블 | 설명 | 주요 필드 |
|--------|------|-----------|
| `bookmarks` | 북마크 | url, title, description, note, og_image, favicon_url |
| `prompts` | 프롬프트 | title, content, folder_id, is_pinned |
| `folders` | 폴더 | name, parent_id, sort_order |
| `tags` | 태그 | name (UNIQUE) |
| `prompt_tags` | 프롬프트-태그 관계 | prompt_id, tag_id |

### 뷰

| 뷰 | 설명 |
|-----|------|
| `prompts_with_details` | 프롬프트 + 폴더 + 태그 조인 |
| `tag_usage_counts` | 태그 사용 수 집계 |

## 주요 API 함수

### Bookmarks (`web/src/lib/supabase.ts`)
- `getBookmarks()` - 북마크 목록
- `createBookmark()` - 북마크 생성
- `deleteBookmark()` - 북마크 삭제
- `searchBookmarks()` - 검색

### Prompts (`web/src/lib/prompts.ts`)
- `getPrompts(query)` - 목록 (검색, 필터, 페이지네이션)
- `getPromptById(id)` - 단건 조회
- `createPrompt(request)` - 생성 (태그 자동 처리)
- `updatePrompt(id, request)` - 수정
- `deletePrompt(id)` - 삭제
- `togglePromptPin(id)` - 고정 토글
- `getTags(q?, limit)` - 태그 목록
- `getFolders(flat?)` - 폴더 목록 (트리/플랫)

## 컬러 테마

| 기능 | 프라이머리 컬러 | 그라디언트 |
|------|-----------------|-----------|
| Bookmarks | Blue | `from-blue-500 to-indigo-600` |
| Prompts | Teal | `from-emerald-500 to-teal-600` |

## 개발 참고사항

### 코드 패턴
- 함수형 컴포넌트 + Hooks 사용
- TypeScript 엄격 모드
- TailwindCSS 유틸리티 클래스
- Supabase 클라이언트 직접 사용 (REST API)

### 파일 생성 시 주의사항
- 컴포넌트: `web/src/components/`
- 타입: `web/src/lib/`
- 확장: `extension/`

### 스타일 가이드
- 카드: `bg-white rounded-xl shadow-md hover:shadow-lg`
- 그라디언트 버튼: `bg-gradient-to-r from-[color1] to-[color2]`
- 입력 필드: `border border-gray-200 rounded-xl focus:ring-2`

## 문서

- **README.md**: 프로젝트 소개, 빠른 시작
- **DEPLOYMENT.md**: 상세 배포 가이드
- **CLAUDE.md**: 이 파일 (Claude 컨텍스트)

## 문제 해결

### 빌드 오류
```bash
# 의존성 재설치
cd web
rm -rf node_modules package-lock.json
npm install
```

### 타입 오류
```bash
# 타입 검사
npx tsc --noEmit
```

### 배포 실패
1. Vercel Build Logs 확인
2. 로컬에서 빌드 테스트: `npm run build`
3. 환경 변수 확인

### Git 충돌
```bash
git pull --rebase origin main
# 충돌 해결 후
git add .
git rebase --continue
```

## 향후 개발 계획

- [ ] 사용자 인증 (Supabase Auth)
- [ ] 프롬프트 공유 기능
- [ ] 태그 자동 완성
- [ ] 다크 모드
- [ ] PWA 지원
- [ ] Firefox 확장

## 연락처

- **GitHub Issues**: https://github.com/DongHakLee/sambro-bookmarks/issues
- **Owner**: DongHakLee

---

**마지막 업데이트**: 2025-01-13
**버전**: 1.1.0 (with Prompt Management)
