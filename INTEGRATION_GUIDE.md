# @videoplayer/core Integration Guide

다른 프로젝트에서 커스텀 비디오 플레이어를 그대로 사용하기 위한 통합 가이드입니다.

---

## 1. 요구 사항

- React 18 또는 19
- TypeScript (권장)

## 2. 설치

### npm registry에 배포된 경우

```bash
npm install @videoplayer/core
```

### 로컬 패키지로 사용하는 경우

1. `packages/player` 디렉토리를 프로젝트에 복사합니다.
2. 빌드합니다:

```bash
cd packages/player
npm install
npm run build
```

3. 사용할 프로젝트에서 로컬 경로로 설치합니다:

```bash
npm install ./path/to/packages/player
```

### npm workspaces 모노레포에서 사용하는 경우

루트 `package.json`:

```json
{
  "workspaces": ["packages/*", "apps/*"]
}
```

앱의 `package.json`:

```json
{
  "dependencies": {
    "@videoplayer/core": "*"
  }
}
```

---

## 3. CSS 임포트

플레이어의 스타일을 반드시 임포트해야 합니다. 앱의 진입점(entry point)에 추가하세요:

```tsx
import '@videoplayer/core/styles.css';
```

> Tailwind, CSS-in-JS 등 어떤 스타일 시스템을 사용하든 관계없이 동작합니다. 플레이어는 CSS Modules로 구현되어 있어 클래스명 충돌이 없습니다.

---

## 4. 기본 사용법

```tsx
import { VideoPlayer } from '@videoplayer/core';
import '@videoplayer/core/styles.css';

function App() {
  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      poster="https://example.com/poster.jpg"
    />
  );
}
```

---

## 5. 자막 사용

WebVTT(`.vtt`) 파일을 준비하고 `subtitles` prop으로 전달합니다:

```tsx
import { VideoPlayer } from '@videoplayer/core';
import type { Subtitle } from '@videoplayer/core';

const subtitles: Subtitle[] = [
  { id: 'sub-ko', label: '한국어', language: 'ko', src: '/subs/ko.vtt' },
  { id: 'sub-en', label: 'English', language: 'en', src: '/subs/en.vtt' },
];

function App() {
  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      subtitles={subtitles}
    />
  );
}
```

### WebVTT 파일 예시 (`/public/subs/ko.vtt`)

```
WEBVTT

00:00:01.000 --> 00:00:04.000
안녕하세요, 영상에 오신 것을 환영합니다.

00:00:05.000 --> 00:00:08.000
이 영상은 자막 테스트용입니다.
```

설정 메뉴에서 자막 언어를 선택하거나, 키보드 `C` 키로 자막을 순환 전환할 수 있습니다.

---

## 6. Props

### `VideoPlayerProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `src` | `string` | Yes | - | 동영상 URL |
| `poster` | `string` | No | - | 포스터 이미지 URL |
| `subtitles` | `Subtitle[]` | No | `[]` | 자막 목록 |
| `autoPlay` | `boolean` | No | `false` | 자동 재생 |
| `className` | `string` | No | - | 컨테이너에 추가할 CSS 클래스 |

### `Subtitle`

```ts
interface Subtitle {
  id: string;        // 고유 식별자
  label: string;     // 표시 이름 (예: "한국어", "English")
  language: string;  // 언어 코드 (예: "ko", "en")
  src: string;       // .vtt 파일 경로
}
```

### `Video`

데이터 모델로 사용할 수 있는 타입입니다:

