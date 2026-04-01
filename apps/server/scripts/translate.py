#!/usr/bin/env python3
"""
VTT subtitle translation script using Argos Translate.

Usage:
  python3 translate.py <input_vtt> <output_vtt> --from en --to ko

Example:
  python3 translate.py uploads/subtitles/abc.vtt uploads/subtitles/abc_ko.vtt --from en --to ko
"""

import argparse
import os
import re
import sys


def parse_vtt(file_path: str) -> list[dict]:
    """Parse WebVTT file into segments."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    segments = []
    blocks = content.strip().split("\n\n")

    for block in blocks:
        lines = block.strip().split("\n")
        if "-->" not in block:
            continue

        for i, line in enumerate(lines):
            if "-->" in line:
                timestamp = line
                text = "\n".join(lines[i + 1:])
                segments.append({"timestamp": timestamp, "text": text})
                break

    return segments


def generate_vtt(segments: list[dict], output_path: str) -> None:
    """Generate WebVTT file from translated segments."""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("WEBVTT\n\n")
        for i, seg in enumerate(segments, 1):
            f.write(f"{i}\n{seg['timestamp']}\n{seg['text']}\n\n")


def translate_text(text: str, from_lang: str, to_lang: str) -> str:
    """Translate text using Argos Translate."""
    import argostranslate.package
    import argostranslate.translate

    translated = argostranslate.translate.translate(text, from_lang, to_lang)
    return translated


def ensure_language_package(from_lang: str, to_lang: str) -> None:
    """Download and install language package if not available."""
    import argostranslate.package
    import argostranslate.translate

    installed = argostranslate.translate.get_installed_languages()
    installed_codes = [lang.code for lang in installed]

    if from_lang in installed_codes and to_lang in installed_codes:
        from_installed = next(lang for lang in installed if lang.code == from_lang)
        available_translations = from_installed.get_translation(
            next(lang for lang in installed if lang.code == to_lang)
        )
        if available_translations:
            return

    print(f"Downloading language package: {from_lang} -> {to_lang}...", flush=True)
    argostranslate.package.update_package_index()
    available = argostranslate.package.get_available_packages()

    pkg = next(
        (p for p in available if p.from_code == from_lang and p.to_code == to_lang),
        None,
    )

    if pkg is None:
        raise RuntimeError(
            f"No translation package available for {from_lang} -> {to_lang}"
        )

    argostranslate.package.install_from_path(pkg.download())
    print(f"Installed: {from_lang} -> {to_lang}", flush=True)


def translate_vtt(
    input_path: str, output_path: str, from_lang: str, to_lang: str
) -> dict:
    """Main translation pipeline."""
    print(f"Translating {from_lang} -> {to_lang}...", flush=True)

    ensure_language_package(from_lang, to_lang)

    segments = parse_vtt(input_path)
    print(f"Parsed {len(segments)} segments", flush=True)

    for i, seg in enumerate(segments):
        seg["text"] = translate_text(seg["text"], from_lang, to_lang)
        if (i + 1) % 10 == 0:
            print(f"  Translated {i + 1}/{len(segments)} segments", flush=True)

    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    generate_vtt(segments, output_path)
    print(f"Done! Output: {output_path}", flush=True)

    return {"segments": len(segments), "output": output_path}


def main():
    parser = argparse.ArgumentParser(description="Translate VTT subtitles")
    parser.add_argument("input_vtt", help="Input VTT file path")
    parser.add_argument("output_vtt", help="Output VTT file path")
    parser.add_argument(
        "--from", dest="from_lang", required=True, help="Source language code"
    )
    parser.add_argument(
        "--to", dest="to_lang", required=True, help="Target language code"
    )
    args = parser.parse_args()

    if not os.path.exists(args.input_vtt):
        print(f"Error: Input file not found: {args.input_vtt}", file=sys.stderr)
        sys.exit(1)

    try:
        result = translate_vtt(
            args.input_vtt, args.output_vtt, args.from_lang, args.to_lang
        )
        print(
            f"RESULT:segments={result['segments']},output={result['output']},from={args.from_lang},to={args.to_lang}"
        )
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
