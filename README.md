# Custom Video Player

Reusable custom video player built as an independent React package with a monorepo structure.

## Project Structure

```
videoplayer/
├── packages/player/       # @videoplayer/core - standalone video player package
├── apps/web/              # Demo app (video list, player page, CMS)
└── apps/server/           # CMS server (Express + Prisma + SQLite)
```

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Python** 3.9+ (자막 자동 생성/번역 기능 사용 시)
- **ffmpeg** (Whisper 자막 추출 시 필요)

## Quick Start

### 1. 프로젝트 설치

```bash
git clone <repo-url>
cd videoplayer
npm install
```

### 2. 웹 앱 실행 (Mock 모드)

외부 서버 없이 목업 데이터로 바로 실행:

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 3. CMS 서버 + 웹 앱 실행 (Custom 모드)

자막 자동 생성, 번역, 파일 업로드 등 전체 기능 사용:

#### 3-1. 데이터베이스 초기화 (최초 1회)

```bash
cd apps/server
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name init
DATABASE_URL="file:./dev.db" npx prisma generate
```

#### 3-2. CMS 서버 실행

```bash
cd apps/server
DATABASE_URL="file:./dev.db" npx tsx src/index.ts
```

서버가 `http://localhost:4000` 에서 실행됩니다.

#### 3-3. 웹 앱 실행 (Custom 모드)

새 터미널에서:

```bash
cd apps/web
VITE_API_MODE=custom VITE_SERVER_URL=http://localhost:4000 npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 자막 자동 생성 (Whisper) 설정

동영상에서 음성을 인식하여 자동으로 자막(.vtt)을 생성합니다.

### Python 패키지 설치

```bash
pip3 install openai-whisper
```

### ffmpeg 설치

**macOS:**

```bash
brew install ffmpeg
```

**Ubuntu/Debian:**

```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**

[ffmpeg 공식 사이트](https://ffmpeg.org/download.html)에서 다운로드 후 PATH에 추가

### 설치 확인

```bash
python3 -c "import whisper; print('Whisper OK')"
ffmpeg -version
```

### 사용 방법

1. CMS 페이지(`/cms`)에서 동영상 파일을 업로드
2. 업로드 완료 시 자동으로 자막 생성 시작
3. "자막 생성 중..." 상태 표시 → 완료 시 자막 언어 배지 표시

> Whisper 모델은 기본 `base`를 사용합니다. 더 높은 정확도가 필요하면 `apps/server/src/services/transcribe.ts`에서 모델을 `medium` 또는 `large-v3`로 변경할 수 있습니다.

---

## 자막 자동 번역 (Argos Translate) 설정

생성된 자막을 다른 언어로 자동 번역합니다. 현재 한국어, 영어, 스페인어, 일본어를 지원하며 확장 가능합니다.

### Python 패키지 설치

```bash
pip3 install argostranslate
```

### 설치 확인

```bash
python3 -c "import argostranslate; print('Argos Translate OK')"
```

### 사용 방법

1. 자막이 생성 완료된 동영상에서 **"+ 번역"** 버튼 클릭
2. 번역할 언어 선택 (한국어/English/Español/日本語)
3. "번역 중..." 상태 표시 → 완료 시 새 자막 배지 추가

> 첫 번역 시 해당 언어 패키지를 자동 다운로드하므로 시간이 다소 소요될 수 있습니다.

### 지원 언어 추가

`apps/server/src/services/languages.ts`에서 `SUPPORTED_LANGUAGES` 배열에 언어를 추가하면 됩니다:

```typescript
{ code: 'fr', label: 'French', nativeLabel: 'Français' },
```

---

## 자막 다운로드

CMS 페이지에서 각 자막 배지 옆의 **↓** 버튼을 클릭하면 `.vtt` 파일이 다운로드 폴더에 저장됩니다.

---

## 전체 의존성 요약

| 구분 | 패키지 | 용도 | 필수 여부 |
|------|--------|------|----------|
| Node.js | npm install | 프로젝트 전체 | 필수 |
| Python | openai-whisper | 자막 자동 생성 (STT) | 자막 기능 사용 시 |
| Python | argostranslate | 자막 자동 번역 | 번역 기능 사용 시 |
| System | ffmpeg | 동영상 오디오 추출 | 자막 기능 사용 시 |

### 한 번에 모두 설치

```bash
# Node.js 의존성
npm install

# Python 의존성
pip3 install openai-whisper argostranslate

# ffmpeg (macOS)
brew install ffmpeg

# DB 초기화
cd apps/server
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name init
DATABASE_URL="file:./dev.db" npx prisma generate
```

---

## Scripts

### Root

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 웹 앱 개발 서버 실행 |
| `npm run build` | player 패키지 + 웹 앱 빌드 |
| `npm test` | 전체 테스트 실행 |
| `npm run test:watch` | 테스트 watch 모드 |

### Server (`apps/server`)

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (watch 모드) |
| `npm test` | 서버 테스트 실행 |
| `npm run db:migrate` | Prisma 마이그레이션 |
| `npm run db:generate` | Prisma 클라이언트 생성 |
| `npm run db:studio` | Prisma Studio (DB GUI) |

---

## API Mode

웹 앱은 3가지 API 모드를 지원합니다:

| 모드 | 환경변수 | 설명 |
|------|---------|------|
| `mock` | 기본값 | 목업 데이터, 서버 불필요 |
| `custom` | `VITE_API_MODE=custom` | 자체 CMS 서버 (Express + SQLite) |
| `strapi` | `VITE_API_MODE=strapi` | Strapi v5 CMS 연동 |

---

## Player Package 사용법

다른 프로젝트에서 독립적으로 사용 가능:

```bash
npm install @videoplayer/core
```

```tsx
import { VideoPlayer } from '@videoplayer/core';
import '@videoplayer/core/style.css';

<VideoPlayer
  src="https://example.com/video.mp4"
  subtitles={[
    { label: '한국어', language: 'ko', src: '/subs/ko.vtt' },
    { label: 'English', language: 'en', src: '/subs/en.vtt' },
  ]}
/>
```

---

## Troubleshooting

### Whisper SSL 인증서 오류 (macOS)

```bash
/Applications/Python\ 3.13/Install\ Certificates.command
```

### Prisma 버전 충돌

글로벌 prisma 대신 로컬 버전 사용:

```bash
cd apps/server
npx prisma migrate dev
```

### 자막이 플레이어에 표시되지 않음

`<video>` 태그에 `crossOrigin="anonymous"` 속성이 필요합니다. player 패키지에 이미 적용되어 있습니다. 서버의 CORS 설정도 확인하세요.

### 서버 변경 후 반영 안 됨

서버 코드 수정 후에는 서버를 재시작해야 합니다 (`Ctrl+C` → 다시 실행).