```ts
interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;        // 초 단위
  subtitles: Subtitle[];
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

---

## 7. 키보드 단축키

플레이어 영역에 포커스된 상태에서 사용 가능합니다. 한국어 IME가 활성화된 상태에서도 동작합니다.

| Key | Action |
|-----|--------|
| `Space` | 재생 / 일시정지 |
| `←` | 10초 뒤로 |
| `→` | 10초 앞으로 |
| `↑` | 볼륨 높이기 |
| `↓` | 볼륨 낮추기 |
| `F` | 전체 화면 토글 |
| `M` | 음소거 토글 |
| `C` | 자막 전환 |
| `?` | 단축키 가이드 표시 |

---

## 8. 제공되는 Hooks

커스텀 UI를 직접 구성하고 싶은 경우 개별 Hook을 사용할 수 있습니다:

### `useVideoPlayer()`

플레이어의 전체 상태와 제어 함수를 반환합니다:

```tsx
import { useVideoPlayer } from '@videoplayer/core';

function CustomPlayer() {
  const {
    videoRef,          // React ref - <video> 요소에 연결
    state,             // PlaybackState 객체
    togglePlay,        // 재생/일시정지 토글
    seek,              // seek(timeInSeconds)
    skip,              // skip(seconds) - 양수: 앞으로, 음수: 뒤로
    handleTimeUpdate,  // 비디오 timeupdate 이벤트 핸들러
    handleLoadedMetadata, // 비디오 loadedmetadata 이벤트 핸들러
    setVolume,         // setVolume(0~1)
    toggleMute,        // 음소거 토글
    setPlaybackSpeed,  // setPlaybackSpeed(0.5~2.0)
    setActiveSubtitle, // setActiveSubtitle(languageCode | null)
  } = useVideoPlayer();

  return (
    <div>
      <video ref={videoRef} src="/video.mp4" />
      <button onClick={togglePlay}>
        {state.isPlaying ? 'Pause' : 'Play'}
      </button>
      <span>{state.currentTime} / {state.duration}</span>
    </div>
  );
}
```

### `PlaybackState`

```ts
interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;     // 초 단위
  duration: number;        // 초 단위
  buffered: number;        // 버퍼링된 비율
  volume: number;          // 0~1
  isMuted: boolean;
  playbackSpeed: number;   // 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2
  isFullscreen: boolean;
  subtitlesEnabled: boolean;
  activeSubtitleId: string | null;  // 활성 자막 언어 코드
}
```

### `useFullscreen(containerRef)`

```tsx
import { useFullscreen } from '@videoplayer/core';

const containerRef = useRef<HTMLDivElement>(null);
const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);
```

### `useKeyboardShortcuts(containerRef, actions)`

```tsx
import { useKeyboardShortcuts } from '@videoplayer/core';

useKeyboardShortcuts(containerRef, {
  togglePlay,
  skip,
  setVolume,
  toggleMute,
  toggleFullscreen,
  toggleSubtitles,   // optional
  toggleGuide,       // optional
  volume: state.volume,
});
```

### `useControlsVisibility({ isPlaying, isTouchDevice })`

마우스 호버 시 컨트롤 표시, 3초 후 자동 숨김:

```tsx
import { useControlsVisibility } from '@videoplayer/core';

const { visible, onPointerMove, onPointerLeave, onContainerClick } =
  useControlsVisibility({ isPlaying: state.isPlaying, isTouchDevice: false });
```

### `useMediaQuery(query)`

```tsx
import { useMediaQuery } from '@videoplayer/core';

const isTouchDevice = useMediaQuery('(pointer: coarse)');
```

### `useDoubleTap({ onDoubleTapLeft, onDoubleTapRight, onSingleTap, enabled })`

모바일 더블탭으로 10초 건너뛰기:

```tsx
import { useDoubleTap } from '@videoplayer/core';

const { ripple, handleTap } = useDoubleTap({
  onDoubleTapLeft: () => skip(-10),
  onDoubleTapRight: () => skip(10),
  onSingleTap: () => {},
  enabled: true,
});
```

---

## 9. 유틸리티

### `formatTime(seconds)`

```tsx
import { formatTime } from '@videoplayer/core';

