import re, sys, subprocess, tempfile, os
f = sys.argv[1]; s = open(f, encoding='utf-8').read(); bad = 0
blocks = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', s, re.S)
for i, b in enumerate(blocks):
    p = tempfile.mktemp(suffix='.js'); open(p, 'w').write(b)
    r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
    if r.returncode: bad += 1; print('SYNTAX block', i, r.stderr[:400])
    os.remove(p)
for name, pat in [('jekyll', r'\{\{|\{%'), ('emdash', '\u2014|&mdash;|\\\\u2014'), ('curly', '[\u2018\u2019\u201c\u201d]'), ('console.log', r'console\.log\(')]:
    n = len(re.findall(pat, s))
    if n: bad += 1; print('FOUND', name, n)
print(f, len(blocks), 'inline scripts,', 'PASS' if not bad else str(bad) + ' problems')
sys.exit(1 if bad else 0)
