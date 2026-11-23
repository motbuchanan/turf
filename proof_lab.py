# Research proof: build a Workshop, research the Brawler, see it on the crew list, raid, and check the raid used the stronger Brawlers.
import os, json, time
from playwright.sync_api import sync_playwright
URL = os.environ.get('TURF_URL', 'http://localhost:8123/index.html')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proof', ''); os.makedirs(OUT, exist_ok=True)
blk = [dict(key='b1',k='house',x=13,y=12,lv=2), dict(key='b2',k='gym',x=10,y=9,lv=2), dict(key='b3',k='pad',x=17,y=9,lv=1), dict(key='b4',k='stash',x=10,y=15,lv=2), dict(key='b5',k='supstash',x=17,y=15,lv=2), dict(key='b6',k='run',x=13,y=16,lv=1)]
save = dict(v=1, rescued=True, reports=[], block=blk, cash=2000, sup=2000, color='teal', army=dict(brawler=8, shooter=4), nk=40, rep=0)
ok = True
def check(n, c, x=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, x, flush=True); ok = ok and bool(c)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2); errs = []
    pg.add_init_script("try{localStorage.setItem('turf.intro.v1','1')}catch(e){}")   # these proofs skip the intro
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(600); pg.evaluate("s => localStorage.setItem('turf.save.v1', s)", json.dumps(save)); pg.reload(); pg.wait_for_timeout(1800)
    pg.click('#goBtn'); pg.wait_for_timeout(900); hm = lambda: pg.evaluate('TURF_TEST.home()')
    pg.click('#hBuild'); pg.wait_for_timeout(300); pg.locator('[data-buy="workshop"]').scroll_into_view_if_needed(); pg.click('[data-buy="workshop"]'); pg.wait_for_timeout(600)
    h = hm(); check('Workshop bought for 400 Cash and 300 Supplies, its sheet open', h['cash'] == 1600 and h['sup'] == 1700 and h['sheet'] == 'info', str(h))
    pg.click('[data-act="lab"]'); pg.wait_for_timeout(400); check('Research sheet opens', hm()['sheet'] == 'lab')
    pg.screenshot(path=OUT + 'lab-sheet.png')
    pg.click('[data-lab="brawler"]'); pg.wait_for_timeout(400); h = hm(); r = pg.evaluate("JSON.parse(localStorage.getItem('turf.save.v1')).research")
    check('Brawler researched to level 2 for 60 Supplies', r.get('brawler') == 2 and h['sup'] == 1640, str(r) + ' ' + str(h['sup']))
    check('level 2 is the Workshop level 1 limit: no further button', pg.locator('[data-lab="brawler"]').count() == 0)
    pg.click('#sheetX'); pg.wait_for_timeout(200); pg.click('#hTrain'); pg.wait_for_timeout(400)
    check('crew list shows Brawler Lv 2', 'Brawler Lv 2' in pg.locator('#sheetBody').inner_text())
    pg.click('#sheetX'); pg.reload(); pg.wait_for_timeout(1800); pg.click('#goBtn'); pg.wait_for_timeout(900)
    check('research survives a reload', pg.evaluate("JSON.parse(localStorage.getItem('turf.save.v1')).research.brawler") == 2)
    pg.click('#hAttack'); pg.wait_for_timeout(400); pg.click('[data-hit="-1"]'); pg.wait_for_timeout(1200)
    for n in range(8):
        pg.click('.troop[data-k="brawler"]'); q = pg.evaluate(f'TURF_TEST.toScreen({13.2 + n * .35},23.6)'); pg.mouse.click(q[0], q[1]); pg.wait_for_timeout(90)
    pg.click('#endBtn'); pg.wait_for_timeout(2500)
    hp = pg.evaluate("(JSON.parse(localStorage.getItem('turf.save.v1')).reports[0].recipe.attackers.find(a => a.type === 'brawler') || {}).hp")
    check('the raid used 165 hp Brawlers', hp == 165, str(hp))
    check('no console errors', not errs, str(errs[:3]))
    b.close()
print('LAB', 'PASS' if ok else 'FAIL')
