"""Fit check on iPhone-shaped windows (headless Chromium): the scene fills the window (no border), and the pause button, dots, arrows, scroll and every
visible tap target stay inside the screen in all three scenes. Run: python tests/fit_iphone.py [screenshot_dir]"""
import http.server, threading, functools, sys, os
from playwright.sync_api import sync_playwright

here = os.path.dirname(os.path.abspath(__file__)); shots = sys.argv[1] if len(sys.argv) > 1 else None
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=here + '/..'))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{srv.server_port}/index.html'
results, errors = [], []
def check(name, ok): results.append(ok); print(('PASS ' if ok else 'FAIL ') + name)

# (name, width, height, widest border allowed as % of the width). The SE-with-toolbars window is so short that a 10% crop cannot fill it.
SIZES = [('iPhone 15 full screen', 393, 852, 1), ('iPhone 14 Pro Max full', 430, 932, 1), ('iPhone 14 in Safari (toolbars)', 390, 664, 3), ('iPhone SE in Safari (toolbars)', 375, 553, 18)]
SCENES = [('castle', '', 'stage'), ('kitchen', '#kitchen', 'stageK'), ('cave', '#cave', 'stage2')]
INSIDE = """(sel) => [...document.querySelectorAll(sel)].filter(e => e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect();
  return { id: e.id || e.className, cx: r.left + r.width / 2, cy: r.top + r.height / 2, l: r.left, r: r.right, t: r.top, b: r.bottom }; })"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for name, w, h, bar in SIZES:
        for scene, hash, stage_id in SCENES:
            pg = b.new_page(viewport={'width': w, 'height': h}); pg.on('pageerror', lambda e: errors.append(str(e)))
            pg.goto(url + hash); pg.uncheck('#reduceMotion'); pg.click('#enter'); pg.wait_for_timeout(600)
            # show the after-story arrows (and the kitchen scroll) so they are measured too
            pg.evaluate("document.querySelectorAll('.nav').forEach(n => n.hidden = false); const s = document.getElementById('scrollOpen'); s && document.getElementById('stageK').classList.add('riddle')")
            pg.wait_for_timeout(700)
            r = pg.evaluate(f"(() => {{ const s = document.getElementById('{stage_id}').getBoundingClientRect(); return [s.left, s.right, s.top, s.bottom]; }})()")
            border = max(r[0], w - r[1]) / w * 100
            tag = f'{name}, {scene}'
            check(f'{tag}: fills the window (side border {border:.1f}% <= {bar}%)', border <= bar)
            ui = pg.evaluate(INSIDE, f'#{stage_id} .hud > *, #{stage_id} .nav button, #{stage_id} .scroll, #{stage_id} .scroll-open')
            out = [u['id'] for u in ui if u['l'] < -1 or u['r'] > w + 1 or u['t'] < -1 or u['b'] > h + 1]
            check(f'{tag}: interface (dots, pause, arrows, scroll) fully on screen', not out)
            if out: print('   outside:', out)
            taps = pg.evaluate(INSIDE, f'#{stage_id} .hotspot')
            bad = [t['id'] for t in taps if not (0 <= t['cx'] <= w and 0 <= t['cy'] <= h)]
            check(f'{tag}: every tap target ({len(taps)}) has its centre on screen', not bad)
            if bad: print('   off screen:', bad)
            if shots: pg.screenshot(path=f"{shots}/fit_{w}x{h}_{scene}.png")
            pg.close()
    b.close()
check('zero page errors', not errors)
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
