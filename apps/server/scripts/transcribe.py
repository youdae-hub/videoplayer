#!/usr/bin/env python3
"""
Video transcription script using OpenAI Whisper.
Extracts audio from video, transcribes it, and generates a WebVTT subtitle file.

Usage:
  python3 transcribe.py <video_path> <output_vtt_path> [--model base] [--language auto]

Example:
  python3 transcribe.py uploads/videos/abc.mp4 uploads/subtitles/abc.vtt --model base
"""

import argparse
import os
import subprocess
import sys
import tempfile

def extract_audio(video_path: str, audio_path: str) -> None:
    """Extract audio from video using ffmpeg."""
    cmd = [
        "ffmpeg", "-i", video_path,
        "-vn", "-acodec", "pcm_s16le",
        "-ar", "16000", "-ac", "1",
        "-y", audio_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg error: {result.stderr}")


def format_timestamp(seconds: float) -> str:
    """Convert seconds to WebVTT timestamp format (HH:MM:SS.mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def generate_vtt(segments: list, output_path: str) -> None:
    """Generate WebVTT file from Whisper segments."""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("WEBVTT\n\n")
        for i, seg in enumerate(segments, 1):
            start = format_timestamp(seg["start"])
            end = format_timestamp(seg["end"])
            text = seg["text"].strip()
            f.write(f"{i}\n{start} --> {end}\n{text}\n\n")


def transcribe(video_path: str, output_path: str, model_name: str = "base", language: str = None) -> dict:
    """Main transcription pipeline."""
    import whisper

    # Extract audio to temp file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        audio_path = tmp.name

    try:
        print(f"Extracting audio from {video_path}...", flush=True)
        extract_audio(video_path, audio_path)

        print(f"Loading Whisper model '{model_name}'...", flush=True)
        model = whisper.load_model(model_name)

        print("Transcribing...", flush=True)
        options = {}
        if language and language != "auto":
            options["language"] = language

        result = model.transcribe(audio_path, **options)

        print(f"Generating VTT: {output_path}", flush=True)
        generate_vtt(result["segments"], output_path)

        detected_lang = result.get("language", "unknown")
        segment_count = len(result["segments"])
        print(f"Done! Language: {detected_lang}, Segments: {segment_count}", flush=True)

        return {
            "language": detected_lang,
            "segments": segment_count,
            "output": output_path
        }
    finally:
        if os.path.exists(audio_path):
            os.unlink(audio_path)


def main():
    parser = argparse.ArgumentParser(description="Transcribe video to WebVTT subtitles")
    parser.add_argument("video_path", help="Path to the video file")
    parser.add_argument("output_path", help="Path for the output VTT file")
    parser.add_argument("--model", default="base", choices=["tiny", "base", "small", "medium", "large"],
                        help="Whisper model size (default: base)")
    parser.add_argument("--language", default="auto", help="Language code or 'auto' for detection")
    args = parser.parse_args()

    if not os.path.exists(args.video_path):
        print(f"Error: Video file not found: {args.video_path}", file=sys.stderr)
        sys.exit(1)

    output_dir = os.path.dirname(args.output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    try:
        result = transcribe(args.video_path, args.output_path, args.model, args.language)
        # Output result as simple key=value for Node.js parsing
        print(f"RESULT:language={result['language']},segments={result['segments']},output={result['output']}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
