# Progress

## Current Status: Phase 4 - Complete ✅

## Test Results
- 24 test files, 124 tests passing
- Hooks: useVideoPlayer (13), useMediaQuery (4), useFullscreen (5), useControlsVisibility (10)
- Utils: formatTime (9)
- Components: TimeDisplay (3), PlayPauseButton (3), SkipButton (3), ProgressBar (4), VolumeControl (7), FullscreenButton (3), PlaybackSpeedSelector (3), SubtitleToggle (4), SettingsMenu (6), VideoPlayer (11)

## Build Output
- ESM: 16.6KB | UMD: 13KB | CSS: 4.35KB

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

### Phase 5: Polish + Accessibility
- [ ] Not started

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
