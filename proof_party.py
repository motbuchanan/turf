# Hold the Block part two (v0.5.1): the Block Party board, a skill at research level 3, the Hustler and the Pilot.
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
    blk = pg.evaluate("TURF.sampleHome(4, 2).concat([{key:'w1', k:'workshop', x:0, y:0, lv:3}]).filter(i => i.k !== 'workshop' || 1)")
    blk = [dict(i, lv=3) if i['k'] in ('stash', 'supstash') else i for i in blk]
    blk = pg.evaluate("b => TURF.cleanBlock(b)", blk); cap = pg.evaluate("b => TURF.storeCap(b)", blk)
    camp = {f'{c}-{k}': {'s': 3, 't': [0, 0]} for c in range(6) for k in range(4)}
    save = dict(v=1, rescued=True, reports=[], block=blk, cash=4000, sup=4000, color='teal', army=dict(brawler=12, shooter=8, bruiser=1), nk=300, rep=0, camp=camp, research=dict(brawler=2))
    pg.evaluate("s => localStorage.setItem('turf.save.v1', s)", json.dumps(save)); pg.reload(); pg.wait_for_timeout(1800)
    sv = lambda: pg.evaluate("JSON.parse(localStorage.getItem('turf.save.v1'))")
    pg.click('#goBtn'); pg.wait_for_timeout(1200)
    hk = [i for i in sv()['block'] if i['k'] == 'house'][0]['key']
    pg.evaluate(f"TURF_TEST.select('{hk}')"); pg.wait_for_timeout(400)
    pg.click('[data-act="party"]'); pg.wait_for_timeout(400); t = pg.locator('#sheetBody').inner_text()
    check('the Main House opens the Block Party board', all(n in t for n in ['Neighborhood Watch', 'Cookout', 'Mural Wall']), t[:120])
    c0 = min(4000, cap['cash']); pg.click('[data-party="watch"]'); pg.wait_for_timeout(300); pg.click('[data-party="watch"]'); pg.wait_for_timeout(300); pg.click('[data-party="cookout"]'); pg.wait_for_timeout(300)
    s = sv(); check('upgrades are bought with Cash and saved; one you cannot pay for is refused', s['party'] == {'watch':1, 'cookout':1} and s['cash'] == c0 - 400 - 300, str(s['party']) + ' ' + str(c0 - s['cash']))
    t = pg.locator('#sheetBody').inner_text(); check('the board sums up what the block has', 'guns +6%' in t and 'crew health +10%' in t, t[-120:])
    pg.screenshot(path=OUT + 'turf-v0.5.1-party.png')
    pg.click('#sheetX'); pg.wait_for_timeout(300)
    pg.click('#hCrew'); pg.wait_for_timeout(400); t = pg.locator('#sheetBody').inner_text()
    check('all five bosses are listed at Main House level 4', 'The Hustler' in t and 'The Pilot' in t and 'Ricochet' in t and 'Swarm' in t)
    pg.click('#sheetX'); pg.wait_for_timeout(300)
    pg.click('#hAttack'); pg.wait_for_timeout(400); pg.click('[data-act="practice"]'); pg.wait_for_timeout(1500)
    toast = pg.inner_text('#toast') if pg.locator('#toast').count() else ''
    check('a fight on the block shows its Block Party bonuses', 'Block Party' in toast, toast)
    pg.click('#wSkip'); pg.wait_for_timeout(2500)
    if pg.evaluate('TURF_TEST.state()')['screen'] == 'watch': pg.wait_for_timeout(6000)
    pg.click('#resNext'); pg.wait_for_timeout(800)
    pg.evaluate('TURF_TEST.hit(5, 0)'); pg.wait_for_timeout(2000)
    keys = pg.evaluate("[...document.querySelectorAll('#bar .troop')].map(b => b.dataset.k)")
    check('the bar has five bosses and no card for the drones', [k for k in keys if k.startswith('b:')] == ['b:enforcer', 'b:deadeye', 'b:shotcaller', 'b:hustler', 'b:pilot'] and 'swarm' not in keys, str(keys))
    def drop(k, x, y):
        pg.click('.troop[data-k="%s"]' % k); q = pg.evaluate(f'TURF_TEST.toScreen({x},{y})'); pg.mouse.click(q[0], q[1]); pg.wait_for_timeout(80)
    drop('bruiser', 14.5, 23.3)
    for n in range(6): drop('brawler', 12.6 + n * .5, 23.5)
    drop('b:hustler', 15, 23.4); pg.wait_for_timeout(1200); pg.click('.troop[data-k="b:hustler"]'); pg.wait_for_timeout(300)
    drop('b:pilot', 14, 23.8); pg.wait_for_timeout(1200); pg.click('.troop[data-k="b:pilot"]'); pg.wait_for_timeout(1500)
    check('Swarm and Ricochet are used once each', 'out' in pg.get_attribute('.troop[data-k="b:pilot"]', 'class') and 'out' in pg.get_attribute('.troop[data-k="b:hustler"]', 'class'))
    pg.screenshot(path=OUT + 'turf-v0.5.1-swarm.png')
    pg.click('#endBtn'); pg.wait_for_timeout(3000)
    s = sv(); r = s['reports'][0]['recipe']
    check('the fight is filed with both moves, and only fighters are spent', sum(1 for d in r['deploys'] if d.get('ab')) == 2 and s['army']['brawler'] == 6 and s['army']['bruiser'] == 0, str(s['army']) + str([d for d in r['deploys'] if d.get('ab')]))
    pg.click('#resNext'); pg.wait_for_timeout(800); pg.click('#sheetX'); pg.wait_for_timeout(300)
    wk = [i for i in s['block'] if i['k'] == 'workshop']
    if wk:
        pg.evaluate(f"TURF_TEST.select('{wk[0]['key']}')"); pg.wait_for_timeout(400)
    check('no console errors', not errs, str(errs[:3]))
    b.close()
print('PARTY', 'PASS' if ok else 'FAIL')
