# Turf build. Run `python3 build.py` in this folder: it inlines base.js, engine.js, figs.js, art.js, village-iso.js, style.css and ui.js
# into shell.html and writes the game to dist/ (index.html, sw.js and copies of the other deployed files).
# Bump VER and set DATE by hand on every change. Upload the changed files from dist/ over the ones at the top of the repo.
import os, re, shutil
VER = '0.4.1'
DATE = 'Nov 22 2026'   # the real date of this build (set by hand: the build machine's clock can be wrong)
def src(f, tail=None):
    s = open(f).read()
    return s.replace(tail, '') if tail else s
s = open('shell.html').read()
engine = src('base.js', "if (typeof module !== 'undefined') module.exports = BASE;") + '\n' + src('engine.js', "if (typeof module !== 'undefined') module.exports = TURF;")
for k, v in [('__CSS__', src('style.css')), ('__ENGINE__', engine), ('__ART__', src('figs.js', "if (typeof module !== 'undefined') module.exports = MINI;") + '\n' + src('art.js', "if (typeof module !== 'undefined') module.exports = ART;")), ('__UI__', src('ui.js')), ('__VIL__', src('village-iso.js'))]:
    s = s.replace(k, v)
s = s.replace('__VER__', VER).replace('__DATE__', DATE)
os.makedirs('dist', exist_ok=True)
open('dist/index.html', 'w').write(s)
sw = re.sub(r"const CACHE = 'turf-v[^']*'", "const CACHE = 'turf-v" + VER + "'", open('sw.js').read())
assert "turf-v" + VER + "'" in sw
open('sw.js', 'w').write(sw); open('dist/sw.js', 'w').write(sw)
for f in ['manifest.json', 'icon-192.png', 'icon-512.png', 'viceroy.png', 'title.jpg', 'event-rescue.jpg', 'event-keys.jpg', 'ROADMAP.md']:
    if os.path.exists(f): shutil.copy(f, 'dist/' + f)
open('dist/.nojekyll', 'w').write('')
print('built v' + VER, DATE, len(s) // 1024, 'KB')
