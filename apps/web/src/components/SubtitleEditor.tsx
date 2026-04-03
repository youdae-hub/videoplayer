import { useState, useRef, useEffect, useCallback } from 'react';
import type { Subtitle } from '@videoplayer/core';
import type { SubtitleCue } from '../services/types';

interface SubtitleEditorProps {
  videoSrc: string;
  subtitle: Subtitle;
  onLoad: (subtitleId: string) => Promise<SubtitleCue[]>;
  onSave: (subtitleId: string, cues: SubtitleCue[]) => Promise<SubtitleCue[]>;
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

function TimeInput({
  value,
  onCommit,
  onFocus,
  className,
}: {
  value: number;
  onCommit: (time: number) => void;
  onFocus?: () => void;
  className?: string;
}) {
  const [text, setText] = useState(formatTime(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setText(formatTime(value));
  }, [value, editing]);

  return (
    <input
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => {
        setEditing(true);
        onFocus?.();
      }}
      onBlur={() => {
        setEditing(false);
        const parsed = parseTimeInput(text);
        if (parsed !== null) {
          onCommit(parsed);
        } else {
          setText(formatTime(value));
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
    />
  );
}

export function SubtitleEditor({ videoSrc, subtitle, onLoad, onSave, onClose }: SubtitleEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    onLoad(subtitle.id).then((data) => {
      setCues(data);
      setLoading(false);
    }).catch(() => {
      setError('자막을 불러올 수 없습니다.');
      setLoading(false);
    });
  }, [subtitle.id, onLoad]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const updateCue = useCallback((index: number, field: keyof SubtitleCue, value: string | number) => {
    setCues((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'endTime' && typeof value === 'number') {
        const nextCue = updated[index + 1];
        if (nextCue) {
          const maxEnd = nextCue.endTime;
          const clamped = Math.min(value, maxEnd);
          updated[index] = { ...updated[index], endTime: clamped };
          updated[index + 1] = { ...nextCue, startTime: clamped };
        }
      }

      return updated;
    });
    setDirty(true);
  }, []);

  const addCueAfter = useCallback((index: number) => {
    setCues((prev) => {
      const current = prev[index];
      const next = prev[index + 1];
      const startTime = current ? current.endTime : 0;
      const endTime = next ? Math.min(startTime + 3, next.startTime) : startTime + 3;
      const newCue = { startTime, endTime: Math.max(endTime, startTime + 0.5), text: '' };
      const result = [...prev];
      result.splice(index + 1, 0, newCue);
      return result;
    });
    setDirty(true);
  }, []);

  const addCueAtEnd = useCallback(() => {
    setCues((prev) => {
      const lastEnd = prev.length > 0 ? prev[prev.length - 1].endTime : 0;
      return [...prev, { startTime: lastEnd, endTime: lastEnd + 3, text: '' }];
    });
    setDirty(true);
  }, []);

  const removeCue = useCallback((index: number) => {
    setCues((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }, []);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(subtitle.id, cues);
      setDirty(false);
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const activeCueIndex = cues.findIndex(
    (c) => currentTime >= c.startTime && currentTime < c.endTime,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      data-testid="subtitle-editor-overlay"
    >
      <div
        className="w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col rounded-lg bg-neutral-900 border border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <h2 className="text-lg font-bold text-white">
            자막 편집 — {subtitle.label}
          </h2>
          <div className="flex items-center gap-3">
            {dirty && <span className="text-xs text-yellow-400">변경사항 있음</span>}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors text-sm"
            >
              닫기
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="px-6 py-4 border-b border-neutral-700">
          <div className="relative">
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              muted
              playsInline
              preload="auto"
              onTimeUpdate={handleTimeUpdate}
              className="w-full max-h-[250px] rounded-lg bg-black"
            />
            {activeCueIndex >= 0 && (
              <div
                className="absolute bottom-10 left-0 right-0 pointer-events-none text-center px-4"
                data-testid="subtitle-overlay"
              >
                <span className="inline-block rounded bg-black/75 px-3 py-1 text-sm text-white">
                  {cues[activeCueIndex].text}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center text-neutral-500 py-8">로딩 중...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-neutral-500 uppercase sticky top-0 bg-neutral-900">
                <tr>
                  <th className="text-left py-2 w-8">#</th>
                  <th className="text-left py-2 w-36">시작</th>
                  <th className="text-left py-2 w-36">종료</th>
                  <th className="text-left py-2">내용</th>
                  <th className="py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {cues.map((cue, i) => (
                  <tr
                    key={i}
                    className={`border-t border-neutral-800 ${i === activeCueIndex ? 'bg-blue-900/20' : ''}`}
                  >
                    <td className="py-2 text-neutral-500 text-xs">{i + 1}</td>
                    <td className="py-2 pr-2">
                      <TimeInput
                        value={cue.startTime}
                        onCommit={(t) => updateCue(i, 'startTime', t)}
                        onFocus={() => seekTo(cue.startTime)}
                        className="w-full rounded bg-neutral-800 border border-neutral-700 px-2 py-1 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <TimeInput
                        value={cue.endTime}
                        onCommit={(t) => updateCue(i, 'endTime', t)}
                        className="w-full rounded bg-neutral-800 border border-neutral-700 px-2 py-1 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={cue.text}
                        onChange={(e) => updateCue(i, 'text', e.target.value)}
                        className="w-full rounded bg-neutral-800 border border-neutral-700 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-2 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => addCueAfter(i)}
                        className="text-blue-400 hover:text-blue-300 text-xs px-1"
                        title="아래에 추가"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCue(i)}
                        className="text-red-400 hover:text-red-300 text-xs px-1"
                        title="삭제"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-3 border-t border-neutral-700">
          <button
            type="button"
            onClick={addCueAtEnd}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            + 자막 추가
          </button>
        </div>
      </div>
    </div>
  );
}
