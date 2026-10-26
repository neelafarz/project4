"""Story 1 regression baseline (headless Chromium, 390x844). Run: python tests/story1_baseline.py"""
import http.server, threading, functools, sys, time
from playwright.sync_api import sync_playwright

root = sys.path[0] + '/..'
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=root))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{srv.server_port}/index.html'
results, errors = [], []
def check(name, ok): results.append(ok); print(('PASS ' if ok else 'FAIL ') + name)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(url); pg.click('#enter'); pg.wait_for_timeout(500)
    lit = lambda: pg.eval_on_selector_all('.seye.on', 'e=>e.length')
    pips = lambda: pg.eval_on_selector_all('#pips i.on', 'e=>e.length')
    tap = lambda sel: pg.dispatch_event(sel, 'click')

    check('motion attribute set', pg.evaluate('document.documentElement.dataset.motion') in ('full', 'reduced'))
    tap('#g2'); check('first correct statue lights 1', lit() == 1 and pips() == 1)
    tap('#g0'); pg.wait_for_timeout(200); check('wrong statue resets to 0', lit() == 0 and pips() == 0)
    tap('#g3'); check('wrong first statue lights nothing', lit() == 0)
    for s in ('#g2', '#g3', '#g5'): tap(s)
    check('order 2,3,5 lights 3', lit() == 3 and pips() == 3)
    pg.wait_for_timeout(3200)
    check('5 eye pairs shown', pg.eval_on_selector_all('.hotspot.eyes:not([hidden])', 'e=>e.length') == 5)
    tap('#e1'); check('decoy gives no progress', pips() == 3)
    tap('#e0'); pg.wait_for_timeout(1000); check('correct eyes light 4th dot', pips() == 4)
    pg.wait_for_timeout(1500)
    check('payoff locks (story class)', pg.evaluate("document.getElementById('stage').classList.contains('story')"))
    pg.screenshot(path=sys.path[0] + '/story1_payoff.png')
    pg.click('#pause'); t0 = pg.evaluate("document.getElementById('stage').className"); pg.wait_for_timeout(2500)
    check('pause keeps payoff frozen', 'story' in pg.evaluate("document.getElementById('stage').className") and pg.evaluate("document.getElementById('stage').classList.contains('paused')"))
    pg.click('#pause'); pg.wait_for_timeout(9500)
    check('payoff ends and resets', not pg.evaluate("document.getElementById('stage').classList.contains('story')") and pips() == 0)
    check('replay/next arrows shown', pg.is_visible('#replay1') and pg.is_visible('#next1'))
    tap('#g2'); check('taps locked until Replay', lit() == 0)
    pg.click('#replay1'); tap('#g2'); check('replays without reload', lit() == 1)
    small = pg.evaluate("""[...document.querySelectorAll('.hotspot.garg')].filter(e=>{const r=e.getBoundingClientRect();return r.width<48||r.height<48}).length""")
    print('info: gargoyle hotspots under 48px:', small)
    b.close()
check('zero console errors', not errors)
if errors: print(errors)
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