formatTime(65);    // "1:05"
formatTime(3661);  // "1:01:01"
formatTime(0);     // "0:00"
```

---

## 10. ErrorBoundary

플레이어 컴포넌트는 내부적으로 `ErrorBoundary`로 감싸져 있어, 렌더링 에러 발생 시 자동으로 fallback UI를 표시합니다. 별도로 감쌀 필요 없습니다.

직접 사용하려면:

```tsx
import { ErrorBoundary } from '@videoplayer/core';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

---

## 11. 기능 목록

### 재생 컨트롤
- 재생/일시정지
- 10초 앞/뒤로 건너뛰기
- 프로그레스 바 클릭으로 탐색
- 프로그레스 바 호버 시 시간 툴팁

### 볼륨
- 볼륨 슬라이더 (데스크톱: 호버 시 확장)
- 음소거/해제 버튼
- 3단계 볼륨 아이콘 (음소거/낮음/높음)

### 재생 속도
- 설정 메뉴에서 7단계 선택 (0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x)

### 자막
- WebVTT 형식 지원
- 설정 메뉴에서 언어 선택 / 끄기
- `C` 키로 자막 순환 전환

### 전체 화면
- 컨테이너 div 기반 전체 화면 (커스텀 컨트롤 유지)

### 반응형
- 데스크톱: 마우스 호버로 컨트롤 표시/숨김
- 모바일: 탭으로 컨트롤 토글, 더블탭으로 10초 건너뛰기
- 모바일: 44px 터치 타겟, 볼륨 슬라이더 숨김, 설정 바텀시트

### 상태 표시
- 버퍼링 스피너
- 에러 오버레이 + 재시도 버튼
- ErrorBoundary fallback UI

### 키보드 단축키
- 한국어 IME 호환 (e.code 기반 매칭)
- `?` 키로 단축키 가이드 오버레이

---

## 12. 전체 사용 예시

```tsx
import { VideoPlayer } from '@videoplayer/core';
import type { Video } from '@videoplayer/core';
import '@videoplayer/core/styles.css';

const video: Video = {
  id: '1',
  title: 'Big Buck Bunny',
  description: 'A short animated film by the Blender Institute.',
  thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg',
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  duration: 596,
  subtitles: [
    { id: 'sub-ko', label: '한국어', language: 'ko', src: '/subs/ko.vtt' },
    { id: 'sub-en', label: 'English', language: 'en', src: '/subs/en.vtt' },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export default function VideoPage() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <VideoPlayer
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        subtitles={video.subtitles}
      />
      <h1>{video.title}</h1>
      <p>{video.description}</p>
    </div>
  );
}
```

---

## 13. 빌드 출력물

`npm run build` 실행 시 `dist/` 디렉토리에 생성:

| File | Format | Size |
|------|--------|------|
| `videoplayer-core.js` | ESM | 27.50 KB |
| `videoplayer-core.umd.cjs` | UMD | 21.25 KB |
| `videoplayer-core.css` | CSS | 8.35 KB |
| `index.d.ts` | TypeScript 선언 | - |

### package.json exports

```json
{
  "exports": {
    ".": {
      "import": "./dist/videoplayer-core.js",
      "require": "./dist/videoplayer-core.umd.cjs",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/videoplayer-core.css"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

외부 의존성은 `react`와 `react-dom`만 필요합니다. 다른 라이브러리 의존성은 없습니다.

---

## 14. 빌드 설정 (Vite Library Mode)

다른 프로젝트에서 동일한 빌드 환경을 구성하려면:

### `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({ tsconfigPath: './tsconfig.json' }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VideoPlayerCore',
      fileName: 'videoplayer-core',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
    cssCodeSplit: false,
  },
});
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "emitDeclarationOnly": true,
    "declarationDir": "./dist"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]
}
```

### 필요한 devDependencies

```json
{
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.1",
    "vite": "^8.0.3",
    "vite-plugin-dts": "^4.5.4",
    "typescript": "^6.0.2"
  }
}
```
