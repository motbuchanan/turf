# Ten-fighter proof: a Gym level 5 block trains every kind, the troop bar scrolls, and a raid with one of each plays out with no errors.
import os, json, time
from playwright.sync_api import sync_playwright
URL = os.environ.get('TURF_URL', 'http://localhost:8123/index.html')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proof', ''); os.makedirs(OUT, exist_ok=True)
KINDS = ['brawler', 'shooter', 'bruiser', 'snatcher', 'breacher', 'medic', 'shotgunner', 'drone', 'biker', 'heavy']
blk = [dict(key='b1',k='house',x=13,y=12,lv=4), dict(key='b2',k='gym',x=10,y=9,lv=5), dict(key='b3',k='pad',x=17,y=9,lv=3), dict(key='b3b',k='pad',x=8,y=12,lv=3), dict(key='b4',k='stash',x=10,y=15,lv=3), dict(key='b5',k='supstash',x=17,y=15,lv=2), dict(key='b6',k='run',x=13,y=16,lv=1), dict(key='b7',k='hustle',x=15,y=18,lv=1)]
save = dict(v=1, rescued=True, reports=[], block=blk, cash=4000, sup=3000, color='lav', army=dict(brawler=4, shooter=2), nk=40, rep=0)
ok = True
def check(n, c, x=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, x, flush=True); ok = ok and bool(c)
def run(w, h, tag):
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = b.new_page(viewport={'width':w,'height':h}); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(600); pg.evaluate("s => localStorage.setItem('turf.save.v1', s)", json.dumps(save)); pg.reload(); pg.wait_for_timeout(1800)
        pg.click('#goBtn'); pg.wait_for_timeout(900); pg.click('#hTrain'); pg.wait_for_timeout(500)
        for k in KINDS[2:]:
            pg.locator(f'[data-train="{k}"][data-n="1"]').scroll_into_view_if_needed(); pg.click(f'[data-train="{k}"][data-n="1"]'); pg.wait_for_timeout(120)
        army = pg.evaluate('TURF_TEST.home()')['army']
        check(tag + ': one of each new fighter trained', all(army[k] == 1 for k in KINDS[2:]), str(army))
        pg.screenshot(path=OUT + tag + '-fighters-crew.png'); pg.click('#sheetX'); pg.wait_for_timeout(200)
        pg.click('#hAttack'); pg.wait_for_timeout(400); pg.click('[data-hit="-1"]'); pg.wait_for_timeout(1200)
        bar = pg.evaluate("(() => { const b = document.getElementById('bar'), r = b.getBoundingClientRect(); return {cards:b.children.length, sw:b.scrollWidth, cw:b.clientWidth, top:r.top, h:innerHeight}; })()")
        check(tag + ': bar shows all ten kinds in one row (bosses sit out the corner)', bar['cards'] == 10 and bar['top'] > bar['h'] * .55, str(bar))
        n = 0
        for i, k in enumerate(KINDS):
            for j in range(army[k]):
                card = pg.locator(f'.troop[data-k="{k}"]'); card.scroll_into_view_if_needed(); card.click()
                for dx in range(12):   # a drop spot the troop bar does not cover, like a player would pick
                    q = pg.evaluate(f'TURF_TEST.toScreen({12.6 + (n % 9) * .4 - dx * .5},{23.4 + (n // 9) * .5})')
                    if pg.evaluate(f"document.elementFromPoint({q[0]},{q[1]}).tagName") == 'CANVAS': break
                pg.mouse.click(q[0], q[1]); pg.wait_for_timeout(90); n += 1
        pg.wait_for_timeout(5000); pg.screenshot(path=OUT + tag + '-fighters-raid.png')
        st = pg.evaluate('TURF_TEST.state()'); check(tag + ': every fighter was dropped', sum(v for k, v in st['counts'].items() if not k.startswith('b:')) == 0, str(st['counts']))
        t0 = time.time()
        while pg.evaluate('TURF_TEST.state().screen') != 'result' and time.time() - t0 < 100: pg.wait_for_timeout(1000)
        if pg.evaluate('TURF_TEST.state().screen') != 'result': pg.click('#endBtn'); pg.wait_for_timeout(2500)
        check(tag + ': raid ends on the result screen', pg.evaluate('TURF_TEST.state().screen') == 'result', pg.locator('#resPct').inner_text())
        pg.click('#resWatch'); pg.wait_for_timeout(4000); check(tag + ': Watch plays the raid back', pg.evaluate('TURF_TEST.state().screen') == 'watch')
        check(tag + ': no console errors', not errs, str(errs[:3]))
        b.close()
run(390, 844, 'tall'); run(844, 390, 'land')
print('FIGHTERS', 'PASS' if ok else 'FAIL')
