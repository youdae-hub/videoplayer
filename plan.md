# Implementation Plan

## Architecture

```
videoplayer/
├── packages/
│   └── player/                    # @videoplayer/core (independent package)
│       ├── package.json
│       ├── vite.config.ts         # library mode build
│       ├── src/
│       │   ├── index.ts           # public API entry point
│       │   ├── types/
│       │   ├── hooks/
│       │   ├── components/
│       │   ├── utils/
│       │   └── styles/
│       └── __tests__/
│
├── apps/
│   └── web/                       # demo & main app
│       ├── package.json
│       ├── vite.config.ts
│       ├── src/
│       │   ├── services/          # mock data, Strapi integration
│       │   ├── pages/
│       │   └── components/
│       └── index.html
│
├── package.json                   # root (npm workspaces)
└── tsconfig.base.json
```

## Usage in Other Projects

```tsx
import { VideoPlayer } from '@videoplayer/core';

<VideoPlayer
  src="https://example.com/video.mp4"
  subtitles={[{ label: 'Korean', language: 'ko', src: '/subs/ko.vtt' }]}
/>
```

## MVP Phases

### Phase 1: Project Setup + Basic Player ✅
- [x] npm workspaces monorepo setup (root, packages/player, apps/web)
- [x] Vite + TypeScript + Tailwind config (apps/web)
- [x] Vite library mode config (packages/player)
- [x] Vitest + React Testing Library setup
- [x] Core types: Video, Subtitle, PlaybackState, VideoPlayerProps
- [x] `useVideoPlayer` hook (play, pause, seek, skip, time update, volume, mute, speed)
- [x] Basic components: VideoPlayer, ControlBar, PlayPauseButton, SkipButton, ProgressBar, TimeDisplay
- [x] CSS Modules dark theme styling for player
- [x] `formatTime` utility
- [x] Public API export via index.ts
- [x] Demo page in apps/web with public test video (Big Buck Bunny)

### Phase 2: Advanced Controls ✅
- [x] `useFullscreen` hook (Fullscreen API wrapper on container div)
- [x] `useControlsVisibility` hook (hover on desktop, tap on mobile, 3s auto-hide)
- [x] `useMediaQuery` hook (pointer: coarse detection for touch devices)
- [x] VolumeControl component (3-state icon + expandable slider)
- [x] FullscreenButton component (enter/exit toggle)
- [x] SettingsMenu component (gear icon dropdown)
- [x] PlaybackSpeedSelector (0.5x ~ 2.0x, 7 options)
- [x] SubtitleToggle (on/off switch)
- [x] Update ControlBar layout (2-row: progress top, controls bottom, responsive)
- [x] Mobile CSS: larger touch targets (44px), hidden volume slider, bottom sheet settings

### Phase 3: Video List Page + Routing ✅
- [x] React Router v6 setup (/, /video/:id, /cms)
- [x] Service interface: VideoService (getVideos, getVideoById)
- [x] Mock data service with 300ms simulated delay (6 public domain videos)
- [x] VideoCard component (thumbnail, duration badge, title, hover effects)
- [x] VideoListGrid component (responsive 1/2/3/4 col grid)
- [x] Header (sticky, dark, nav links) + PageLayout components
- [x] VideoListPage (loading skeleton + video grid)
- [x] VideoPlayerPage (back button, video info, date)
- [x] CmsPage placeholder (table stub for Phase 4)
- [x] SkeletonGrid loading component

### Phase 4: CMS Integration Layer ✅
- [x] Strapi service implementation (strapiVideoService.ts)
- [x] Service factory with env var switching (VITE_API_MODE)
- [x] API client utility (fetch wrapper)
- [x] CmsPage with CRUD layout stub
- [x] .env.example with configuration docs
- [x] Vite library build config for npm publish

### Phase 5: Polish + Accessibility ✅
- [x] Keyboard shortcuts (Space, Arrow keys, f, m, c)
- [x] Mobile double-tap to skip with ripple animation
- [x] Loading skeletons and error states
- [x] Progress bar time tooltip on hover
- [x] CSS transitions (control bar fade, settings menu, volume slider)
- [x] ARIA labels and role attributes
- [x] Error boundary component
- [x] Final responsive testing and adjustments

## Test Video Resources

Public domain videos for development:
- Big Buck Bunny: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`
- Elephant Dream: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4`
- Sintel: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4`

## Responsive Breakpoints

| Breakpoint | Target | Behavior |
|---|---|---|
| < 768px | Mobile | Tap to show controls, large touch targets, no volume slider |
| 768px ~ 1023px | Tablet | Tap controls, volume slider visible, 2-col grid |
| >= 1024px | Desktop | Hover controls, full features, 3-4 col grid |

## Strapi Integration Notes

- Content type: `video` with fields matching the `Video` interface
- Media library for video files and thumbnails
- Subtitle files as related media
- REST API endpoint: `GET /api/videos`, `GET /api/videos/:id`
- Environment variable: `VITE_STRAPI_URL=http://localhost:1337`
