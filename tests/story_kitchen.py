"""Kitchen story + three-scene navigation (headless Chromium, 390x844). Run: python tests/story_kitchen.py [screenshot_dir]"""
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

def start(b, reduced=False, hash='#kitchen'):
    pg = b.new_page(viewport={'width': 390, 'height': 844})
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('response', lambda r: loaded.append((r.url.split('/')[-1], r.status)) if 'dracula_laugh' in r.url else None)
    pg.goto(url + hash)
    (pg.check if reduced else pg.uncheck)('#reduceMotion')
    pg.click('#enter'); pg.wait_for_timeout(400); return pg

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = start(b)
    tap = lambda i: pg.dispatch_event(f'#ing-{i}', 'click')
    pips = lambda: pg.eval_on_selector_all('#stageK .pips i.on', 'e=>e.length')
    used = lambda: pg.eval_on_selector_all('.ing.used', 'e=>e.length')
    toast = lambda: pg.inner_text('#stageK .toast')
    check('kitchen opens via #kitchen', pg.is_visible('#stageK') and not pg.is_visible('#stage'))
    sizes = pg.evaluate("[...document.querySelectorAll('.ing')].map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]})")
    check(f'10 ingredients, tap targets >= 48px', len(sizes) == 10 and all(w >= 48 and h >= 48 for w, h in sizes))
    spots = pg.evaluate("[...document.querySelectorAll('.ing')].map(e=>e.style.getPropertyValue('--x')+','+e.style.getPropertyValue('--y'))")
    check('one ingredient per shelf (10 distinct spots)', len(set(spots)) == 10)
    pg.screenshot(path=shots + '/k_start.png')

    tap('candycorn'); pg.wait_for_timeout(300); pg.screenshot(path=shots + '/k_wrong_mid.png'); pg.wait_for_timeout(1000)
    check('wrong ingredient: no progress, item returns', pips() == 0 and used() == 0 and 'pot' in toast().lower() + ' pot' )
    tap('pasta'); pg.wait_for_timeout(900)
    check('right ingredient drops in: 1 dot', pips() == 1 and used() == 1)
    tap('mushrooms'); pg.wait_for_timeout(1300)
    check('wrong keeps earlier progress', pips() == 1 and used() == 1)
    tap('pasta'); pg.wait_for_timeout(300); check('re-tapping a used ingredient does nothing', pips() == 1)
    tap('moon'); pg.wait_for_timeout(900); check('any order: second right one', pips() == 2)
    tap('garlic'); pg.wait_for_timeout(700); pg.screenshot(path=shots + '/k_garlic.png'); pg.wait_for_timeout(900)
    check('garlic resets everything with a funny line', pips() == 0 and used() == 0 and 'GARLIC' in toast())
    for i in ('pumpkin', 'moon'): tap(i); pg.wait_for_timeout(800)
    tap('pasta'); pg.wait_for_timeout(900)
    check('third right ingredient locks taps and starts the payoff', 'story' in pg.evaluate("document.getElementById('stageK').className") and pips() == 3)
    pg.wait_for_timeout(900); pg.screenshot(path=shots + '/k_cook.png')
    check('soup cooking (steam/glow class)', 'cook' in pg.evaluate("document.getElementById('stageK').className"))
    pg.wait_for_timeout(1500); check('Dracula fades in behind the pot', 'show' in pg.evaluate("document.getElementById('kdrac').className")); pg.wait_for_timeout(1500); pg.screenshot(path=shots + '/k_drac.png')
    tap('herb'); pg.wait_for_timeout(200); check('taps locked during payoff', used() == 3)
    pg.click('#pauseK'); pg.wait_for_timeout(2500)
    check('pause freezes the payoff', 'show' in pg.evaluate("document.getElementById('kdrac').className"))
    pg.click('#pauseK'); pg.wait_for_timeout(5500)
    check('payoff ends: arrows shown, scene reset', pg.is_visible('#navK') and used() == 0 and pips() == 0)
    pg.screenshot(path=shots + '/k_done.png')
    pg.click('#replayK'); pg.wait_for_timeout(200)
    spots2 = pg.evaluate("[...document.querySelectorAll('.ing')].map(e=>e.style.getPropertyValue('--x')+','+e.style.getPropertyValue('--y'))")
    check('replay works and reshuffles the shelves', not pg.is_visible('#navK') and pg.is_visible('#stageK') and spots2 != spots)
    tap('moon'); pg.wait_for_timeout(900); check('playable again after replay', pips() == 1)
    pg.close()

    # idle hints
    pg = start(b); pg.wait_for_timeout(5600)
    check('5 s hint shown', 'hungry' in pg.inner_text('#stageK .hint'))
    pg.close()

    # reduced motion: no animation, still works
    pg = start(b, reduced=True)
    check('reduced motion: steam/bubbles static', pg.evaluate("getComputedStyle(document.querySelector('#stageK .bubbles i')).animationName") == 'none')
    for i in ('moon', 'pumpkin', 'pasta'): pg.dispatch_event(f'#ing-{i}', 'click'); pg.wait_for_timeout(800)
    pg.wait_for_timeout(9000); check('reduced motion: story completes and resets', pg.is_visible('#navK'))
    pg.close()

    # navigation across all three scenes
    pg = start(b, hash='')
    for s in ('#g2', '#g3', '#g5'): pg.dispatch_event(s, 'click')
    pg.wait_for_timeout(3200); pg.dispatch_event('#e0', 'click'); pg.wait_for_timeout(10200)
    pg.click('#next1'); pg.wait_for_timeout(300)
    check('castle next arrow opens the kitchen', pg.is_visible('#stageK') and not pg.is_visible('#stage'))
    for i in ('moon', 'pumpkin', 'pasta'): pg.dispatch_event(f'#ing-{i}', 'click'); pg.wait_for_timeout(800)
    pg.wait_for_timeout(9500); pg.click('#nextK'); pg.wait_for_timeout(300)
    check('kitchen next arrow opens the cave', pg.is_visible('#stage2') and not pg.is_visible('#stageK'))
    pg.screenshot(path=shots + '/k_to_cave.png')
    pg.close(); b.close()
check(f'laugh sound file loads {loaded[:1]}', bool(loaded) and loaded[0][1] == 200)
check('zero console errors', not errors)
if errors: print(errors)
print(f'{sum(results)}/{len(results)} passed'); sys.exit(0 if all(results) else 1)
