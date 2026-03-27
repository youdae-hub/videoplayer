import type { PlaybackState, Subtitle } from '../types';
import { PlayPauseButton } from './PlayPauseButton';
import { SkipButton } from './SkipButton';
import { ProgressBar } from './ProgressBar';
import { TimeDisplay } from './TimeDisplay';
import { VolumeControl } from './VolumeControl';
import { SettingsMenu } from './SettingsMenu';
import { FullscreenButton } from './FullscreenButton';
import styles from '../styles/player.module.css';

interface ControlBarProps {
  state: PlaybackState;
  visible: boolean;
  subtitles: Subtitle[];
  onTogglePlay: () => void;
  onSkip: (seconds: number) => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onSpeedChange: (speed: number) => void;
  onSubtitleSelect: (subtitleId: string | null) => void;
  onToggleFullscreen: () => void;
  onToggleGuide: () => void;
}

export function ControlBar({
  state,
  visible,
  subtitles,
  onTogglePlay,
  onSkip,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onSubtitleSelect,
  onToggleFullscreen,
  onToggleGuide,
}: ControlBarProps) {
  return (
    <div
      className={`${styles.controlBar} ${!visible ? styles.hidden : ''}`}
      data-testid="control-bar"
    >
      <div className={styles.controlBarTop}>
        <ProgressBar
          currentTime={state.currentTime}
          duration={state.duration}
          buffered={state.buffered}
          onSeek={onSeek}
        />
      </div>
      <div className={styles.controlBarBottom}>
        <PlayPauseButton isPlaying={state.isPlaying} onClick={onTogglePlay} />
        <SkipButton seconds={-10} onClick={() => onSkip(-10)} />
        <SkipButton seconds={10} onClick={() => onSkip(10)} />
        <VolumeControl
          volume={state.volume}
          isMuted={state.isMuted}
          onVolumeChange={onVolumeChange}
          onToggleMute={onToggleMute}
        />
        <TimeDisplay currentTime={state.currentTime} duration={state.duration} />
        <div className={styles.spacer} />
        <button
          className={styles.guideButton}
          onClick={onToggleGuide}
          aria-label="Keyboard shortcuts"
        >
          ?
        </button>
        <SettingsMenu
          playbackSpeed={state.playbackSpeed}
          subtitles={subtitles}
          activeSubtitleId={state.activeSubtitleId}
          onSpeedChange={onSpeedChange}
          onSubtitleSelect={onSubtitleSelect}
        />
        <FullscreenButton
          isFullscreen={state.isFullscreen}
          onToggle={onToggleFullscreen}
        />
      </div>
    </div>
  );
}
