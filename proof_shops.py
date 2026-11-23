# Neighborhood buildings proof: a level-3 block buys a Pharmacy, a Hardware Store and a Recording Studio, sees prices drop, raids, and gets Rep and patched-up crew back.
import os, json, time
from playwright.sync_api import sync_playwright
URL = os.environ.get('TURF_URL', 'http://localhost:8123/index.html')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proof', ''); os.makedirs(OUT, exist_ok=True)
blk = [dict(key='b1',k='house',x=13,y=12,lv=3), dict(key='b2',k='gym',x=10,y=9,lv=1), dict(key='b3',k='pad',x=17,y=9,lv=1), dict(key='b4',k='stash',x=10,y=15,lv=2), dict(key='b5',k='supstash',x=17,y=15,lv=2), dict(key='b6',k='run',x=13,y=16,lv=1), dict(key='b7',k='hustle',x=15,y=18,lv=1)]
save = dict(v=1, rescued=True, reports=[], block=blk, cash=4000, sup=3000, color='lav', army=dict(brawler=8, shooter=4, bruiser=0), nk=40, rep=0)
ok = True
def check(n, c, x=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, x, flush=True); ok = ok and bool(c)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width':844,'height':390}); errs = []
    pg.add_init_script("try{localStorage.setItem('turf.intro.v1','1')}catch(e){}")   # these proofs skip the intro
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(600); pg.evaluate("s => localStorage.setItem('turf.save.v1', s)", json.dumps(save)); pg.reload(); pg.wait_for_timeout(1800)
    pg.click('#goBtn'); pg.wait_for_timeout(900)
    hm = lambda: pg.evaluate('TURF_TEST.home()')
    def buy(k):
        pg.click('#hBuild'); pg.wait_for_timeout(300); pg.locator(f'[data-buy="{k}"]').scroll_into_view_if_needed(); pg.click(f'[data-buy="{k}"]'); pg.wait_for_timeout(500); pg.click('#sheetX'); pg.wait_for_timeout(200)
    h0 = hm(); buy('hardware'); h1 = hm(); check('Hardware Store costs 700 Cash and 300 Supplies', (h0['cash'] - h1['cash'], h0['sup'] - h1['sup']) == (700, 300), str((h0, h1)))
    buy('pharmacy'); h2 = hm(); check('Pharmacy is 15% off once the Hardware Store is up (500/250 -> 430/210)', (h1['cash'] - h2['cash'], h1['sup'] - h2['sup']) == (430, 210), str(h2))
    buy('studio'); h3 = hm(); check('Studio 15% off (600/400 -> 510/340)', (h2['cash'] - h3['cash'], h2['sup'] - h3['sup']) == (510, 340), str(h3))
    check('three new buildings on the block', h3['n'] == 10, str(h3['n']))
    pg.click('#hBuild'); pg.wait_for_timeout(300); txt = pg.locator('[data-buy="porch"] .pr').inner_text(); pg.click('#sheetX')
    check('Build list shows the discounted price', '170 Supplies' in txt, txt)
    pg.evaluate("VIL.view({zoom:4.2})"); pg.wait_for_timeout(1500); pg.screenshot(path=OUT + 'shops-block.png')
    pg.reload(); pg.wait_for_timeout(1800); pg.click('#goBtn'); pg.wait_for_timeout(900); check('survives a reload', hm()['n'] == 10)
    pg.click('#hAttack'); pg.wait_for_timeout(400); pg.click('[data-hit="-1"]'); pg.wait_for_timeout(1200)
    for n in range(8):
        pg.click('.troop[data-k="brawler"]'); q = pg.evaluate(f'TURF_TEST.toScreen({13.2 + n * .35},23.6)'); pg.mouse.click(q[0], q[1]); pg.wait_for_timeout(100)
    for n in range(4):
        pg.click('.troop[data-k="shooter"]'); q = pg.evaluate(f'TURF_TEST.toScreen({13.6 + n * .5},24.4)'); pg.mouse.click(q[0], q[1]); pg.wait_for_timeout(100)
    t0 = time.time()
    while pg.evaluate('TURF_TEST.state().screen') != 'result' and time.time() - t0 < 90: pg.wait_for_timeout(1000)
    if pg.evaluate('TURF_TEST.state().screen') != 'result': pg.click('#endBtn'); pg.wait_for_timeout(2500)
    res = pg.locator('#resPct').inner_text(); print('   ', res)
    check('result names Rep and the pharmacy', 'Rep' in res and 'patched up 3' in res, res)
    pg.click('#resNext'); pg.wait_for_timeout(900); h = hm(); rep = pg.evaluate("JSON.parse(localStorage.getItem('turf.save.v1')).rep")
    check('patched-up crew is home (2 Brawlers, 1 Shooter at 25%)', {k: v for k, v in h['army'].items() if v} == {k: v for k, v in {'brawler': 2, 'shooter': 1, 'bruiser': 0}.items() if v}, str(h['army']))
    check('Rep saved and shown', rep > 0 and pg.locator('#hRep').inner_text() == str(rep), str(rep))
    check('no console errors', not errs, str(errs[:3]))
    b.close()
print('SHOPS', 'PASS' if ok else 'FAIL')
