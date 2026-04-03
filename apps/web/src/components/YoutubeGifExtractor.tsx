import { useState, useEffect, useRef, useCallback } from 'react';

interface YoutubeGifExtractorProps {
  downloadYoutubeGif: (url: string, start: number, end: number, width?: number) => Promise<Blob>;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const sec = Math.floor(s);
  const ms = Math.round((s - sec) * 1000);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  return `${m}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function parseTimeInput(value: string): number | null {
  const parts = value.split(':');
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1];
  const [secStr, msStr] = last.split('.');
  const sec = Number(secStr);
  const ms = msStr ? Number(msStr.padEnd(3, '0').slice(0, 3)) : 0;
  if (isNaN(sec) || isNaN(ms)) return null;
  const min = Number(parts[parts.length - 2]);
  const hr = parts.length === 3 ? Number(parts[0]) : 0;
  if (isNaN(min) || isNaN(hr)) return null;
  return hr * 3600 + min * 60 + sec + ms / 1000;
}

function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v');
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1);
    }
  } catch { /* ignore */ }
  return null;
}

declare global {
  interface Window {
    YT: {
      Player: new (el: string | HTMLElement, config: Record<string, unknown>) => YTPlayer;
      PlayerState: { PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  destroy: () => void;
}

function loadYouTubeAPI(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const check = setInterval(() => {
        if (window.YT?.Player) { clearInterval(check); resolve(); }
      }, 100);
      return;
    }
    window.onYouTubeIframeAPIReady = () => resolve();
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
}

const WIDTH_OPTIONS = [
  { label: '320px', value: 320 },
  { label: '480px', value: 480 },
  { label: '640px', value: 640 },
];

export function YoutubeGifExtractor({ downloadYoutubeGif, onClose }: YoutubeGifExtractorProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [startText, setStartText] = useState(formatTime(0));
  const [endText, setEndText] = useState(formatTime(0));
  const [editingStart, setEditingStart] = useState(false);
  const [editingEnd, setEditingEnd] = useState(false);
  const [width, setWidth] = useState(480);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const videoId = extractYoutubeVideoId(youtubeUrl);

  useEffect(() => {
    if (!editingStart) setStartText(formatTime(startTime));
  }, [startTime, editingStart]);

  useEffect(() => {
    if (!editingEnd) setEndText(formatTime(endTime));
  }, [endTime, editingEnd]);

  useEffect(() => {
    if (!videoId || !playerContainerRef.current) {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      return;
    }

    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !playerContainerRef.current) return;

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      const el = document.createElement('div');
      el.id = `yt-player-${Date.now()}`;
      playerContainerRef.current.innerHTML = '';
      playerContainerRef.current.appendChild(el);

      try {
        playerRef.current = new window.YT.Player(el.id, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1 },
        } as Record<string, unknown>);
      } catch { /* YT Player init may fail in non-browser environments */ }
    });

    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  const commitStart = (text: string) => {
    setEditingStart(false);
    const parsed = parseTimeInput(text);
    if (parsed !== null) {
      setStartTime(parsed);
    } else {
      setStartText(formatTime(startTime));
    }
  };

  const commitEnd = (text: string) => {
    setEditingEnd(false);
    const parsed = parseTimeInput(text);
    if (parsed !== null) {
      setEndTime(parsed);
    } else {
      setEndText(formatTime(endTime));
    }
  };

  const setStartFromPlayer = useCallback(() => {
    if (playerRef.current) {
      setStartTime(playerRef.current.getCurrentTime());
    }
  }, []);

  const setEndFromPlayer = useCallback(() => {
    if (playerRef.current) {
      setEndTime(playerRef.current.getCurrentTime());
    }
  }, []);

  const duration = endTime - startTime;
  const isValid = youtubeUrl.trim() !== '' && duration > 0 && duration <= 30;
  const isOverLimit = duration > 30;

  const handleDownload = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    try {
      const blob = await downloadYoutubeGif(youtubeUrl, startTime, endTime, width);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'clip.gif';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setError(err.message || 'GIF 변환에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      data-testid="youtube-gif-overlay"
    >
      <div
        className="w-full max-w-2xl mx-4 flex flex-col rounded-lg bg-neutral-900 border border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <h2 className="text-lg font-bold text-white">YouTube GIF 추출</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors text-sm"
          >
            닫기
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="youtube-url" className="block text-xs text-neutral-400 mb-1">YouTube URL</label>
            <input
              id="youtube-url"
              type="text"
              value={youtubeUrl}
              onChange={(e) => { setYoutubeUrl(e.target.value); setError(''); }}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded bg-neutral-800 border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {videoId && (
            <div
              ref={playerContainerRef}
              className="rounded-lg overflow-hidden bg-black aspect-video"
              data-testid="youtube-player"
            />
          )}

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label htmlFor="yt-gif-start" className="block text-xs text-neutral-400 mb-1">시작</label>
              <div className="flex gap-1">
                <input
                  id="yt-gif-start"
                  type="text"
                  value={startText}
                  onChange={(e) => setStartText(e.target.value)}
                  onFocus={() => setEditingStart(true)}
                  onBlur={() => commitStart(startText)}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className="w-full rounded bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-sm text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={setStartFromPlayer}
                  title="현재 위치를 시작점으로"
                  disabled={!videoId}
                  className="rounded bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-xs text-blue-400 hover:bg-neutral-700 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  현재
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label htmlFor="yt-gif-end" className="block text-xs text-neutral-400 mb-1">종료</label>
              <div className="flex gap-1">
                <input
                  id="yt-gif-end"
                  type="text"
                  value={endText}
                  onChange={(e) => setEndText(e.target.value)}
                  onFocus={() => setEditingEnd(true)}
                  onBlur={() => commitEnd(endText)}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className="w-full rounded bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-sm text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={setEndFromPlayer}
                  title="현재 위치를 종료점으로"
                  disabled={!videoId}
                  className="rounded bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-xs text-blue-400 hover:bg-neutral-700 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  현재
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="yt-gif-width" className="block text-xs text-neutral-400 mb-1">너비</label>
              <select
                id="yt-gif-width"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="rounded bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {WIDTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {duration > 0 && !isOverLimit && (
            <p className="text-xs text-neutral-400">구간: {duration.toFixed(1)}초</p>
          )}

          {isOverLimit && (
            <p className="text-xs text-red-400">GIF 구간은 최대 30초까지 가능합니다.</p>
          )}

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-700 flex justify-end">
          <button
            type="button"
            disabled={!isValid || loading}
            onClick={handleDownload}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isValid && !loading
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
            }`}
          >
            {loading ? '변환 중...' : 'GIF 다운로드'}
          </button>
        </div>
      </div>
    </div>
  );
}
