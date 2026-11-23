# Home block proof: an old save (rescued, no block) lands on a starter block; colors, training, buying, moving, fence, reload, a loot raid.
import sys, time, json
import os
from playwright.sync_api import sync_playwright
URL = os.environ.get('TURF_URL', 'http://localhost:8123/index.html')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proof', ''); os.makedirs(OUT, exist_ok=True)
UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
def run(nogl=False, w=390, h=844, tag='home'):
    errs = []
    with sync_playwright() as p:
        args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] + (['--disable-webgl', '--disable-webgl2'] if nogl else [])
        b = p.chromium.launch(args=args)
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, user_agent=UA, has_touch=False)
        pg = ctx.new_page()
        pg.add_init_script("try{localStorage.setItem('turf.intro.v1','1')}catch(e){}")   # these proofs skip the intro
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(800)
        pg.evaluate("localStorage.setItem('turf.save.v1', JSON.stringify({v:1, rescued:true, best:2, tries:1, reports:[]}))")
        pg.reload(); pg.wait_for_timeout(2500)
        st = lambda: pg.evaluate('TURF_TEST.state()'); hm = lambda: pg.evaluate('TURF_TEST.home()'); blk = lambda: pg.evaluate('TURF_TEST.block()')
        def click(sel):
            pg.locator(sel).first.scroll_into_view_if_needed(); bb = pg.locator(sel).first.bounding_box(); pg.mouse.click(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
        def world(x, y):
            if not nogl: return pg.evaluate(f'TURF_TEST.toScreen({x},{y})')
            s = min(w, h) / 28; return [(w - s * 28) / 2 + x * s, (h - s * 28) / 2 + y * s]
        assert pg.locator('#goBtn').inner_text() == 'Go to your block'
        click('#goBtn'); pg.wait_for_timeout(900)
        s, H = st(), hm(); print(tag, 'old save ->', s['screen'], H)
        assert s['screen'] == 'home' and H['n'] == 7 and H['cash'] == 500 and H['sup'] == 300 and H['sheet'] == 'crew' and {k: v for k, v in H['army'].items() if v} == {k: v for k, v in {'brawler': 6, 'shooter': 4, 'bruiser': 0}.items() if v}, H
        pg.screenshot(path=OUT + tag + '-1-crew.png')
        click('[data-col="teal"]'); pg.wait_for_timeout(400); assert hm()['color'] == 'teal'
        click('[data-train="brawler"][data-n="1"]'); pg.wait_for_timeout(200); click('[data-train="brawler"][data-n="1"]'); pg.wait_for_timeout(200)
        H = hm(); assert H['army']['brawler'] == 8 and H['cash'] == 460, H
        click('[data-train="bruiser"]') if pg.locator('[data-train="bruiser"]').count() else None
        assert hm()['army']['bruiser'] == 0
        click('#sheetX'); pg.wait_for_timeout(300); assert hm()['sheet'] is None
        pg.screenshot(path=OUT + tag + '-2-block.png')
        # buy a Supply Stash, then move it
        click('#hBuild'); pg.wait_for_timeout(300); pg.screenshot(path=OUT + tag + '-3-shop.png')
        click('[data-buy="supstash"]'); pg.wait_for_timeout(700)
        H = hm(); B = blk(); it = [i for i in B if i['k'] == 'supstash'][0]; print(tag, 'bought', it, H)
        assert H['n'] == 8 and H['cash'] == 360 and H['sel'] == it['key'] and H['sheet'] == 'info', H
        tx, ty = 13, 10
        if nogl:
            sx, sy = world(tx + .5, ty + .5); pg.mouse.click(sx, sy); pg.wait_for_timeout(400)
        else:
            a = pg.evaluate(f"TURF_TEST.toScreen({it['x'] + 1},{it['y'] + 1},1.0)"); g0 = world(it['x'] + 1, it['y'] + 1); g1 = world(tx + 1, ty + 1); c = [a[0] + g1[0] - g0[0], a[1] + g1[1] - g0[1]]; sheet = pg.locator('#sheet').bounding_box()
            inside = sheet['x'] <= a[0] <= sheet['x'] + sheet['width'] and sheet['y'] <= a[1] <= sheet['y'] + sheet['height']
            print(tag, 'new building at', [round(v) for v in a], 'under the sheet:', inside); assert not inside
            pg.mouse.move(a[0], a[1]); pg.mouse.down()
            for n in range(1, 11): pg.mouse.move(a[0] + (c[0] - a[0]) * n / 10, a[1] + (c[1] - a[1]) * n / 10); pg.wait_for_timeout(40)
            pg.wait_for_timeout(200); pg.screenshot(path=OUT + tag + '-4-drag.png'); pg.mouse.up(); pg.wait_for_timeout(500)
        it2 = [i for i in blk() if i['k'] == 'supstash'][0]; print(tag, 'moved to', it2['x'], it2['y'])
        assert (it2['x'], it2['y']) != (it['x'], it['y']), 'did not move'
        if nogl: assert (it2['x'], it2['y']) == (tx, ty)
        click('#sheetX'); pg.wait_for_timeout(300)
        # fence: lay four pieces, try to lay one outside the lot
        click('#hBuild'); pg.wait_for_timeout(300); click('[data-act="lay"]'); pg.wait_for_timeout(400); assert hm()['fence'] == 'paint'
        free = [(x, 18) for x in range(10, 19)] if False else None
        B = blk(); occ = set()
        fp = {'house': (3, 3), 'gym': (3, 2), 'pad': (2, 3), 'store': (3, 2)}
        for i in B:
            fw, fh = fp.get(i['k'], (2, 2))
            for dx in range(fw):
                for dy in range(fh): occ.add((i['x'] + dx, i['y'] + dy))
        row = [(12, 11), (12, 12), (12, 13), (12, 14)]; assert not any(q in occ for q in row)
        if nogl:
            for x, y in row: sx, sy = world(x + .5, y + .5); pg.mouse.click(sx, sy); pg.wait_for_timeout(150)
        else:
            pts = [world(x + .5, y + .5) for x, y in row]; pg.mouse.move(*pts[0]); pg.mouse.down()
            for q in pts[1:]:
                pg.mouse.move(q[0], q[1], steps=6); pg.wait_for_timeout(80)
            pg.mouse.up(); pg.wait_for_timeout(300)
        sx, sy = world(8.5, 8.5); pg.mouse.click(sx, sy); pg.wait_for_timeout(300)
        nf = len([i for i in blk() if i['k'] == 'fence']); H = hm(); print(tag, 'fences', nf, 'supplies', H['sup'])
        assert nf >= 3 and H['sup'] == 300 - 10 * nf, (nf, H)
        pg.screenshot(path=OUT + tag + '-5-fence.png')
        click('#hHintDone'); pg.wait_for_timeout(300); assert hm()['fence'] is None
        # tap the Gym: it cannot level up yet (480 Supplies)
        if not nogl: pg.evaluate('VIL.view({tx:13, ty:12.5})'); pg.wait_for_timeout(300)
        sx, sy = world(11.5, 10.2) if nogl else pg.evaluate('TURF_TEST.toScreen(11.5,10.2,1.4)'); pg.mouse.click(sx, sy); pg.wait_for_timeout(500)
        H = hm(); gym = [i for i in blk() if i['k'] == 'gym'][0]; print(tag, 'tap gym ->', H['sel'], H['sheet'])
        assert H['sel'] == gym['key'] and H['sheet'] == 'info', H
        click('[data-act="up"]'); pg.wait_for_timeout(300); assert [i for i in blk() if i['k'] == 'gym'][0]['lv'] == 1
        click('#sheetX'); pg.wait_for_timeout(200)
        # reload: everything is still there
        n0 = hm()['n']; pg.reload(); pg.wait_for_timeout(2500); click('#goBtn'); pg.wait_for_timeout(900)
        H = hm(); print(tag, 'after reload', H); assert H['n'] == n0 and H['color'] == 'teal' and H['army']['brawler'] == 8 and H['sheet'] is None, H
        # a loot raid with the trained crew
        click('#hAttack'); pg.wait_for_timeout(400); click('[data-hit="-1"]'); pg.wait_for_timeout(1200); s = st(); assert s['screen'] == 'hud' and s['counts'] == {'brawler': 8, 'shooter': 4}, s
        for n in range(8):
            click('.troop[data-k="brawler"]'); sx, sy = world(13.2 + n * .35, 23.6); pg.mouse.click(sx, sy); pg.wait_for_timeout(120)
        for n in range(4):
            click('.troop[data-k="shooter"]'); sx, sy = world(13.6 + n * .5, 24.4); pg.mouse.click(sx, sy); pg.wait_for_timeout(120)
        pg.wait_for_timeout(6000); pg.screenshot(path=OUT + tag + '-6-raid.png')
        t0 = time.time()
        while st()['screen'] != 'result' and time.time() - t0 < 90: pg.wait_for_timeout(1000)
        if st()['screen'] != 'result': print(tag, 'still fighting at tick', st()['tick'], '-> End'); click('#endBtn'); pg.wait_for_timeout(2500)
        assert st()['screen'] == 'result', st(); txt = pg.locator('#resPct').inner_text(); print(tag, 'raid result:', pg.locator('#resTitle').inner_text(), '|', txt)
        assert 'came home with' in txt
        pg.screenshot(path=OUT + tag + '-7-result.png')
        click('#resNext'); pg.wait_for_timeout(900); H2 = hm(); print(tag, 'home after raid', H2)
        assert st()['screen'] == 'home' and {k: v for k, v in H2['army'].items() if v} == {k: v for k, v in {'brawler': 0, 'shooter': 0, 'bruiser': 0}.items() if v} and H2['cash'] >= H['cash'] + 60 and H2['sup'] >= H['sup'] + 40, H2
        pg.screenshot(path=OUT + tag + '-8-home.png')
        b.close()
    errs = [e for e in errs if 'favicon' not in e]
    print(tag, 'console errors:', errs if errs else 'none')
    return not errs
which = sys.argv[1] if len(sys.argv) > 1 else 'gl'
ok = run(tag='hgl') if which == 'gl' else run(w=844, h=390, tag='hland') if which == 'land' else run(nogl=True, tag='hflat')
print('PROOF', 'PASS' if ok else 'FAIL')
