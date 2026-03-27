export type ViewMode = 'page' | 'modal';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-neutral-800 p-1" role="radiogroup" aria-label="View mode">
      <button
        role="radio"
        aria-checked={mode === 'page'}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          mode === 'page'
            ? 'bg-neutral-600 text-white'
            : 'text-neutral-400 hover:text-white'
        }`}
        onClick={() => onChange('page')}
      >
        페이지 이동
      </button>
      <button
        role="radio"
        aria-checked={mode === 'modal'}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          mode === 'modal'
            ? 'bg-neutral-600 text-white'
            : 'text-neutral-400 hover:text-white'
        }`}
        onClick={() => onChange('modal')}
      >
        레이어 재생
      </button>
    </div>
  );
}
