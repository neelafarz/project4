/* Virtual Hallo-weenie — Phase 1 (castle version)
   Structure: shared clock (pausable timers) → audio engine → hints → Story 1 state machine → controls. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), hintEl = $('hint'), toastEl = $('toast');
  const gargs = [0, 1, 2, 3, 4, 5].map((i) => $('g' + i)), lits = [0, 1, 2, 3, 4, 5].map((i) => $('l' + i));
  const eyeEls = [0, 1, 2, 3].map((i) => $('e' + i)); // e0 = largest pair (the correct one); e1–e3 are decoys
  const reduced = () => document.documentElement.dataset.motion === 'reduced';

  /* ---------- shared clock: all timers run on this, so Pause freezes them together ---------- */
  const clock = {
    t: 0, running: true, queue: [], last: performance.now(),
    after(ms, fn) { this.queue.push({ at: this.t + ms, fn }); },
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

  /* ---------- audio: CC0 loops + owl clip + synthesized effects (one master gain) ---------- */
  const audio = {
    ctx: null, master: null, owlBuf: null,
    async init() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      this.master.gain.linearRampToValueAtTime(0.9, this.ctx.currentTime + 2);
      // Ambient layers load in the background; the scene works without them if they fail.
      this.load('assets/audio/dungeon_ambient_1.mp3').then((b) => b && this.loop(b, 0.55));
      this.load('assets/audio/wind_whoosh_loop.mp3').then((b) => b && this.loop(b, 0.22));
      this.load('assets/audio/owl_hoot.mp3').then((b) => { this.owlBuf = b; });
    },
    async load(url) {
      try { return await this.ctx.decodeAudioData(await (await fetch(url)).arrayBuffer()); }
      catch (e) { console.warn('audio load failed', url, e); return null; }
    },
    loop(buf, vol) {
      const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
      src.buffer = buf; src.loop = true; g.gain.value = vol; src.connect(g).connect(this.master); src.start();
    },
    playBuffer(buf, vol = 0.5) {
      const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
      src.buffer = buf; g.gain.value = vol; src.connect(g).connect(this.master); src.start();
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
    // stone chime per lit statue: three rising notes plus a low thud
    light(n) { const f = [330, 392, 494][n - 1] || 330; audio.tone(f, 0.9, 'triangle', 0.22); audio.tone(f * 2.01, 0.6, 'sine', 0.08, 0.03); audio.tone(90, 0.25, 'sine', 0.25, 0, 50); },
    rechime() { audio.tone(392, 0.5, 'triangle', 0.12); },
    whisper() { audio.noise(0.7, 0.08, 3500, 1200, 0, 'highpass'); audio.tone(300, 0.5, 'sine', 0.04, 0, 200); },
    grumble() { audio.tone(95, 0.55, 'sawtooth', 0.12, 0, 55); audio.noise(0.5, 0.1, 500, 120, 0, 'lowpass'); },
    growl() { audio.tone(80, 1.1, 'sawtooth', 0.18, 0, 48); audio.tone(120, 1.0, 'square', 0.05, 0.05, 70); audio.noise(1.0, 0.12, 400, 100, 0, 'lowpass'); },
    rise() { audio.tone(60, 1.8, 'sawtooth', 0.12, 0, 220); audio.noise(1.6, 0.08, 300, 2000); },
    thunder() { audio.noise(2.4, 0.4, 600, 60, 0, 'lowpass'); audio.tone(45, 1.8, 'sine', 0.3); },
    door() { audio.tone(190, 1.1, 'sawtooth', 0.12, 0, 80); audio.tone(195, 1.1, 'square', 0.04, 0.02, 85); },
    organ() { [131, 156, 196, 262].forEach((f) => { audio.tone(f, 2.6, 'triangle', 0.1); audio.tone(f * 2, 2.6, 'sine', 0.04); }); },
    bats() { audio.noise(1.6, 0.16, 900, 3200); audio.noise(1.2, 0.1, 2500, 800, 0.4, 'highpass'); },
    laugh() { [200, 170, 200, 160, 190].forEach((f, i) => audio.tone(f, 0.16, 'square', 0.08, i * 0.2, f * 0.8)); },
    end() { audio.tone(196, 1.2, 'sine', 0.2); audio.tone(147, 1.4, 'sine', 0.2, 0.25); },
    // owl: recorded clip (Freesound, see credits); synthesized "hoo ... hoo-hoo" fallback if it did not load
    owl() {
      if (audio.owlBuf) return audio.playBuffer(audio.owlBuf, 0.45);
      [[0, 420, 0.5], [0.8, 400, 0.3], [1.2, 380, 0.45]].forEach(([d, f, len]) => {
        audio.tone(f, len, 'sine', 0.1, d, f * 0.82); audio.tone(f * 2, len, 'sine', 0.025, d, f * 1.6); });
    },
  };

  /* occasional owl hoot: random 18–35 s gaps on the shared clock, so Pause delays it too */
  function scheduleOwl(first = false) {
    clock.after(first ? 9000 : 18000 + Math.random() * 17000, () => {
      if (story.mode === 'idle') sfx.owl();
      scheduleOwl();
    });
  }

  /* ---------- progressive hints: by idle time since the player last interacted, per story phase ---------- */
  const HINTS = {
    statues: [
      [5000, 'The road is quiet… but the stone guardians seem to be watching you.'],
      [20000, 'They wake in a certain order. Start on the left.'],
      [40000, 'Left first, then climb to the top right, then come down to the bottom right.'],
    ],
    eyes: [
      [6000, 'Something is watching from the trees…'],
      [20000, 'Many eyes glow in the dark. Trust the one that glares the biggest.'],
    ],
  };
  const hints = {
    lastActive: 0, shown: -1,
    reset() { this.lastActive = clock.t; this.shown = -1; hintEl.classList.remove('show'); },
    update() {
      if (story.mode !== 'idle') return;
      const steps = HINTS[story.phase], idle = clock.t - this.lastActive;
      const step = steps.reduce((n, [ms], i) => (idle >= ms ? i : n), -1);
      if (step > this.shown) { this.shown = step; hintEl.textContent = steps[step][1]; hintEl.classList.add('show'); }
    },
  };

  /* ---------- feedback helpers ---------- */
  const batSVG = '<svg viewBox="0 0 40 22"><path d="M20 20 L16 9 L11 12 L0 2 Q8 12 6 18 Q12 14 16 20 Q18 17 20 20 Q22 17 24 20 Q28 14 34 18 Q32 12 40 2 L29 12 L24 9Z"/></svg>';
  function ringAt(el, color) {
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(), d = document.createElement('div');
    d.className = 'ring'; d.style.cssText = `left:${r.left - s.left + r.width / 2}px;top:${r.top - s.top + r.height / 2}px;--c:${color}`;
    stage.appendChild(d); clock.after(800, () => d.remove());
  }
  function toast(text, ms = 2600) { toastEl.textContent = text; toastEl.classList.add('show'); clock.after(ms, () => toastEl.classList.remove('show')); }
  function setPips(n) {
    [...$('pips').children].forEach((el, i) => el.classList.toggle('on', i < n));
    $('pips').setAttribute('aria-label', `Story progress ${n} of 4`);
  }
  function flash() { if (reduced()) return; const f = $('flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }

  /* ---------- Story 1: "The Count Awakens" — light the statues in order → find the right eyes → castle payoff ---------- */
  const ORDER = [2, 3, 5]; // front-left (red-eyed), then top right, then bottom right
  const story = {
    mode: 'idle',        // idle | story (input locked while the payoff plays)
    phase: 'statues',    // statues | eyes
    progress: 0,         // how many statues of ORDER are lit
    tapStatue(i) {
      if (story.mode !== 'idle' || !clock.running) return;
      hints.reset();
      const el = gargs[i];
      if (lits[i].classList.contains('on')) { sfx.rechime(); ringAt(el, '#5dff9a'); return; }   // already glowing: harmless
      if (story.phase === 'statues' && i === ORDER[story.progress]) {
        story.progress++;
        lits[i].classList.add('on', 'pop'); clock.after(500, () => lits[i].classList.remove('pop'));
        sfx.light(story.progress); ringAt(el, '#5dff9a'); setPips(story.progress);
        if (story.progress === ORDER.length) {
          story.phase = 'eyes'; hints.reset();
          toast('Something stirs in the dark forest…', 3000);
          eyeEls.forEach((e, k) => clock.after(1200 + k * 300, () => { e.hidden = false; }));
        }
        return;
      }
      // wrong statue: grumble; before the sequence is solved this also puts the lit statues back to sleep
      sfx.grumble(); el.classList.add('grumble'); clock.after(400, () => el.classList.remove('grumble'));
      if (story.phase === 'statues' && story.progress > 0) { story.resetStatues(); toast('The statues fall dark again…', 1800); }
    },
    tapEyes(k) {
      if (story.mode !== 'idle' || !clock.running || story.phase !== 'eyes') return;
      hints.reset();
      const el = eyeEls[k];
      if (k !== 0) {   // decoy pair: blinks shut for a moment
        sfx.whisper(); ringAt(el, '#ff3a2a'); el.classList.add('shut'); clock.after(1500, () => el.classList.remove('shut')); return;
      }
      sfx.growl(); ringAt(el, '#ff3a2a'); setPips(4); flash();
      clock.after(900, story.play);
    },
    resetStatues() { story.progress = 0; setPips(0); lits.forEach((l) => l.classList.remove('on')); },
    reset() { story.resetStatues(); story.phase = 'statues'; eyeEls.forEach((e) => { e.hidden = true; e.classList.remove('shut'); }); },
    play() { // ~8 s: thunder + door flare → Dracula on the road + creak → organ + bats → laugh → fade → rest
      story.mode = 'story'; stage.classList.add('story'); hintEl.classList.remove('show');
      document.activeElement && document.activeElement.blur();
      const at = (ms, fn) => clock.after(ms, fn), rm = reduced();
      eyeEls.forEach((e) => { e.hidden = true; }); sfx.rise();
      at(900, () => { stage.classList.add('flare'); sfx.thunder(); flash(); });
      at(1800, () => { sfx.door(); $('dracula').classList.add('show'); });
      at(2800, () => {
        sfx.organ(); sfx.bats();
        if (!rm) {
          $('bats').innerHTML = [[-30, -45], [-8, -60], [14, -52], [35, -40], [-48, -20], [50, -18], [4, -30]].map(([dx, dy], k) =>
            `<div class="bat" style="--dx:${dx};--dy:${dy};animation-delay:${k * 0.12}s">${batSVG}</div>`).join('');
          at(3800, () => { $('bats').innerHTML = ''; });
        }
      });
      at(4800, () => { sfx.laugh(); flash(); });
      at(5600, () => $('dracula').classList.remove('show'));
      at(6200, () => { stage.classList.remove('flare'); lits.forEach((l) => l.classList.remove('on')); sfx.end(); });
      at(7200, () => {
        story.reset(); story.mode = 'idle'; stage.classList.remove('story'); hints.reset();
        toast('The castle falls quiet… for now. Try again?', 3500);
      });
    },
  };

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
    $('start').hidden = true; stage.hidden = false;
    await audio.init();
    hints.reset(); scheduleOwl(true);
    $('pause').focus({ preventScroll: true });
    requestAnimationFrame((n) => { clock.last = n; clock.tick(n); });
  });
  gargs.forEach((g, i) => g.addEventListener('click', () => story.tapStatue(i)));
  eyeEls.forEach((e, k) => e.addEventListener('click', () => story.tapEyes(k)));
  $('pause').addEventListener('click', () => setPaused(!isPaused()));
  document.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'p' && !stage.hidden) setPaused(!isPaused()); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && !stage.hidden && !isPaused()) setPaused(true); });
})();
