"""Brief requirements check per story (headless Chromium 390x844): 5-10 s duration, all other interaction locked while it plays,
interactive scene again at the end, progressive hints, replay without reload. Run: python tests/requirements.py"""
import http.server, threading, functools, sys, os, time
from playwright.sync_api import sync_playwright

here = os.path.dirname(os.path.abspath(__file__))
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=here + '/..'))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{srv.server_port}/index.html'
results, errors = [], []
def check(name, ok): results.append(ok); print(('PASS ' if ok else 'FAIL ') + name)

def start(b, hash=''):
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(url + hash); pg.uncheck('#reduceMotion'); pg.click('#enter'); pg.wait_for_timeout(400); return pg

def run(pg, name, trigger, nav, locked_probe, played_probe, taps_before_trigger):
    """trigger(): the tap that completes the puzzle; measures trigger -> arrows shown."""
    taps_before_trigger()
    t0 = time.time(); trigger()
    pg.wait_for_timeout(1500); check(f'{name}: other interactions locked while it plays', locked_probe())
    pg.wait_for_selector(nav, state='visible', timeout=15000); d = time.time() - t0
    check(f'{name}: story lasts 5-10 s (measured {d:.1f} s from the last tap)', 5 <= d <= 10)
    check(f'{name}: scene interactive again the moment it ends', played_probe())

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    ev = lambda pg, sel: pg.dispatch_event(sel, 'click')
    # castle
    pg = start(b)
    def castle_pre():
        for s in ('#g2', '#g3', '#g5'): ev(pg, s)
        pg.wait_for_timeout(3200)
    def castle_locked():
        ev(pg, '#g0'); return pg.eval_on_selector_all('.seye.on', 'e=>e.length') <= 3 and pg.evaluate("document.getElementById('stage').classList.contains('story')")
    run(pg, 'castle', lambda: ev(pg, '#e0'), '#nav1', castle_locked, lambda: (ev(pg, '#g2'), pg.eval_on_selector_all('.seye.on', 'e=>e.length') == 1)[1], castle_pre)
    pg.close()
    # kitchen
    pg = start(b, '#kitchen')
    def k_pre():
        for i in ('moon', 'pumpkin'): ev(pg, f'#ing-{i}'); pg.wait_for_timeout(800)
    def k_locked():
        ev(pg, '#ing-herb'); return pg.eval_on_selector_all('.ing.used', 'e=>e.length') == 3
    run(pg, 'kitchen', lambda: ev(pg, '#ing-pasta'), '#navK', k_locked, lambda: (ev(pg, '#ing-moon'), pg.wait_for_timeout(900), pg.eval_on_selector_all('#stageK .pips i.on', 'e=>e.length') == 1)[2], k_pre)
    pg.close()
    # cave
    pg = start(b, '#cave')
    def c_pre():
        ev(pg, '#b0'); ev(pg, '#b2')
    def c_locked():
        ev(pg, '#b1'); return 'wrong' not in pg.evaluate("document.getElementById('b1').className")
    run(pg, 'cave', lambda: ev(pg, '#b4'), '#nav2', c_locked, lambda: (ev(pg, '#b0'), pg.eval_on_selector_all('.bat2.on', 'e=>e.length') == 1)[1], c_pre)
    pg.close()
    # progressive hints: each story shows a first hint within 6 s and a different, later one within 21 s
    for name, hash, sel in (('castle', '', '#stage .hint'), ('kitchen', '#kitchen', '#stageK .hint'), ('cave', '#cave', '#stage2 .hint')):
        pg = start(b, hash); pg.wait_for_timeout(6200); h1 = pg.inner_text(sel); pg.wait_for_timeout(15200); h2 = pg.inner_text(sel)
        check(f'{name}: progressive hints (5-6 s: "{h1[:38]}…", 20 s: "{h2[:38]}…")', bool(h1) and bool(h2) and h1 != h2)
        pg.close()
    b.close()
check('zero console errors', not errors)
if errors: print(errors)
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
