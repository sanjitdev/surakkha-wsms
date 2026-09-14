"""
Strip trailing action-arrow icons from mockup HTML files.

Touch only:
  - <button …>…→/↗</button>
  - <a …>…→/↗</a>          (incl. <a …>→</a>)
  - decorative <span …>→/↗</span> within CTA/icon contexts

DO NOT touch:
  - narrative copy (e.g. "3.6 → 0.4 NTU", shift times, escalation thresholds)
  - JS comments using → as flow description
  - paragraph copy containing →

Usage: python scripts/strip-action-arrows.py
"""
import os
import re
import sys

ROOT = r"C:\ZDrive Folders\E2E_Training\Surakkha\web\mockups"

# Patterns applied in order. Each only fires inside CTA-shaped tags.
CTX_BUTTON = re.compile(
    r'(<button\b[^>]*>)([^<]*?)\s*[→↗]\s*(</button>)',
    re.IGNORECASE,
)
CTX_ANCHOR = re.compile(
    r'(<a\b[^>]*>)([^<]*?)\s*[→↗]\s*(</a>)',
    re.IGNORECASE,
)
CTX_ANCHOR_ONLY_ARROW = re.compile(
    r'(<a\b[^>]*>)\s*[→↗]\s*(</a>)',
    re.IGNORECASE,
)
SPAN_ARROW = re.compile(
    r'<span\b[^>]*>\s*[→↗]\s*</span>',
    re.IGNORECASE,
)

files = []
for sub in sorted(os.listdir(ROOT)):
    p = os.path.join(ROOT, sub)
    if os.path.isdir(p) and not sub.startswith('.'):
        for f in sorted(os.listdir(p)):
            if f.endswith('.html'):
                files.append(os.path.join(p, f))

if not files:
    print("No html files found", file=sys.stderr)
    sys.exit(1)

total_subs = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        src = fh.read()
    before = src
    n = 0
    # Empty-arrow anchors/buttons first.
    src, k = CTX_ANCHOR_ONLY_ARROW.subn(r'\1\2', src)
    n += k
    src, k = CTX_BUTTON.subn(r'\1\2\3', src)
    n += k
    src, k = CTX_ANCHOR.subn(r'\1\2\3', src)
    n += k
    src, k = SPAN_ARROW.subn('', src)
    n += k
    # Tidy up.
    src, _ = re.subn(r' {2,}', ' ', src)
    src = re.sub(r' +>', '>', src)
    if src != before:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(src)
        rel = os.path.relpath(f, ROOT)
        print(f"{rel}: {n} subs")
        total_subs += n

print(f"\nTotal: {total_subs} substitutions across {len(files)} files")
