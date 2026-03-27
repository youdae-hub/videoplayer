import type { PlaybackState } from '../types';
import { PlayPauseButton } from './PlayPauseButton';
import { SkipButton } from './SkipButton';
import { ProgressBar } from './ProgressBar';
import { TimeDisplay } from './TimeDisplay';
import styles from '../styles/player.module.css';

interface ControlBarProps {
  state: PlaybackState;
  onTogglePlay: () => void;
  onSkip: (seconds: number) => void;
  onSeek: (time: number) => void;
}

export function ControlBar({ state, onTogglePlay, onSkip, onSeek }: ControlBarProps) {
  return (
    <div className={styles.controlBar} data-testid="control-bar">
      <SkipButton seconds={-10} onClick={() => onSkip(-10)} />
      <PlayPauseButton isPlaying={state.isPlaying} onClick={onTogglePlay} />
      <SkipButton seconds={10} onClick={() => onSkip(10)} />
      <TimeDisplay currentTime={state.currentTime} duration={state.duration} />
      <ProgressBar
        currentTime={state.currentTime}
        duration={state.duration}
        buffered={state.buffered}
        onSeek={onSeek}
      />
    </div>
  );
}
