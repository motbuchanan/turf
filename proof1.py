import sys, time, json
import os
from playwright.sync_api import sync_playwright
URL = os.environ.get('TURF_URL', 'http://localhost:8123/index.html')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proof', ''); os.makedirs(OUT, exist_ok=True)
UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
def run(nogl=False, w=390, h=844, tag='main'):
    errs = []
    with sync_playwright() as p:
        args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] + (['--disable-webgl', '--disable-webgl2'] if nogl else [])
        b = p.chromium.launch(args=args)
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, user_agent=UA, has_touch=False)
        pg = ctx.new_page()
        pg.add_init_script("try{localStorage.setItem('turf.intro.v1','1')}catch(e){}")   # these proofs skip the intro
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(2500)
        st = lambda: pg.evaluate('TURF_TEST.state()')
        print(tag, 'boot', st())
        pg.screenshot(path=OUT + tag + '-1-title.png')
        def click(sel):
            bb = pg.locator(sel).bounding_box(); pg.mouse.click(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
        click('#goBtn'); pg.wait_for_timeout(600)
        assert st()['screen'] == 'story', st()
        pg.screenshot(path=OUT + tag + '-2-story.png')
        for _ in range(3): click('#card'); pg.wait_for_timeout(250)
        assert st()['screen'] == 'hud', st()
        def world(x, y):
            if not nogl: return pg.evaluate(f'TURF_TEST.toScreen({x},{y})')
            # flat map: 28 tiles fit the short side, centred
            s = min(w, h) / 28; return [(w - s * 28) / 2 + x * s, (h - s * 28) / 2 + y * s]
        # a tap on the Main House must be refused
        sx, sy = world(13.5, 13.5); pg.mouse.click(sx, sy); pg.wait_for_timeout(300)
        toast = pg.locator('#toast').inner_text(); print(tag, 'house tap ->', toast)
        assert 'Too close' in toast, toast
        assert sum(st()['counts'].values()) == 12
        drops = [('bruiser', 14.2, 23.4), ('bruiser', 15.2, 23.4), ('brawler', 13.6, 23.8), ('brawler', 15.6, 23.8), ('shooter', 14.0, 24.4), ('shooter', 15.0, 24.4)]
        for k, x, y in drops:
            click(f'.troop[data-k="{k}"]'); sx, sy = world(x, y); pg.mouse.click(sx, sy); pg.wait_for_timeout(150)
        s = st(); print(tag, 'after drops', s['counts'])
        assert s['counts'] == {'brawler': 4, 'shooter': 2, 'bruiser': 0}, s['counts']
        pg.wait_for_timeout(9000); pg.screenshot(path=OUT + tag + '-3-fight.png')
        t0 = time.time()
        while st()['screen'] != 'result' and time.time() - t0 < 240: pg.wait_for_timeout(1000)
        s = st(); r = pg.evaluate('TURF_TEST.result()'); print(tag, 'end', s['screen'], 'pct', r and r['pct'], 'core', r and r['coreDown'], 'ticks', r and r['ticks'])
        assert s['screen'] == 'result' and r['coreDown'], 'rescue not won'
        pg.screenshot(path=OUT + tag + '-4-result.png')
        click('#resWatch'); pg.wait_for_timeout(5000)
        assert st()['screen'] == 'watch'; pg.screenshot(path=OUT + tag + '-5-watch.png')
        click('#wSkip'); pg.wait_for_timeout(800); assert st()['screen'] == 'result', st()
        click('#resNext'); pg.wait_for_timeout(300); assert st()['screen'] == 'story'
        click('#card'); pg.wait_for_timeout(200); click('#card'); pg.wait_for_timeout(600)
        s = st(); hm = pg.evaluate('TURF_TEST.home()'); print(tag, 'after the story:', s['screen'], hm)
        assert s['screen'] == 'home' and hm['n'] == 7 and hm['cash'] == 500 and hm['sheet'] == 'crew', (s, hm)
        pg.screenshot(path=OUT + tag + '-6-home.png')
        pg.reload(); pg.wait_for_timeout(2500); print(tag, 'after reload:', pg.locator('#goBtn').inner_text(), st()['reports'], 'reports')
        assert pg.locator('#goBtn').inner_text() == 'Go to your block'
        b.close()
    errs = [e for e in errs if 'favicon' not in e]
    print(tag, 'console errors:', errs if errs else 'none')
    return not errs
ok = run(tag='gl') and run(w=844, h=390, tag='land')
print('PROOF', 'PASS' if ok else 'FAIL')
