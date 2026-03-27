import { useReducer, useRef, useCallback } from 'react';
import type { PlaybackState } from '../types';

type Action =
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SEEK'; payload: number; duration: number }
  | { type: 'SKIP'; payload: number; duration: number }
  | { type: 'TIME_UPDATE'; payload: number }
  | { type: 'LOADED_METADATA'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_PLAYBACK_SPEED'; payload: number }
  | { type: 'TOGGLE_SUBTITLES' };

const initialState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  isMuted: false,
  playbackSpeed: 1,
  isFullscreen: false,
  subtitlesEnabled: false,
  activeSubtitleId: null,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function reducer(state: PlaybackState, action: Action): PlaybackState {
  switch (action.type) {
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SEEK':
      return { ...state, currentTime: clamp(action.payload, 0, action.duration) };
    case 'SKIP': {
      const newTime = clamp(state.currentTime + action.payload, 0, action.duration);
      return { ...state, currentTime: newTime };
    }
    case 'TIME_UPDATE':
      return { ...state, currentTime: action.payload };
    case 'LOADED_METADATA':
      return { ...state, duration: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: clamp(action.payload, 0, 1) };
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    case 'SET_PLAYBACK_SPEED':
      return { ...state, playbackSpeed: action.payload };
    case 'TOGGLE_SUBTITLES':
      return { ...state, subtitlesEnabled: !state.subtitlesEnabled };
    default:
      return state;
  }
}

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (state.isPlaying) {
      video.pause();
    } else {
      await video.play();
    }
    dispatch({ type: 'TOGGLE_PLAY' });
  }, [state.isPlaying]);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    const clamped = clamp(time, 0, state.duration);
    if (video) video.currentTime = clamped;
    dispatch({ type: 'SEEK', payload: time, duration: state.duration });
  }, [state.duration]);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    const newTime = clamp(state.currentTime + seconds, 0, state.duration);
    if (video) video.currentTime = newTime;
    dispatch({ type: 'SKIP', payload: seconds, duration: state.duration });
  }, [state.currentTime, state.duration]);

  const handleTimeUpdate = useCallback((currentTime: number) => {
    dispatch({ type: 'TIME_UPDATE', payload: currentTime });
  }, []);

  const handleLoadedMetadata = useCallback((duration: number) => {
    dispatch({ type: 'LOADED_METADATA', payload: duration });
  }, []);

  const setVolume = useCallback((volume: number) => {
    const video = videoRef.current;
    const clamped = clamp(volume, 0, 1);
    if (video) video.volume = clamped;
    dispatch({ type: 'SET_VOLUME', payload: volume });
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) video.muted = !state.isMuted;
    dispatch({ type: 'TOGGLE_MUTE' });
  }, [state.isMuted]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = speed;
    dispatch({ type: 'SET_PLAYBACK_SPEED', payload: speed });
  }, []);

  const toggleSubtitles = useCallback(() => {
    const video = videoRef.current;
    if (video && video.textTracks.length > 0) {
      const newMode = state.subtitlesEnabled ? 'hidden' : 'showing';
      for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = newMode;
      }
    }
    dispatch({ type: 'TOGGLE_SUBTITLES' });
  }, [state.subtitlesEnabled]);

  return {
    videoRef,
    state,
    togglePlay,
    seek,
    skip,
    handleTimeUpdate,
    handleLoadedMetadata,
    setVolume,
    toggleMute,
    setPlaybackSpeed,
    toggleSubtitles,
  };
}
