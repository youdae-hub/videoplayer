# Progress

## Current Status: Post-MVP Improvements

## Test Results
- 38 test files, 238 tests passing
- Hooks: useVideoPlayer (17), useMediaQuery (4), useFullscreen (5), useControlsVisibility (10), useKeyboardShortcuts (13), useDoubleTap (6)
- Utils: formatTime (9)
- Components: TimeDisplay (3), PlayPauseButton (3), SkipButton (3), ProgressBar (4), VolumeControl (7), FullscreenButton (3), PlaybackSpeedSelector (3), SubtitleToggle (4), SettingsMenu (6), VideoPlayer (11), BufferingIndicator (3), ErrorOverlay (4), DoubleTapOverlay (4), ProgressBarTooltip (4), ErrorBoundary (5), SubtitleSelector (7), KeyboardGuide (5)
- Utils: videoFileProcessor (6)
- Services: apiClient (7), mockVideoService (9), strapiVideoService (4), createVideoService (2)
- Pages: CmsPage (11), VideoListPage (8), VideoPlayerPage (5), VideoListGrid (5), VideoCard (7)
- Components: ViewModeToggle (5), VideoPlayerModal (7), ConfirmDialog (6), VideoFormModal (12)

## Build Output
- ESM: 27.50KB | UMD: 21.25KB | CSS: 8.35KB

## Phase History

### Phase 0: Planning & Setup (2026-03-27)
- [x] Requirements analysis
- [x] Tech stack decision: React 19 + TypeScript + Vite + Tailwind
- [x] Architecture design: npm workspaces monorepo
- [x] Package separation: `packages/player` (independent) + `apps/web` (demo app)
- [x] MVP phase breakdown (5 phases)
- [x] CLAUDE.md, plan.md, progress.md created

### Phase 1: Project Setup + Basic Player (2026-03-27) ✅
- [x] npm workspaces monorepo setup (root, packages/player, apps/web)
- [x] Vite + TypeScript + Tailwind config (apps/web)
- [x] Vite library mode config (packages/player) - builds ESM + UMD
- [x] Vitest + React Testing Library setup with jsdom
- [x] Core types: Video, Subtitle, PlaybackState, VideoPlayerProps
- [x] `useVideoPlayer` hook with useReducer (play, pause, seek, skip, time update, volume, mute, speed)
- [x] Components: VideoPlayer, ControlBar, PlayPauseButton, SkipButton, ProgressBar, TimeDisplay
- [x] CSS Modules dark theme styling (red accent, gradient overlay)
- [x] `formatTime` utility (MM:SS and H:MM:SS)
- [x] Public API export via packages/player/src/index.ts
- [x] Demo page in apps/web with Big Buck Bunny test video

### Phase 2: Advanced Controls (2026-03-27) ✅
- [x] `useMediaQuery` hook - window.matchMedia wrapper for touch detection
- [x] `useFullscreen` hook - Fullscreen API on container div (keeps custom controls)
- [x] `useControlsVisibility` hook - desktop hover/3s hide, mobile tap toggle, always visible when paused
- [x] VolumeControl - 3-state icon (muted/low/high), expandable slider on hover
- [x] FullscreenButton - enter/exit toggle with SVG icons
- [x] PlaybackSpeedSelector - 7 speed options (0.5x~2x) with active highlight
- [x] SubtitleToggle - on/off switch with toggle animation
- [x] SettingsMenu - gear icon dropdown with speed + subtitle controls, outside click to close
- [x] ControlBar layout updated - 2-row (progress top, controls bottom)
- [x] Responsive CSS - mobile: 44px touch targets, hidden volume slider, bottom sheet settings
- [x] Public API exports updated with new hooks

### Phase 3: Video List Page + Routing (2026-03-27) ✅
- [x] React Router v6 routing (/, /video/:id, /cms)
- [x] VideoService interface + mock data service (6 videos, 300ms delay)
- [x] Header (sticky, dark theme) + PageLayout
- [x] VideoCard (thumbnail, duration badge, hover scale) + VideoListGrid (responsive grid)
- [x] SkeletonGrid loading component (animate-pulse)
- [x] VideoListPage (fetch + skeleton → grid)
- [x] VideoPlayerPage (fetch by id + back link + video info)
- [x] CmsPage placeholder (table stub)
- [x] App.tsx routing with BrowserRouter

### Phase 4: CMS Integration Layer (2026-03-27) ✅
- [x] `apiClient.ts` - fetch wrapper with base URL, error handling
- [x] Renamed `videoService.ts` → `mockVideoService.ts`
- [x] `strapiVideoService.ts` - Strapi REST API with response transformation
- [x] `createVideoService.ts` - factory pattern with `VITE_API_MODE` env var switching
- [x] Updated page imports (VideoListPage, VideoPlayerPage) to use service factory
- [x] Expanded CmsPage - video table with thumbnails, duration, subtitles, actions (edit/delete)
- [x] `.env.example` with `VITE_API_MODE` and `VITE_STRAPI_URL` configuration
- [x] Tests: apiClient (4), mockVideoService (5), strapiVideoService (4), createVideoService (2), CmsPage (5)
- [x] Vite library build verified (ESM 16.6KB, UMD 13KB, CSS 4.35KB)

