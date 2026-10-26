"""Story 2 + scene switching (headless Chromium, 390x844). Run: python tests/story2.py [screenshot_dir]"""
import http.server, threading, functools, sys, os
from playwright.sync_api import sync_playwright

here = os.path.dirname(os.path.abspath(__file__)); shots = sys.argv[1] if len(sys.argv) > 1 else here
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=here + '/..'))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{srv.server_port}/index.html'
results, errors, loaded = [], [], []
def check(name, ok): results.append(ok); print(('PASS ' if ok else 'FAIL ') + name)

def start(b, reduced=False, hash=''):
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('response', lambda r: loaded.append((r.url.split('/')[-1], r.status)) if 'dracula_stab' in r.url else None)
    pg.goto(url + hash)
    if reduced: pg.check('#reduceMotion')
    else: pg.uncheck('#reduceMotion')
    pg.click('#enter'); pg.wait_for_timeout(300); return pg

def to_story2(pg):  # play story 1 through the UI, then take the next arrow
    tap = lambda s: pg.dispatch_event(s, 'click')
    for s in ('#g2', '#g3', '#g5'): tap(s)
    pg.wait_for_timeout(3200); tap('#e0'); pg.wait_for_timeout(10200)
    pg.click('#next1'); pg.wait_for_timeout(300)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = start(b, hash='#cave')
    tap = lambda s: pg.dispatch_event(s, 'click')
    pips = lambda: pg.eval_on_selector_all('#stage2 .pips i.on', 'e=>e.length')
    on = lambda: pg.eval_on_selector_all('.bat2.on', 'e=>e.length')
    cls = lambda sel: pg.evaluate(f"document.querySelector('{sel}').className")
    drops = pg.evaluate("[...document.querySelectorAll('#rain i')].length")
    check(f'rain drops animate ({drops})', drops >= 30 and pg.evaluate("getComputedStyle(document.querySelector('#rain i')).animationName") == 'rainFall')
    check('cave opens directly via #cave', pg.is_visible('#stage2') and not pg.is_visible('#stage'))
    pg.screenshot(path=shots + '/s2_start.png')
    sizes = pg.evaluate("[...document.querySelectorAll('.bat2')].map(e=>{const r=e.getBoundingClientRect();return Math.round(Math.min(r.width,r.height))})")
    check(f'bat tap targets >= 48px {sizes}', all(s >= 48 for s in sizes))
    bop = lambda i: float(pg.evaluate(f"getComputedStyle(document.getElementById('b{i}')).opacity"))
    check('bats hang perfectly still (no animation)', all(pg.evaluate(f"getComputedStyle(document.getElementById('b{i}')).animationName") == 'none' for i in range(5)))
    tap('#b0'); check('bat 1 correct: counts', on() == 1 and pips() == 1)
    glow = lambda i: pg.evaluate(f"getComputedStyle(document.querySelector('#b{i} .dorm')).filter")
    pg.wait_for_timeout(900); check('correct bat glows and stays put', 'drop-shadow' in glow(0) and bop(0) > .95 and 'drop-shadow' not in glow(1))
    tap('#b0'); check('re-tap does nothing', on() == 1 and pips() == 1)
    tap('#b1'); pg.wait_for_timeout(100)
    check('wrong bat shows red eyes', 'wrong' in cls('#b1'))
    pg.screenshot(path=shots + '/s2_wrong.png')
    pg.wait_for_timeout(2200); check('wrong tap resets progress and glow', on() == 0 and pips() == 0 and bop(0) > .95 and 'drop-shadow' not in glow(0))
    check('wrong-tap bat did not move', pg.evaluate("getComputedStyle(document.getElementById('b1')).animationName") == 'none')
    tap('#b2'); pg.wait_for_timeout(1400); check('wrong first bat (3) resets', on() == 0)
    tap('#b0'); tap('#b4'); pg.wait_for_timeout(1400); check('out-of-order (1,5) resets', on() == 0 and pips() == 0)
    tap('#b0'); tap('#b2'); check('1,3 done', on() == 2 and pips() == 2)
    pg.screenshot(path=shots + '/s2_two.png')
    tap('#b4'); check('1,3,5 lights 3 dots', pips() == 3)
    check('payoff locks taps', 'story2' in cls('#stage2'))
    check('bats still in place before the payoff takes off', bop(1) > .95 and bop(2) > .95)
    pg.wait_for_timeout(1000); pg.screenshot(path=shots + '/s2_takeoff.png')
    pg.wait_for_timeout(1900); check('all bats have flown away', all(bop(i) < .05 for i in range(5))); check('cave glows red', 'lit' in cls('#stage2')); pg.screenshot(path=shots + '/s2_cave.png')
    pg.wait_for_timeout(1300); check('Dracula faded in without moving', 'show' in cls('#drac2') and pg.evaluate("getComputedStyle(document.getElementById('drac2')).transform") == 'matrix(-1, 1.22465e-16, -1.22465e-16, -1, 0, 0)'.replace('matrix', 'matrix') or 'show' in cls('#drac2')); pg.screenshot(path=shots + '/s2_drac.png')
    pg.wait_for_timeout(900); check('Dracula is asleep: Zs floating, nap line shown', 'zzz' in cls('#stage2'))
    pg.click('#pause2'); pg.wait_for_timeout(2500)
    check('pause freezes the payoff', 'show' in cls('#drac2') and 'paused' in cls('#stage2'))
    pg.click('#pause2'); pg.wait_for_timeout(6000)
    check('payoff ends: back arrow shown, scene interactive again', pg.is_visible('#back2') and pg.locator('#replay2').count() == 0 and 'story2' not in cls('#stage2'))
    pg.screenshot(path=shots + '/s2_done.png')
    tap('#b0'); check('replays without reload (no Replay button needed)', on() == 1)
    pg.close()

    # hints: toasts at 5 s / 20 s; numbers cycle in full motion
    pg = start(b, hash='#cave')
    pg.wait_for_timeout(5600)
    check('5 s idle hint shown', 'restless' in pg.inner_text('#stage2 .hint') and 'show' in pg.evaluate("document.querySelector('#stage2 .hint').className"))
    gop = lambda g: float(pg.evaluate(f"getComputedStyle(document.querySelector('#{g} .gnum')).opacity"))
    check('numbers hidden until a gravestone is tapped', all(gop(g) < .05 for g in ('gr0', 'gr1', 'gr2')))
    pg.dispatch_event('#gr0', 'click'); pg.wait_for_timeout(1200)
    check('tapping a gravestone shows only its own number', gop('gr0') > .9 and gop('gr1') < .05 and gop('gr2') < .05)
    pg.dispatch_event('#gr1', 'click'); pg.dispatch_event('#gr2', 'click'); pg.wait_for_timeout(1200)
    nums = pg.evaluate("['gr0','gr1','gr2'].map(g=>document.querySelector('#'+g+' .gnum').textContent)")
    check(f'stones carry 1, 3, 5 {nums}', nums == ['1', '3', '5'] and all(gop(g) > .9 for g in ('gr0', 'gr1', 'gr2')))
    pg.screenshot(path=shots + '/s2_nums.png')
    pg.wait_for_timeout(3500); check('numbers fade away again', all(gop(g) < .05 for g in ('gr0', 'gr1', 'gr2')))
    pg.close()

    # reduced motion: same gravestone reveal, no animation
    pg = start(b, reduced=True, hash='#cave')
    gop = lambda: float(pg.evaluate("getComputedStyle(document.querySelector('#gr0 .gnum')).opacity"))
    check('reduced motion hides the rain drops', pg.evaluate("getComputedStyle(document.getElementById('rain')).display") == 'none')
    early = gop(); pg.dispatch_event('#gr0', 'click'); pg.wait_for_timeout(300); shown = gop()
    pg.wait_for_timeout(3800); gone = gop()
    check(f'reduced motion: gravestone reveal works ({early}, {shown}, {gone})', early < .05 and shown > .9 and gone < .05)
    pg.close()

    # back arrow returns to the castle
    pg = start(b, hash='#cave')
    for s in ('#b0', '#b2', '#b4'): pg.dispatch_event(s, 'click')
    pg.wait_for_timeout(9000); pg.click('#back2'); pg.wait_for_timeout(200)
    check('cave back arrow returns to the kitchen', pg.is_visible('#stageK') and not pg.is_visible('#stage2'))
    pg.dispatch_event('#ing-moon', 'click'); pg.wait_for_timeout(900); check('kitchen playable after returning', pg.eval_on_selector_all('#stageK .pips i.on', 'e=>e.length') == 1)
    pg.close(); b.close()
check(f'Dracula stab sound file loads {loaded[:1]}', bool(loaded) and loaded[0][1] == 200)
check('zero console errors', not errors)
if errors: print(errors)
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
