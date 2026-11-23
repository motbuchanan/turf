# Hold the Block proof (v0.5): your block with the new defenses, traps, streetlights and fence levels; level all fences of a kind;
# run Test your block and watch it; a rival block at night with its streetlights, its traps hidden until they go off.
import os, json
from playwright.sync_api import sync_playwright
URL = os.environ.get('TURF_URL', 'http://localhost:8123/index.html')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proof', ''); os.makedirs(OUT, exist_ok=True)
ok = True
def check(n, c, x=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, x, flush=True); ok = ok and bool(c)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport=dict(width=844, height=390), device_scale_factor=2); errs = []
    pg.add_init_script("try{localStorage.setItem('turf.intro.v1','1')}catch(e){}")   # these proofs skip the intro
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1200)
    blk = pg.evaluate("(() => { let n = 0; return TURF.sampleHome(3, 2).filter(i => i.k !== 'fence' || n++ < 30).map(i => i.k === 'fence' ? Object.assign(i, {lv:1}) : i); })()")   # 30 pieces: all of them to wood fits the 1000 Supplies a block with no Supply Stash holds
    camp = {f'{c}-{k}': {'s': 3, 't': [0, 0]} for c in range(6) for k in range(4)}
    save = dict(v=1, rescued=True, reports=[], block=blk, cash=2500, sup=4000, color='teal', army=dict(brawler=12, shooter=8, bruiser=1), nk=200, rep=0, camp=camp)
    pg.evaluate("s => localStorage.setItem('turf.save.v1', s)", json.dumps(save)); pg.reload(); pg.wait_for_timeout(1800)
    sv = lambda: pg.evaluate("JSON.parse(localStorage.getItem('turf.save.v1'))")
    pg.click('#goBtn'); pg.wait_for_timeout(1500)
    pg.add_style_tag(content='#badge{opacity:.3}'); pg.screenshot(path=OUT + 'turf-v0.5-home.png')
    pg.click('#hBuild'); pg.wait_for_timeout(400); t = pg.locator('#sheetBody').inner_text()
    check('the Build list has the new defenses, the streetlight and the traps', all(n in t for n in ['Bottle Rocket Roof', 'Signal Jammer', 'Shotgun Window', 'Pop-up Window', 'Streetlight', 'Nail Strip', 'Open Manhole', 'Ambush Closet', 'Kite Line']))
    pg.click('#sheetX'); pg.wait_for_timeout(300)
    fk = [i for i in blk if i['k'] == 'fence'][0]['key']
    pg.evaluate(f"TURF_TEST.select && TURF_TEST.select('{fk}')"); pg.wait_for_timeout(500)
    t = pg.locator('#sheetBody').inner_text()
    check('a chain-link fence offers wood, one piece or all of them', 'Make it Wood Fence' in t and 'All ' in t, t[:200])
    if 'All ' in t:
        pg.click('[data-act="upall"]'); pg.wait_for_timeout(500)
        s = sv(); check('every chain-link piece became wood', all(i.get('lv', 1) == 2 for i in s['block'] if i['k'] == 'fence'))
        pg.wait_for_timeout(200)
    pg.click('#sheetX'); pg.wait_for_timeout(600); pg.screenshot(path=OUT + 'turf-v0.5-wood.png')
    c0 = sv()['cash']
    pg.click('#hAttack'); pg.wait_for_timeout(400); pg.click('[data-act="practice"]'); pg.wait_for_timeout(2500)
    check('Test your block plays as a replay', pg.evaluate('TURF_TEST.state()')['screen'] == 'watch')
    pg.wait_for_timeout(4000); pg.screenshot(path=OUT + 'turf-v0.5-practice.png')
    pg.click('#wSkip'); pg.wait_for_timeout(2500)
    if pg.evaluate('TURF_TEST.state()')['screen'] == 'watch': pg.wait_for_timeout(6000)
    title = pg.inner_text('#resTitle'); check('the test ends with how your block did', title in ('Your block held', 'They took your Main House'), title)
    s = sv(); check('practice costs and pays nothing and is not filed', s['cash'] == c0 and len(s['reports']) == 0 and s.get('tries', 0) == 0, str((s['cash'], len(s['reports']))))
    pg.click('#resNext'); pg.wait_for_timeout(800)
    pg.click('#hAttack'); pg.wait_for_timeout(300); pg.click('[data-tod="night"]'); pg.wait_for_timeout(200)
    pg.evaluate('TURF_TEST.hit(3, 3)'); pg.wait_for_timeout(2500)
    st = pg.evaluate('TURF_TEST.state()'); check('the Afterhours boss block opens at night', st['screen'] == 'hud' and pg.evaluate('VIL.getHour()') == 22.5)
    pg.screenshot(path=OUT + 'turf-v0.5-afterhours-night.png')
    check('no console errors', not errs, str(errs[:3]))
    b.close()
print('DEFENSE', 'PASS' if ok else 'FAIL')