### Phase 5: Polish + Accessibility (2026-03-27) ✅
- [x] `useKeyboardShortcuts` hook - Space, Arrow keys, f, m, c shortcuts with input field exclusion
- [x] `useDoubleTap` hook - 300ms double-tap detection with left/right side split
- [x] DoubleTapOverlay - ripple animation + skip text (« 10s / 10s »)
- [x] BufferingIndicator - spinner overlay on video `waiting` event
- [x] ErrorOverlay - error message + retry button on video `error` event
- [x] ProgressBarTooltip - hover time preview with position clamping
- [x] ErrorBoundary - React class component with fallback UI and reset
- [x] CSS animations: settings slide-up, ripple expand, spinner, button scale on press
- [x] ARIA: `role="region"` on player, `aria-expanded`/`aria-haspopup` on settings, `role="menu"`, `role="alert"` on errors
- [x] `tabIndex={0}` on player container for keyboard focus, `focus-visible` outline
- [x] Mobile: double-tap to skip replaces single tap for controls toggle
- [x] Tests: useKeyboardShortcuts (9), useDoubleTap (6), BufferingIndicator (3), ErrorOverlay (4), DoubleTapOverlay (4), ProgressBarTooltip (4), ErrorBoundary (5)

### Post-MVP: Subtitle & Keyboard Improvements (2026-03-27)
- [x] Subtitle language selector (replace on/off toggle with language list)
- [x] SubtitleSelector component with Off + language options
- [x] textTracks API integration for subtitle switching
- [x] WebVTT subtitle files (Korean, English) for Big Buck Bunny
- [x] Fix keyboard shortcuts f/m/c for Korean IME (e.key → e.code for letter keys)
- [x] KeyboardGuide overlay component (? key or button to toggle)
- [x] Keyboard guide button in ControlBar
- [x] Korean IME test cases (ㄹ→KeyF, ㅡ→KeyM, ㅊ→KeyC)

### Post-MVP: A/B Test - Video Player Launch Mode (2026-03-27)
- [x] ViewModeToggle component (페이지 이동 / 레이어 재생 radio toggle)
- [x] VideoPlayerModal component (overlay player with ESC/click-outside close, scroll lock)
- [x] VideoCard dual mode (Link for page mode, button for modal mode)
- [x] VideoListGrid onVideoSelect prop passthrough
- [x] VideoListPage view mode state with localStorage persistence
- [x] Tests: ViewModeToggle (5), VideoPlayerModal (7), VideoCard (7), VideoListGrid (5), VideoListPage (8)

### Post-MVP: CMS CRUD (2026-03-30)
- [x] apiClient: post, put, delete methods added
- [x] VideoService interface: createVideo, updateVideo, deleteVideo
- [x] mockVideoService: in-memory CUD with resetMockData for tests
- [x] strapiVideoService: Strapi REST API CUD integration
- [x] VideoFormModal: add/edit form with subtitle management, validation
- [x] ConfirmDialog: delete confirmation with loading state
- [x] CmsPage: full CRUD integration (add button, edit/delete per row, modals)
- [x] Tests: apiClient (7), mockVideoService (9), CmsPage (11), VideoFormModal (8), ConfirmDialog (6)

### Post-MVP: Video File Upload with Auto Thumbnail/Duration (2026-03-30)
- [x] videoFileProcessor: createObjectURL, canvas thumbnail capture, duration extraction
- [x] VideoFormModal: file upload mode with auto-fill (title, URL, thumbnail, duration)
- [x] Input mode toggle (파일 업로드 / URL 직접 입력)
- [x] Thumbnail preview with duration display
- [x] CmsPage: blob URL cleanup on unmount
- [x] Tests: videoFileProcessor (6), VideoFormModal (12)

## Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2026-03-27 | Monorepo with npm workspaces | Player must be reusable across projects |
| 2026-03-27 | CSS Modules for player package | No Tailwind dependency = portable to any project |
| 2026-03-27 | Tailwind for apps/web only | Rapid UI development for the demo/main app |
| 2026-03-27 | useReducer over global store | Player state is local; no premature abstraction |
| 2026-03-27 | Service factory pattern | Clean swap between mock and Strapi via env var |
| 2026-03-27 | TDD approach | All features require tests first (Red-Green-Refactor) |
| 2026-03-27 | React 19 unified | Avoid duplicate React instances across workspaces |
| 2026-03-27 | Source import for dev | Vite alias resolves @videoplayer/core to source for HMR |
| 2026-03-27 | pointer: coarse media query | Detect touch vs mouse by input method, not viewport width |
| 2026-03-27 | Fullscreen on container div | Custom controls persist in fullscreen mode |
| 2026-03-27 | 2-row ControlBar layout | Progress bar on top row for better UX, controls on bottom row |
| 2026-03-27 | ErrorBoundary wraps VideoPlayer | Isolate player crashes from host app |
| 2026-03-27 | Double-tap with single-tap delay | 300ms delay distinguishes single vs double tap on mobile |
