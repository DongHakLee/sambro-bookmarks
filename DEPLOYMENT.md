# Deployment Guide - Sambro Bookmarks

이 가이드는 Sambro Bookmarks 프로젝트를 배포하는 방법을 설명합니다.

## 목차

1. [사전 준비](#사전-준비)
2. [데이터베이스 설정](#데이터베이스-설정)
3. [웹 앱 배포](#웹-앱-배포)
4. [브라우저 확장 배포](#브라우저-확장-배포)
5. [환경 변수 설정](#환경-변수-설정)
6. [배포 후 확인](#배포-후-확인)

---

## 사전 준비

### 필요한 계정 및 도구

- [GitHub](https://github.com) 계정
- [Vercel](https://vercel.com) 계정
- [Supabase](https://supabase.com) 계정
- Git 설치
- Node.js 18+ 설치
- Chrome 브라우저 (확장 프로그램 테스트용)

### GitHub Personal Access Token (PAT)

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" 클릭
3. 권한 체크:
   - `repo` (Full control)
   - `workflow` (GitHub Actions용)
4. 생성된 토큰을 안전한 곳에 저장 (예: 환경 변수)

```bash
# Windows: 환경 변수로 등록
setx GITHUB_TOKEN "ghp_YourTokenHere"

# 현재 세션에도 적용
set GITHUB_TOKEN=ghp_YourTokenHere
```

---

## 데이터베이스 설정

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속
2. "New Project" 클릭
3. 조직 선택 (또는 새로 생성)
4. 프로젝트 정보 입력:
   - Name: `Sambro Bookmarks`
   - Database Password: (안전한 비밀번호 저장)
   - Region: `Southeast Asia (Singapore)` 추천
5. 프로젝트 생성 대기 (약 2분)

### 2. 스키마 마이그레이션

Supabase SQL Editor에서 다음 순서로 실행:

#### Step 1: 기본 스키마 (Bookmarks)

```sql
-- supabase/schema.sql 내용 실행
```

#### Step 2: pg_trgm 확장 설치

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

#### Step 3: 프롬프트 스키마

```sql
-- supabase/prompts_schema.sql 내용 실행
```

### 3. API 정보 확인

1. Supabase 프로젝트 → Settings → API
2. 다음 정보를 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGci...`

---

## 웹 앱 배포

### 방법 1: Vercel CLI (추천)

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 루트로 이동
cd /path/to/sambro_db

# 3. Vercel 로그인 (처음만)
npx vercel login

# 4. 배포
cd web
npx vercel --prod
```

**배포 완료 후**:
- Production URL: `https://sambro-bookmarks.vercel.app`
- 또는 커스텀 도메인: Vercel 대시보드 → Settings → Domains

### 방법 2: Vercel 대시보드 (자동 배포)

#### GitHub 연동

1. Vercel 대시보드 → "Add New Project"
2. GitHub 리포지토리 import
   - `DongHakLee/sambro-bookmarks`
3. 프로젝트 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### 환경 변수 추가

Build & Development Settings → Environment Variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` |

#### 배포

- "Deploy" 버튼 클릭
- 자동으로 GitHub 푸시 시마다 배포됨

### 방법 3: 수동 Git 푸시 후 배포

```bash
# 1. 변경사항 커밋
git add .
git commit -m "Your commit message"

# 2. GitHub에 푸시 (PAT 설정 필요)
git remote set-url origin https://x-access-token:%GITHUB_TOKEN%@github.com/DongHakLee/sambro-bookmarks.git
git push origin main

# 3. Vercel에서 자동 배포 확인
# https://vercel.com/donghaklee/sambro-bookmarks/deployments
```

---

## 브라우저 확장 배포

### 개발자 모드로 테스트

1. Chrome 브라우저 열기
2. `chrome://extensions/` 접속
3. 우측 상단 "Developer mode" 활성화
4. "Load unpacked" 클릭
5. `extension` 폴더 선택
6. 확장 프로그램 아이콘이 툴바에 나타남

### Supabase 정보 업데이트

`extension/popup/popup.js` 파일 상단:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...';
```

### 테스트

1. 웹페이지에서 텍스트 선택
2. 확장 프로그램 아이콘 클릭
3. **Prompt** 탭 선택
4. 선택된 텍스트가 자동으로 입력됨
5. 제목 수정 후 "Save Prompt" 클릭
6. https://sambro-bookmarks.vercel.app 접속 → Prompts 탭에서 확인

### Chrome Web Store에 배포 (추후)

준비물:
- `extension` 폴더를 zip으로 압축
- Chrome Web Store Developer 계정 ($5 비용)
- 아이콘 (128x128.png)
- 스크린샷
- 설명

---

## 환경 변수 설정

### 로컬 개발용 (.env)

`web/.env` 파일 생성:

```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Vercel 환경 변수

Vercel 대시보드 → Project → Settings → Environment Variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Production, Preview, Development |

---

## 배포 후 확인

### 1. 웹 앱 확인

https://sambro-bookmarks.vercel.app 접속 후:

- [ ] **Bookmark** 탭: 북마크 목록 표시
- [ ] **Prompt** 탭: 프롬프트 관리 화면
- [ ] 검색 기능 작동
- [ ] 새 프롬프트 생성 가능
- [ ] 태그 추가 가능
- [ ] 고정 (Pin) 기능 작동

### 2. 브라우저 확장 확인

- [ ] 텍스트 선택 후 확장 프로그램 열기
- [ ] **Prompt** 탭에서 선택된 텍스트 표시
- [ ] 저장 후 웹 앱에서 확인
- [ ] **Bookmark** 탭에서 북마크 저장 작동

### 3. 데이터베이스 확인

Supabase Table Editor에서:

```sql
-- 테이블 확인
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 프롬프트 데이터 확인
SELECT * FROM prompts_with_details LIMIT 5;

-- 태그 사용 현황
SELECT * FROM tag_usage_counts;
```

---

## 문제 해결

### Git 푸시 권한 오류

**오류**: `Permission denied` 또는 `403`

**해결**:
```bash
# PAT 재설정
git remote set-url origin https://x-access-token:%GITHUB_TOKEN%@github.com/DongHakLee/sambro-bookmarks.git
git push origin main
```

### Vercel 배포 실패

**오류**: Build 실패

**해결**:
1. 로컬에서 빌드 테스트:
   ```bash
   cd web
   npm run build
   ```
2. 타입스크립트 오류 확인
3. Vercel Build Logs 확인

### Supabase 연결 오류

**오류**: `CORS policy` 또는 `Invalid API Key`

**해결**:
1. Supabase RLS 정책 확인
2. API URL 및 키 재확인
3. 브라우저 콘솔에서 상세 오류 메시지 확인

### 확장 프로그램 작동 안 함

**해결**:
1. `popup.js`의 Supabase URL/Key 확인
2. `chrome://extensions/`에서 확장 프로그램 재로드
3. 오류: 확장 프로그램 팝�업에서 "Inspect" 클릭

---

## 자주 묻는 질문

### Q: 자동 배포는 어떻게 작동하나요?

A: Vercel이 GitHub 리포지토리를 모니터링합니다. `main` 브랜치에 푸시하면 자동으로 배포됩니다.

### Q: 배포에 얼마나 걸리나요?

A: 일반적으로 1-2분 소요됩니다. 캐시가 있으면 30초 내에 완료됩니다.

### Q: 데이터베이스 마이그레이션은 어떻게 하나요?

A: Supabase SQL Editor에서 직접 실행하거나, Supabase CLI를 사용하여 자동화할 수 있습니다.

### Q: 커스텀 도메인은 어떻게 설정하나요?

A: Vercel 대시보드 → Settings → Domains → Add Domain

---

## 유용한 링크

- **Vercel 대시보드**: https://vercel.com/donghaklee/sambro-bookmarks
- **배포 현황**: https://vercel.com/donghaklee/sambro-bookmarks/deployments
- **Supabase 프로젝트**: https://supabase.com/dashboard/project/xxxxx
- **GitHub 리포지토리**: https://github.com/DongHakLee/sambro-bookmarks

---

## 업데이트 내역

| 날짜 | 변경 사항 |
|------|-----------|
| 2025-01-13 | 프롬프트 관리 기능 추가, 배포 가이드 작성 |

---

**문의사항**은 GitHub Issues에서 남겨주세요.
