# Streets proof (v0.4): open the streets from your block, pick Night, hit the first rival block, finish, check the record,
# loot share and unlock, watch the replay in the dark, and check locked blocks refuse. Phone upright and sideways.
import os, json
from playwright.sync_api import sync_playwright
URL = os.environ.get('TURF_URL', 'http://localhost:8123/index.html')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proof', ''); os.makedirs(OUT, exist_ok=True)
blk = [dict(key='b1',k='house',x=13,y=12,lv=2), dict(key='b2',k='gym',x=10,y=9,lv=3), dict(key='b3',k='pad',x=17,y=9,lv=2), dict(key='b4',k='stash',x=10,y=15,lv=2), dict(key='b5',k='supstash',x=17,y=15,lv=2), dict(key='b6',k='run',x=13,y=16,lv=1)]
save = dict(v=1, rescued=True, reports=[], block=blk, cash=500, sup=500, color='teal', army=dict(brawler=12, shooter=8, bruiser=1), nk=40, rep=0)
ok = True
def check(n, c, x=''):
    global ok; print(('PASS ' if c else 'FAIL ') + n, x, flush=True); ok = ok and bool(c)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for tag, vp in (('tall', dict(width=390, height=844)), ('wide', dict(width=844, height=390))):
        pg = b.new_page(viewport=vp, device_scale_factor=2); errs = []
        pg.add_init_script("try{localStorage.setItem('turf.intro.v1','1')}catch(e){}")   # these proofs skip the intro
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(600); pg.evaluate("s => localStorage.setItem('turf.save.v1', s)", json.dumps(save)); pg.reload(); pg.wait_for_timeout(1800)
        pg.click('#goBtn'); pg.wait_for_timeout(900)
        pg.click('#hAttack'); pg.wait_for_timeout(500)
        txt = pg.locator('#sheetBody').inner_text()
        check(tag + ': the streets list six crews', all(n in txt for n in ['The Boombox Kings', 'Gold Note', 'The Basement', 'Afterhours', 'The Yard', 'Chrome Tide']))
        check(tag + ': 24 block buttons, only the first open', pg.locator('.blk').count() == 24 and pg.locator('.blk:not(.no)').count() == 1, str(pg.locator('.blk:not(.no)').count()))
        pg.click('[data-tod="night"]'); pg.wait_for_timeout(300)
        check(tag + ': Night is picked and saved', pg.evaluate('TURF_TEST.camp()')['night'] is True and pg.locator('[data-tod="night"].on').count() == 1)
        pg.screenshot(path=OUT + 'turf-v0.4-streets-' + tag + '.png')
        L = pg.locator('.blk').nth(1); L.scroll_into_view_if_needed(); bb = L.bounding_box(); pg.mouse.click(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); pg.wait_for_timeout(400)
        check(tag + ': a locked block does not start a fight', pg.evaluate('TURF_TEST.state()')['screen'] == 'home')
        pg.locator('.blk').nth(0).scroll_into_view_if_needed(); pg.locator('.blk').nth(0).click(); pg.wait_for_timeout(1500)
        s = pg.evaluate('TURF_TEST.state()'); check(tag + ': block 1 starts a fight with the whole crew and the three bosses', s['screen'] == 'hud' and s['counts'] == {'brawler':12, 'shooter':8, 'bruiser':1, 'b:enforcer':1, 'b:deadeye':1, 'b:shotcaller':1}, str(s))
        hour = pg.evaluate('VIL.getHour()'); check(tag + ': the fight is lit for night', hour == 22.5, str(hour))
        def drop(k, x, y):
            pg.click('.troop[data-k="%s"]' % k); q = pg.evaluate(f'TURF_TEST.toScreen({x},{y})'); pg.mouse.click(q[0], q[1]); pg.wait_for_timeout(70)
        drop('bruiser', 14.5, 23.3)
        for n in range(12): drop('brawler', 12.6 + n * .4, 23.5)
        for n in range(7): drop('shooter', 13 + n * .4, 24.1)
        pg.wait_for_timeout(1200); pg.screenshot(path=OUT + 'turf-v0.4-night-' + tag + '.png')
        for _ in range(70):
            if pg.evaluate('TURF_TEST.state()')['screen'] == 'result' or pg.evaluate('TURF_TEST.result()')['allDown']: break
            pg.wait_for_timeout(1000)
        if pg.evaluate('TURF_TEST.state()')['screen'] != 'result': pg.click('#endBtn')
        for _ in range(10):
            if pg.evaluate('TURF_TEST.state()')['screen'] == 'result': break
            pg.wait_for_timeout(500)
        check(tag + ': the fight ends on the result screen', pg.evaluate('TURF_TEST.state()')['screen'] == 'result')
        title = pg.inner_text('#resTitle'); check(tag + ': the result names the crew', 'Boombox Kings' in title, title)
        c = pg.evaluate('TURF_TEST.camp()')['camp']; rec = c.get('0-0')
        res = pg.evaluate('TURF_TEST.result()'); stars = (res['pct'] >= 50) + bool(res['coreDown']) + bool(res['allDown'])
        check(tag + ': the block keeps its stars and what was taken', rec is not None and rec['s'] == stars and rec['t'][0] > 0, str(rec) + ' stars ' + str(stars))
        pool = 400; check(tag + ': night pays at most 75% of the block', rec['t'][0] <= int(pool * .75), str(rec['t']))
        check(tag + ': next button goes back to the streets', pg.inner_text('#resNext') == 'Back to the streets')
        pg.click('#resWatch'); pg.wait_for_timeout(1500)
        check(tag + ': the replay is lit for night too', pg.evaluate('VIL.getHour()') == 22.5 and pg.evaluate('TURF_TEST.state()')['screen'] == 'watch')
        pg.click('#wSkip'); pg.wait_for_timeout(1500)
        if pg.evaluate('TURF_TEST.state()')['screen'] == 'watch': pg.wait_for_timeout(4000)
        pg.click('#resNext'); pg.wait_for_timeout(900)
        s = pg.evaluate('TURF_TEST.state()'); open_n = pg.locator('.blk:not(.no)').count()
        check(tag + ': back on your block with the streets open', s['screen'] == 'home' and pg.evaluate('TURF_TEST.home()')['sheet'] == 'streets', str(s))
        check(tag + ': the clock lights your block again', pg.evaluate('VIL.getHour()') is None)
        check(tag + ': a star opened block 2', open_n == (2 if stars else 1), str(open_n))
        pg.click('[data-tod="day"]'); pg.wait_for_timeout(200)
        pg.click('[data-hit="-1"]'); pg.wait_for_timeout(1200)
        check(tag + ': the Boombox corner still works and follows the clock', pg.evaluate('TURF_TEST.state()')['screen'] == 'hud' and pg.evaluate('VIL.getHour()') is None)
        pg.reload(); pg.wait_for_timeout(1800)
        check(tag + ': the street record survives a reload', pg.evaluate('TURF_TEST.camp()')['camp'].get('0-0') == rec)
        check(tag + ': no console errors', not errs, str(errs[:3]))
        pg.close()
    b.close()
print('STREETS', 'PASS' if ok else 'FAIL')
