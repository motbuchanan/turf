# Intro and logo proof (v0.5.2): a brand new player sees the intro before the title; every shot shows its line; a tap moves on;
# Skip ends it; it does not come back on the next open; the title has the painted logo and a button to play the intro again.
import os
from playwright.sync_api import sync_playwright
URL = os.environ.get('TURF_URL', 'http://localhost:8123/index.html')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proof', ''); os.makedirs(OUT, exist_ok=True)
LINES = ['Every block belongs to somebody.', 'This one belonged to the Viceroy.', 'Then the Boombox Kings came for it.', 'Tonight, somebody new walks up the street.']
ok = True
def check(n, c, x=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, x, flush=True); ok = ok and bool(c)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'])
    for tag, vp in (('tall', dict(width=390, height=844)), ('wide', dict(width=844, height=390))):
        pg = b.new_page(viewport=vp, device_scale_factor=2); errs = []; bad = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('response', lambda r: bad.append(r.url) if r.status >= 400 else None)
        pg.goto(URL, wait_until='commit'); pg.wait_for_function("window.TURF_TEST && TURF_TEST.intro().on", timeout=20000)
        cap = lambda: pg.evaluate("document.getElementById('introCap').textContent")
        st = pg.evaluate('TURF_TEST.intro()'); check(tag + ': a new player gets the intro, four shots', st['on'] and st['shots'] == [1, 2, 3, 5], str(st))
        check(tag + ': the shot shows its line', cap() == LINES[st['at']], cap())
        check(tag + ': the clip is silent', pg.evaluate("document.getElementById('introVid').muted") is True)
        box = pg.evaluate("(() => { const r = document.getElementById('introSkip').getBoundingClientRect(); const c = document.getElementById('introCap').getBoundingClientRect(); return [r.width, r.height, r.right <= innerWidth && r.bottom <= innerHeight, r.top >= c.bottom || r.left >= c.right]; })()")
        check(tag + ': Skip is on screen, big enough to tap, and clear of the line of text', box[0] >= 44 and box[1] >= 44 and box[2] and box[3], str(box))
        pg.wait_for_timeout(1500); pg.screenshot(path=OUT + 'turf-v0.5.2-intro-a-' + tag + '.png')
        moved = True
        for n in range(6):
            a0 = pg.evaluate('TURF_TEST.intro()')
            if not a0['on']: break
            pg.mouse.click(vp['width'] / 2, vp['height'] / 2); pg.wait_for_timeout(900); a1 = pg.evaluate('TURF_TEST.intro()')
            if a1['on']:
                moved = moved and a1['at'] > a0['at'] and cap() == LINES[a1['at']]
                if a1['at'] in (2, 3): pg.wait_for_timeout(900); pg.screenshot(path=OUT + 'turf-v0.5.2-intro-' + 'abcd'[a1['at']] + '-' + tag + '.png')
        check(tag + ': each tap moves on to the next shot and its line', moved)
        check(tag + ': after the last shot the title is there', not pg.evaluate('TURF_TEST.intro()')['on'] and pg.locator('#goBtn').is_visible())
        pg.wait_for_timeout(800)
        check(tag + ': the title shows the painted logo', pg.evaluate("!!document.querySelector('#title h1.painted img') && document.querySelector('#title h1 img').naturalWidth") == 1000)
        lb = pg.evaluate("(() => { const r = document.querySelector('#title h1 img').getBoundingClientRect(), g = document.getElementById('goBtn').getBoundingClientRect(); return [r.left >= 0, r.right <= innerWidth, r.top >= 0, r.bottom <= g.top]; })()")
        check(tag + ': the logo fits above the Start button', all(lb), str(lb))
        pg.screenshot(path=OUT + 'turf-v0.5.2-title-' + tag + '.png')
        check(tag + ': the title offers the intro again', pg.locator('#introBtn').is_visible())
        pg.reload(); pg.wait_for_function('window.TURF_TEST'); pg.wait_for_timeout(1500)
        check(tag + ': it does not play again on the next open', not pg.evaluate('TURF_TEST.intro()')['on'])
        pg.click('#introBtn'); pg.wait_for_timeout(1500)
        check(tag + ': the button plays it again', pg.evaluate('TURF_TEST.intro()')['on'])
        pg.click('#introSkip'); pg.wait_for_timeout(400)
        check(tag + ': Skip ends it', not pg.evaluate('TURF_TEST.intro()')['on'] and pg.locator('#goBtn').is_visible())
        pg.click('#goBtn'); pg.wait_for_timeout(800)
        check(tag + ': Start still starts the game', pg.evaluate('TURF_TEST.state()')['screen'] in ('story', 'hud'), str(pg.evaluate('TURF_TEST.state()')['screen']))
        check(tag + ': no console errors, no missing files', not errs and not bad, str(errs[:2]) + str(bad[:3]))
        pg.close()
    b.close()
print('INTRO', 'PASS' if ok else 'FAIL')
