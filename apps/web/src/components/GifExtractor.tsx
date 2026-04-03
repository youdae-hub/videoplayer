import { useState, useRef, useEffect } from 'react';

interface GifExtractorProps {
  videoSrc: string;
  videoId: string;
  videoTitle: string;
  getGifUrl: (id: string, start: number, end: number, width?: number) => string;
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

const WIDTH_OPTIONS = [
  { label: '320px', value: 320 },
  { label: '480px', value: 480 },
  { label: '640px', value: 640 },
];

export function GifExtractor({ videoSrc, videoId, videoTitle, getGifUrl, onClose }: GifExtractorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [startText, setStartText] = useState(formatTime(0));
  const [endText, setEndText] = useState(formatTime(0));
  const [editingStart, setEditingStart] = useState(false);
  const [editingEnd, setEditingEnd] = useState(false);
  const [width, setWidth] = useState(480);

  useEffect(() => {
    if (!editingStart) setStartText(formatTime(startTime));
  }, [startTime, editingStart]);

  useEffect(() => {
    if (!editingEnd) setEndText(formatTime(endTime));
  }, [endTime, editingEnd]);

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

  const duration = endTime - startTime;
  const isValid = duration > 0 && duration <= 30;
  const isOverLimit = duration > 30;
  const gifUrl = isValid ? getGifUrl(videoId, startTime, endTime, width) : '';

  const setStartFromVideo = () => {
    if (videoRef.current) {
      setStartTime(videoRef.current.currentTime);
    }
  };

  const setEndFromVideo = () => {
    if (videoRef.current) {
      setEndTime(videoRef.current.currentTime);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      data-testid="gif-extractor-overlay"
    >
      <div
        className="w-full max-w-2xl mx-4 flex flex-col rounded-lg bg-neutral-900 border border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <h2 className="text-lg font-bold text-white">
            GIF 추출 — {videoTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors text-sm"
          >
            닫기
          </button>
        </div>

        <div className="px-6 py-4 border-b border-neutral-700">
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            muted
            playsInline
            preload="auto"
            className="w-full max-h-[250px] rounded-lg bg-black"
          />
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label htmlFor="gif-start" className="block text-xs text-neutral-400 mb-1">시작</label>
              <div className="flex gap-1">
                <input
                  id="gif-start"
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
                  onClick={setStartFromVideo}
                  title="현재 위치를 시작점으로"
                  className="rounded bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-xs text-blue-400 hover:bg-neutral-700 whitespace-nowrap"
                >
                  현재
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label htmlFor="gif-end" className="block text-xs text-neutral-400 mb-1">종료</label>
              <div className="flex gap-1">
                <input
                  id="gif-end"
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
                  onClick={setEndFromVideo}
                  title="현재 위치를 종료점으로"
                  className="rounded bg-neutral-800 border border-neutral-700 px-2 py-1.5 text-xs text-blue-400 hover:bg-neutral-700 whitespace-nowrap"
                >
                  현재
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="gif-width" className="block text-xs text-neutral-400 mb-1">너비</label>
              <select
                id="gif-width"
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

          {duration > 0 && (
            <p className="text-xs text-neutral-400">
              구간: {duration.toFixed(1)}초
            </p>
          )}

          {isOverLimit && (
            <p className="text-xs text-red-400">
              GIF 구간은 최대 30초까지 가능합니다.
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-neutral-700 flex justify-end">
          <a
            href={isValid ? gifUrl : undefined}
            download
            aria-disabled={!isValid}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isValid
                ? 'bg-blue-600 text-white hover:bg-blue-500 cursor-pointer'
                : 'bg-neutral-700 text-neutral-500 pointer-events-none'
            }`}
            onClick={(e) => { if (!isValid) e.preventDefault(); }}
          >
            GIF 다운로드
          </a>
        </div>
      </div>
    </div>
  );
}
