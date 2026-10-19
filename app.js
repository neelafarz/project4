/* Virtual Hallo-weenie — Phase 1
   Structure: shared clock (pausable timers) → audio engine → scene setup → story 1 state machine → controls. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), hintEl = $('hint'), toastEl = $('toast');
  const pumpkins = [0, 1, 2].map((i) => $('p' + i));
  const reduced = () => document.documentElement.dataset.motion === 'reduced';

  /* ---------- shared clock: all timers run on this, so Pause freezes them together ---------- */
  const clock = {
    t: 0, running: true, queue: [], last: performance.now(),
    after(ms, fn) { this.queue.push({ at: this.t + ms, fn }); },
    clear() { this.queue = []; },
    tick(now) {
      const dt = Math.min(now - this.last, 100); this.last = now;
      if (this.running) {
        this.t += dt;
        const due = this.queue.filter((q) => q.at <= this.t);
        this.queue = this.queue.filter((q) => q.at > this.t);
        due.sort((a, b) => a.at - b.at).forEach((q) => q.fn());
        hints.update();
      }
      requestAnimationFrame((n) => clock.tick(n));
    },
  };

  /* ---------- audio: two CC0 loops + synthesized effects (all through one master gain) ---------- */
  const audio = {
    ctx: null, master: null,
    async init() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      this.master.gain.linearRampToValueAtTime(0.9, this.ctx.currentTime + 2);
      // Ambient layers load in the background; scene works without them if they fail.
      this.loop('assets/audio/dungeon_ambient_1.mp3', 0.55);
      this.loop('assets/audio/wind_whoosh_loop.mp3', 0.22);
    },
    async loop(url, vol) {
      try {
        const buf = await this.ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
        const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
        src.buffer = buf; src.loop = true; g.gain.value = vol;
        src.connect(g).connect(this.master); src.start();
      } catch (e) { console.warn('ambient audio failed', url, e); }
    },
    tone(freq, dur, type = 'sine', vol = 0.25, delay = 0, slideTo = null) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.05);
    },
    noise(dur, vol = 0.2, f0 = 2000, f1 = 500, delay = 0, type = 'bandpass') {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + delay, n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      s.buffer = buf; f.type = type; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f).connect(g).connect(this.master); s.start(t);
    },
    suspend() { return this.ctx && this.ctx.suspend(); },
    resume() { return this.ctx && this.ctx.resume(); },
  };
  const sfx = {
    pumpkin(i) { const f = [392, 523, 659][i]; audio.tone(f, 0.5, 'triangle', 0.3); audio.tone(f * 2, 0.35, 'sine', 0.1, 0.05); },
    wrong() { audio.tone(140, 0.4, 'sawtooth', 0.18, 0, 60); audio.noise(0.35, 0.12, 1500, 300); },
    door() { audio.tone(190, 0.9, 'sawtooth', 0.12, 0, 80); audio.tone(195, 0.9, 'square', 0.04, 0.02, 85); },
    wisp() { audio.tone(880, 0.9, 'sine', 0.12, 0, 1320); audio.tone(1320, 0.9, 'sine', 0.06, 0.1, 1760); },
    storyRise() { audio.tone(70, 1.6, 'sawtooth', 0.14, 0, 300); audio.noise(1.4, 0.1, 300, 2500); },
    storyChord() { [262, 330, 392, 523].forEach((f) => audio.tone(f, 1.6, 'triangle', 0.18)); },
    bats() { audio.noise(1.2, 0.18, 800, 3500); },
    cackle() { [330, 280, 330, 260, 300].forEach((f, i) => audio.tone(f, 0.14, 'square', 0.1, i * 0.17, f * 0.8)); },
    fizzle() { audio.noise(1.6, 0.22, 5000, 400, 0, 'highpass'); audio.tone(900, 1.4, 'sine', 0.06, 0, 120); },
    end() { audio.tone(196, 1.2, 'sine', 0.2); audio.tone(147, 1.4, 'sine', 0.2, 0.25); },
  };

  /* ---------- progressive hints: shown by idle time since the Developer last made progress ---------- */
  const HINT_STEPS = [
    [12000, 'The pumpkins seem to be watching you…'],
    [30000, 'They won’t all stir at once. Size matters.'],
    [55000, 'Start with the smallest and work up to the grandest.'],
  ];
  const hints = {
    lastActive: 0, shown: -1,
    reset() { this.lastActive = clock.t; this.shown = -1; hintEl.classList.remove('show'); },
    update() {
      if (story.mode !== 'idle') return;
      const idle = clock.t - this.lastActive;
      const step = HINT_STEPS.reduce((n, [ms], i) => (idle >= ms ? i : n), -1);
      if (step > this.shown) { this.shown = step; hintEl.textContent = HINT_STEPS[step][1]; hintEl.classList.add('show'); }
    },
  };

  /* ---------- scene setup: pumpkin art, ambient bats, leaves ---------- */
  // Carved-face glow drawn over the supplied scene's unlit pumpkins when they are awakened.
  const pumpkinSVG = `<svg viewBox="0 0 100 90" aria-hidden="true"><g class="face" fill="#fff1a0">
    <polygon points="24,34 40,34 32,50"/><polygon points="60,34 76,34 68,50"/>
    <path d="M26 60 L36 68 L44 62 L50 70 L56 62 L64 68 L74 60 L68 80 L32 80Z"/></g></svg>`;
  const batSVG = '<svg viewBox="0 0 40 22"><path d="M20 20 L16 9 L11 12 L0 2 Q8 12 6 18 Q12 14 16 20 Q18 17 20 20 Q22 17 24 20 Q28 14 34 18 Q32 12 40 2 L29 12 L24 9Z"/></svg>';

  function buildScene() {
    pumpkins.forEach((p) => { p.innerHTML = pumpkinSVG; });
    $('ambientBats').innerHTML = [[14, 17, 0], [26, 23, -9]].map(([y, t, d]) =>
      `<div class="bat ambient" style="--y:${y}%;--t:${t}s;--d:${d}s">${batSVG}</div>`).join('');
    const colors = ['#d9731a', '#b3501a', '#e0a030', '#8a3a14'];
    $('leaves').innerHTML = Array.from({ length: 9 }, (_, i) =>
      `<span class="leaf" style="--x:${(i * 11 + 4) % 96}%;--t:${11 + (i % 4) * 2}s;--d:${-i * 1.7}s;--c:${colors[i % 4]}"></span>`).join('');
  }

  /* ---------- feedback helpers ---------- */
  function ringAt(el, color) {
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(), d = document.createElement('div');
    d.className = 'ring'; d.style.cssText = `left:${r.left - s.left + r.width / 2}px;top:${r.top - s.top + r.height / 2}px;--c:${color}`;
    stage.appendChild(d); clock.after(800, () => d.remove());
  }
  function toast(text, ms = 2600) { toastEl.textContent = text; toastEl.classList.add('show'); clock.after(ms, () => toastEl.classList.remove('show')); }
  function setPips(n) {
    [...$('pips').children].forEach((el, i) => el.classList.toggle('on', i < n));
    $('pips').setAttribute('aria-label', `Story progress ${n} of 3`);
  }
  function smokeAt(el) {
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    for (let k = 0; k < 3; k++) {
      const d = document.createElement('div'); d.className = 'smoke';
      d.style.cssText = `left:${r.left - s.left + r.width / 2 + (k - 1) * 14}px;top:${r.top - s.top + r.height / 3}px;animation-delay:${k * 0.15}s`;
      $('burst').appendChild(d); clock.after(2200, () => d.remove());
    }
  }

  /* ---------- Story 1: "The Patch Awakens" — wake small → medium → large ---------- */
  const COLORS = ['#ffd27a', '#ffa040', '#ff6a30'];
  const story = {
    mode: 'idle', progress: 0,
    tap(i) {
      if (story.mode !== 'idle' || !clock.running) return;
      hints.reset();
      const el = pumpkins[i];
      if (i === story.progress) {
        story.progress++;
        el.classList.add('lit', 'pop'); el.style.setProperty('--glow', 0.6);
        clock.after(450, () => el.classList.remove('pop'));
        sfx.pumpkin(i); ringAt(el, COLORS[i]); setPips(story.progress);
        if (story.progress === 3) clock.after(700, story.play);
      } else {
        sfx.wrong(); el.classList.add('wrong'); clock.after(400, () => el.classList.remove('wrong'));
        story.resetPumpkins();
        toast('The pumpkins fall silent…', 1800);
      }
    },
    resetPumpkins() {
      story.progress = 0; setPips(0);
      pumpkins.forEach((p) => { p.classList.remove('lit'); p.style.removeProperty('--glow'); });
    },
    play() { // ~7.5 s: wake → flare + bats → peak + cackle → fizzle + smoke → rest
      story.mode = 'story'; stage.classList.add('story'); hintEl.classList.remove('show');
      document.activeElement && document.activeElement.blur();
      const at = (ms, fn) => clock.after(ms, fn), rm = reduced();
      pumpkins.forEach((p, i) => at(i * 400, () => p.style.setProperty('--glow', 1.2)));
      sfx.storyRise();
      at(1500, () => {
        stage.classList.add('house-flare'); sfx.storyChord(); sfx.bats();
        pumpkins.forEach((p) => p.style.setProperty('--glow', 2.2));
        if (!rm) {
          $('burst').insertAdjacentHTML('beforeend', [[-90, -150], [-40, -190], [10, -170], [60, -200], [105, -140]].map(([x, y]) =>
            `<div class="bat burst" style="--dx:${x * 0.01 * 100 / 3.6}vw;--dy:${y * 0.01 * 100 / 3.6}vw">${batSVG}</div>`).join(''));
          at(2600, () => $('burst').querySelectorAll('.bat').forEach((b) => b.remove()));
        }
      });
      at(3400, () => { sfx.cackle(); pumpkins.forEach((p) => p.style.setProperty('--glow', 3.4)); if (!rm) $('flash').classList.add('on'); });
      at(4300, () => $('flash').classList.remove('on'));
      at(5000, () => { sfx.fizzle(); pumpkins.forEach((p) => { p.style.setProperty('--glow', 0.3); smokeAt(p); }); stage.classList.remove('house-flare'); });
      at(6400, () => { story.resetPumpkins(); sfx.end(); });
      at(7500, () => {
        story.mode = 'idle'; stage.classList.remove('story'); hints.reset();
        toast('The patch sleeps again… for now. Try it again?', 3500);
      });
    },
  };

  /* decoys: every interaction gives audiovisual feedback, but they do nothing else */
  function decoy(el, kind) {
    if (story.mode !== 'idle' || !clock.running) return;
    hints.reset();
    if (kind === 'door') {
      sfx.door(); ringAt(el, '#ffb347');
      const h = document.querySelector('.house-glow'); h.classList.add('house-flare'); clock.after(1200, () => h.classList.remove('house-flare'));
    } else {
      sfx.wisp(); ringAt(el, '#bfe0ff');
      const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(), w = document.createElement('div');
      w.className = 'wisp'; w.style.cssText = `left:${r.left - s.left + r.width / 2 - 14}px;top:${r.top - s.top - 10}px`;
      $('burst').appendChild(w); clock.after(1700, () => w.remove());
    }
  }

  /* ---------- global Play/Pause: audio, CSS animation, shared timers and interaction together ---------- */
  function setPaused(paused) {
    clock.running = !paused; clock.last = performance.now();
    stage.classList.toggle('paused', paused);
    document.body.classList.toggle('paused', paused);
    const btn = $('pause'); btn.setAttribute('aria-pressed', String(paused)); btn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
    paused ? audio.suspend() : audio.resume();
  }
  const isPaused = () => !clock.running;

  /* ---------- start / wiring ---------- */
  $('reduceMotion').checked = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('enter').addEventListener('click', async () => {
    document.documentElement.dataset.motion = $('reduceMotion').checked ? 'reduced' : 'full';
    buildScene();
    $('start').hidden = true; stage.hidden = false;
    await audio.init();
    hints.reset();
    $('pause').focus({ preventScroll: true });
    requestAnimationFrame((n) => { clock.last = n; clock.tick(n); });
  });
  pumpkins.forEach((p, i) => p.addEventListener('click', () => story.tap(i)));
  $('door').addEventListener('click', (e) => decoy(e.currentTarget, 'door'));
  ['tomb1', 'tomb2'].forEach((id) => $(id).addEventListener('click', (e) => decoy(e.currentTarget, 'tomb')));
  $('pause').addEventListener('click', () => setPaused(!isPaused()));
  document.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'p' && !stage.hidden) setPaused(!isPaused()); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && !stage.hidden && !isPaused()) setPaused(true); });
})();
