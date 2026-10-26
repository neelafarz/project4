/* Drac's Midnight Manor — castle version
   Structure: shared clock (pausable timers) → audio engine → hints → Story 1 and Story 2 state machines → scene switching → controls. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  // Three scenes (castle → kitchen → cave) share one clock, audio engine, Pause and HUD style.
  // `stage`, `hintEl` and `toastEl` always point at the visible scene; `scene` is its key.
  const stage1 = $('stage'), stageK = $('stageK'), stage2 = $('stage2');
  const STAGES = { castle: stage1, kitchen: stageK, cave: stage2 };
  let stage = stage1, hintEl = $('hint'), toastEl = $('toast'), scene = 'castle';
  const gargs = [0, 1, 2, 3, 4, 5].map((i) => $('g' + i)), seyes = [0, 1, 2, 3, 4, 5].map((i) => $('se' + i)); // statue eyes (glow red when activated)
  const eyeEls = [0, 1, 2, 3, 4].map((i) => $('e' + i)); // e0 = largest pair (the correct one); e1–e4 are decoys
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
    ctx: null, master: null, owlBuf: null, toccataBuf: null, stabBuf: null, laughBuf: null,
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
      this.load('assets/audio/toccata_intro.mp3').then((b) => { this.toccataBuf = b; });
      this.load('assets/audio/dracula_stab.wav').then((b) => { this.stabBuf = b; });
      this.load('assets/audio/dracula_laugh.wav').then((b) => { this.laughBuf = b; });
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
    // quiet rain bed for story 2: looped white noise through a band filter, fading in and out with the scene (synthesized; no licence needed)
    rainNode: null,
    startRain() {
      if (!this.ctx || this.rainNode) return;
      const sr = this.ctx.sampleRate, buf = this.ctx.createBuffer(1, sr * 3, sr), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource(), hp = this.ctx.createBiquadFilter(), lp = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      src.buffer = buf; src.loop = true; hp.type = 'highpass'; hp.frequency.value = 1200; lp.type = 'lowpass'; lp.frequency.value = 7000;
      g.gain.value = 0; g.gain.linearRampToValueAtTime(0.045, this.ctx.currentTime + 2.5);
      src.connect(hp).connect(lp).connect(g).connect(this.master); src.start();
      this.rainNode = { src, g };
    },
    stopRain() {
      if (!this.rainNode) return;
      const { src, g } = this.rainNode; this.rainNode = null;
      g.gain.cancelScheduledValues(this.ctx.currentTime); g.gain.setValueAtTime(g.gain.value, this.ctx.currentTime); g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      setTimeout(() => src.stop(), 1200);
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
    // Dracula's entrance music: first 6 s of Bach's Toccata and Fugue in D minor (Freesound, CC0, see credits);
    // if it failed to load, an original synthesized waltz plays instead
    toccata() { if (audio.toccataBuf) audio.playBuffer(audio.toccataBuf, 0.8); else sfx.tune(); },
    // original spooky "Transylvanian" waltz (fallback) in D harmonic minor: organ drone + harpsichord-style pluck chords + flute-like melody
    tune() {
      const B = 0.5, N = { D2: 73.4, A2: 110, D3: 146.8, F3: 174.6, A3: 220, C4s: 277.2, E4: 329.6, D4: 293.7, F4: 349.2, G4: 392, A4: 440, Bb4: 466.2, C5s: 554.4, D5: 587.3 };
      const mel = [[0, 1, 'A4'], [1, .5, 'Bb4'], [1.5, .5, 'A4'], [2, 1, 'G4'], [3, 1, 'F4'], [4, .5, 'E4'], [4.5, .5, 'F4'], [5, 1, 'D4'], [6, 1, 'A4'], [7, .5, 'Bb4'], [7.5, .5, 'C5s'], [8, 1.5, 'D5']];
      mel.forEach(([b, d, n]) => { audio.tone(N[n], d * B * 1.1, 'triangle', 0.1, b * B); audio.tone(N[n] * 2, d * B, 'sine', 0.025, b * B); });
      [['D2', 0], ['A2', 3], ['D2', 6]].forEach(([n, b]) => audio.tone(N[n], 3 * B * 1.05, 'sawtooth', 0.05, b * B));   // organ bass, one per bar
      [[['D3', 'F3', 'A3'], 0], [['A3', 'C4s', 'E4'], 3], [['D3', 'F3', 'A3'], 6]].forEach(([ch, b]) => [1, 2].forEach((k) =>
        ch.forEach((n) => audio.tone(N[n], 0.28, 'square', 0.03, (b + k) * B))));                                              // plucked off-beats
    },
    // distant thunder: slow, low rumble that swells and fades (quiet, far away)
    farThunder() { audio.noise(4, 0.16, 280, 50, 0, 'lowpass'); audio.tone(48, 3.2, 'sine', 0.12, 0.2, 34); },
    organ() { [131, 156, 196, 262].forEach((f) => { audio.tone(f, 2.6, 'triangle', 0.1); audio.tone(f * 2, 2.6, 'sine', 0.04); }); },
    // story 2: bat squeaks (pitch rises with progress), a shriek on a wrong tap, and a thud as Dracula drops in
    squeak(n) { const f = [2400, 2800, 3300][n - 1] || 2400; audio.tone(f, 0.12, 'sine', 0.08, 0, f * 1.25); audio.tone(f * 1.1, 0.1, 'sine', 0.05, 0.1, f * 1.4); },
    screech() { audio.tone(1700, 0.5, 'sawtooth', 0.1, 0, 700); audio.noise(0.5, 0.1, 4000, 1500, 0, 'highpass'); },
    thud() { audio.tone(70, 0.45, 'sine', 0.35, 0, 40); sfx.door(); },
    // Dracula's appearance in the cave: the recorded "Dracula stab" (Freesound, CC BY 4.0, see credits); if it failed to load,
    // a synthesized low D-minor organ swell, whoosh, high shiver and thud play instead
    sting() {
      if (audio.stabBuf) return audio.playBuffer(audio.stabBuf, 0.9);
      audio.tone(73.4, 2.8, 'sawtooth', 0.09); [146.8, 174.6, 220].forEach((f) => audio.tone(f, 2.6, 'triangle', 0.08, 0.05));
      audio.noise(1.6, 0.12, 250, 2600); audio.tone(1500, 1.4, 'sine', 0.04, 0.2, 950); audio.tone(60, 0.7, 'sine', 0.3, 0.1, 38);
    },
    // story 2 (kitchen): a distinct sound per right ingredient, a puff for wrong ones, bubbling, steam, and Dracula's low bell
    ing(id) {
      if (id === 'moon') [1320, 1760, 2217, 2637].forEach((f, i) => audio.tone(f, 0.5, 'sine', 0.07, i * 0.07));                       // sparkle
      else if (id === 'pumpkin') { audio.tone(180, 0.25, 'sine', 0.25, 0, 90); audio.tone(140, 0.2, 'sine', 0.2, 0.15, 70); audio.noise(0.3, 0.08, 600, 200, 0.05, 'lowpass'); }   // glug
      else { audio.noise(0.4, 0.1, 2500, 900); [900, 1100, 1400].forEach((f, i) => audio.tone(f, 0.08, 'sine', 0.06, i * 0.1, f * 1.3)); }   // flutter
    },
    rustle() { audio.noise(0.22, 0.09, 3000, 6500, 0, 'bandpass'); audio.noise(0.2, 0.07, 4000, 7000, 0.12, 'bandpass'); },
    blorp() { audio.tone(220, 0.25, 'sine', 0.15, 0, 110); },
    puff() { audio.noise(0.5, 0.18, 1800, 300, 0, 'lowpass'); audio.tone(140, 0.3, 'sine', 0.12, 0, 70); },
    nope() { sfx.puff(); audio.tone(300, 0.7, 'sawtooth', 0.1, 0.05, 110); },
    bubbles() { for (let i = 0; i < 36; i++) { const f = 300 + Math.random() * 500; audio.tone(f, 0.08, 'sine', 0.05, i * 0.13 + Math.random() * 0.08, f * 1.8); } },
    steam() { audio.noise(2.4, 0.07, 500, 2200, 0, 'bandpass'); },
    chime() { [[110, 0.22], [303.6, 0.12], [594, 0.07], [982, 0.04]].forEach(([f, v]) => audio.tone(f, 3.6, 'sine', v)); audio.tone(55, 3.5, 'sine', 0.15); },
    // a cockroach skittering: two bursts of tiny, quiet clicks matching its two darts across the floor
    skitter() { [[0, 22], [1.9, 24]].forEach(([t0, n]) => { for (let i = 0; i < n; i++) audio.noise(0.025, 0.045, 5000, 3000, t0 + i * 0.045 + Math.random() * 0.02, 'highpass'); }); },
    // Dracula snoring in the cave: two slow breaths (a soft rasp swelling in, then a low rumble out)
    snore() { [0, 1.7].forEach((t) => { audio.noise(0.8, 0.1, 250, 500, t, 'lowpass'); audio.tone(95, 0.7, 'sawtooth', 0.05, t + 0.55, 60); }); },
    bats() { audio.noise(1.6, 0.16, 900, 3200); audio.noise(1.2, 0.1, 2500, 800, 0.4, 'highpass'); },
    // Dracula's laugh after the kitchen summon: recorded horror laugh (Freesound, CC BY 4.0, see credits), first 5 s; synthesized laugh if it failed to load
    summonLaugh() { audio.laughBuf ? audio.playBuffer(audio.laughBuf, 0.85) : sfx.laugh(); },
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
      if (currentStory().mode === 'idle') sfx.owl();
      scheduleOwl();
    });
  }

  /* kitchen ambient: a cockroach scurries across the floor every 20–35 s (never during the payoff or in reduced motion) */
  function scheduleRoach(first = false) {
    clock.after(first ? 7000 : 20000 + Math.random() * 15000, () => {
      if (scene === 'kitchen' && kitchen.mode === 'idle' && !reduced()) {
        const r = $('roach'); r.classList.remove('run'); void r.offsetWidth; r.classList.add('run'); sfx.skitter();
        clock.after(3500, () => r.classList.remove('run'));
      }
      scheduleRoach();
    });
  }

  /* ambient lightning: random 9–20 s gaps on the shared clock; the thunder arrives 0.7–2.2 s later, far away */
  function scheduleLightning(first = false) {
    clock.after(first ? 11000 : 9000 + Math.random() * 11000, () => {
      if (scene === 'castle' && story.mode === 'idle') {
        const l = $('lightning'), bolt = $('bolt');
        bolt.style.left = `${6 + Math.random() * 16}%`;
        l.classList.remove('on'); void l.offsetWidth; l.classList.add('on'); clock.after(900, () => l.classList.remove('on'));
        clock.after(700 + Math.random() * 1500, () => sfx.farThunder());
      }
      scheduleLightning();
    });
  }
  /* ---------- progressive hints: by idle time since the player last interacted, per story phase ---------- */
  const HINTS = {
    statues: [
      [5000, 'The road is quiet… but the stone guardians seem to be watching you.'],
      [20000, 'They wake in a certain order. Start on the left.'],
      [40000, 'Begin at the front of the road, climb toward the far side… then come back down.'],
    ],
    eyes: [
      [6000, 'Something is watching from the trees…'],
      [20000, 'Many eyes glow in the dark, but they are not all equal. Which one is watching hardest?'],
    ],
    kitchen: [
      [5000, 'The Count is hungry… he left his recipe scroll lying on the floor.'],
      [20000, 'Something bottled from the moon… and a gourd from the harvest.'],
      [40000, 'And something that flutters in the dark: shaped like wings.'],
    ],
    bats: [
      [5000, 'The bats hang restless above the cave…'],
      [20000, 'The old graves are not as silent as they look…'],
    ],
  };
  const hints = {
    lastActive: 0, shown: -1,
    reset() { this.lastActive = clock.t; this.shown = -1; hintEl.classList.remove('show'); },
    update() {
      const s = currentStory(), idle = clock.t - this.lastActive;
      if (s.mode !== 'idle') return;
      const steps = HINTS[s.phase];
      const step = steps.reduce((n, [ms], i) => (idle >= ms ? i : n), -1);
      if (step > this.shown) { this.shown = step; hintEl.textContent = steps[step][1]; hintEl.classList.add('show'); }
    },
  };

  /* ---------- feedback helpers ---------- */
  const batSVG = '<svg viewBox="0 0 40 22"><path d="M20 20 L16 9 L11 12 L0 2 Q8 12 6 18 Q12 14 16 20 Q18 17 20 20 Q22 17 24 20 Q28 14 34 18 Q32 12 40 2 L29 12 L24 9Z"/></svg>';
  function ringAt(el, color, soft = false) {
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect(), d = document.createElement('div');
    d.className = soft ? 'ring soft' : 'ring'; d.style.cssText = `left:${r.left - s.left + r.width / 2}px;top:${r.top - s.top + r.height / 2}px;--c:${color}`;
    stage.appendChild(d); clock.after(800, () => d.remove());
  }
  function toast(text, ms = 2600) { toastEl.textContent = text; toastEl.classList.add('show'); clock.after(ms, () => toastEl.classList.remove('show')); }
  function setPips(n) {
    const pips = stage.querySelector('.pips');
    [...pips.children].forEach((el, i) => el.classList.toggle('on', i < n));
    pips.setAttribute('aria-label', `Story progress ${n} of ${pips.children.length}`);
  }
  function flash() { if (reduced()) return; const f = stage.querySelector('.flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }

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
      if (seyes[i].classList.contains('on')) { sfx.rechime(); ringAt(el, '#ff5a4a'); return; }   // already glowing: harmless
      if (story.phase === 'statues' && i === ORDER[story.progress]) {
        story.progress++;
        seyes[i].classList.add('on', 'pop'); clock.after(500, () => seyes[i].classList.remove('pop'));
        sfx.light(story.progress); ringAt(el, '#ff5a4a'); setPips(story.progress);
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
      clock.after(600, story.play);
    },
    resetStatues() { story.progress = 0; setPips(0); seyes.forEach((l) => l.classList.remove('on')); },
    reset() { story.resetStatues(); story.phase = 'statues'; eyeEls.forEach((e) => { e.hidden = true; e.classList.remove('shut'); }); },
    play() { // ~8.5 s: thunder + door flare → Dracula steps out + creak → Toccata + bats → laugh → fade → rest
      story.mode = 'story'; stage.classList.add('story'); hintEl.classList.remove('show'); $('nav1').hidden = true;
      document.activeElement && document.activeElement.blur();
      const at = (ms, fn) => clock.after(ms, fn), rm = reduced();
      eyeEls.forEach((e) => { e.hidden = true; }); sfx.rise();
      at(900, () => { stage.classList.add('flare'); sfx.thunder(); flash(); });
      at(1800, () => { sfx.door(); $('dracula').classList.add('show'); $('dracShadow').classList.add('show'); });   // steps out of the door onto the steps
      at(1900, () => sfx.toccata());
      at(3200, () => {
        sfx.bats();
        if (!rm) {
          $('bats').innerHTML = [[-30, -45], [-8, -60], [14, -52], [35, -40], [-48, -20], [50, -18], [4, -30]].map(([dx, dy], k) =>
            `<div class="bat" style="--dx:${dx};--dy:${dy};animation-delay:${k * 0.12}s">${batSVG}</div>`).join('');
          at(4000, () => { $('bats').innerHTML = ''; });
        }
      });
      at(7000, () => { sfx.laugh(); flash(); $('dracula').classList.remove('show'); $('dracShadow').classList.remove('show'); });
      at(7300, () => { stage.classList.remove('flare'); seyes.forEach((l) => l.classList.remove('on')); sfx.end(); });
      at(8000, () => {
        story.reset(); story.mode = 'idle'; stage.classList.remove('story'); hints.reset();
        $('nav1').hidden = false;   // the castle is playable again straight away; the arrow offers the way on
        toast('“Come inside… if you dare.”', 4500);
      });
    },
  };

  /* ---------- Story 2: "The Cave Awakens" — tap the hanging bats 1, 3, 5 in order → cave glows red → Dracula drops in upside down ---------- */
  const bats2 = [0, 1, 2, 3, 4].map((i) => $('b' + i));
  const ORDER2 = [0, 2, 4]; // bats 1, 3 and 5 from the left
  const story2 = {
    mode: 'idle',        // idle | story (payoff playing, input locked) | wrong (red-eye reset blink) | done (nav arrows shown)
    phase: 'bats',
    progress: 0,
    tap(i) {
      if (story2.mode !== 'idle' || !clock.running) return;
      hints.reset();
      const el = bats2[i];
      if (el.classList.contains('on')) return;   // already awake
      if (i !== ORDER2[story2.progress]) { story2.wrong(i); return; }
      story2.progress++;
      el.classList.add('on');   // a correct bat squeaks and glows; they all fly away together in the payoff
      sfx.squeak(story2.progress); setPips(story2.progress);
      if (story2.progress === ORDER2.length) { story2.mode = 'story'; stage.classList.add('story2'); hintEl.classList.remove('show'); $('nav2').hidden = true; clock.after(700, story2.play); }
    },
    wrong(i) { // the tapped bat's eyes turn red, everything resets
      story2.mode = 'wrong'; sfx.screech();
      bats2[i].classList.add('wrong'); toast('The bats shriek and settle. Start again…', 2000);
      clock.after(1100, () => { story2.reset(true); story2.mode = 'idle'; hints.reset(); });
    },
    reveal(g) { // the number carved on this gravestone shows for 3 s (quietly: no ring); tapping again restarts the timer
      if (story2.mode !== 'idle' || !clock.running) return;
      hints.reset(); sfx.whisper();
      g.classList.add('rev'); const id = (g._rev = (g._rev || 0) + 1);
      clock.after(3000, () => { if (id === g._rev) g.classList.remove('rev'); });
    },
    reset(fadeBack = false) { // bats that flew away return (fading in after a wrong tap or when the story ends)
      story2.progress = 0; setPips(0);
      bats2.forEach((b) => { const flew = b.classList.contains('fly'); b.classList.remove('on', 'wrong', 'fly'); if (fadeBack && flew) { b.classList.add('back'); clock.after(900, () => b.classList.remove('back')); } });
    },
    play() { // ~8 s: bats take off → cave glows red → Dracula fades in upside down → laugh → fade → rest
      const at = (ms, fn) => clock.after(ms, fn);
      document.activeElement && document.activeElement.blur();
      document.querySelectorAll('.grave').forEach((g) => g.classList.remove('rev')); sfx.bats(); bats2.forEach((b) => b.classList.add('fly'));
      at(1400, () => { stage.classList.add('lit'); sfx.rise(); });
      at(2600, () => { $('drac2').classList.add('show'); sfx.sting(); });   // he fades in (no drop), with a dramatic sting
      at(3000, () => toast('“…zzz… five more minutes…”', 3000));
      at(4200, () => { stage.classList.add('zzz'); sfx.snore(); });   // he is asleep: soft snoring and floating Zs
      at(6000, () => $('drac2').classList.remove('show'));
      at(6800, () => { stage.classList.remove('lit', 'zzz'); sfx.end(); });
      at(8000, () => {
        story2.reset(true); story2.mode = 'idle'; stage.classList.remove('story2'); hints.reset();
        $('nav2').hidden = false;
        toast('Found him! Shh… let the Count sleep.', 4500);
      });
    },
  };
  // 36 thin rain streaks with random position, speed, delay and faintness
  $('rain').innerHTML = Array.from({ length: 36 }, () =>
    `<i style="--rx:${(Math.random() * 115).toFixed(1)};--rd:${(0.9 + Math.random() * 0.7).toFixed(2)}s;--rl:${(-Math.random() * 2).toFixed(2)}s;--ro:${(0.3 + Math.random() * 0.35).toFixed(2)}"></i>`).join('');
  /* ---------- Story 2: "Dinner for the Count" — drop the three right ingredients into the cauldron (any order) → soup bubbles → Dracula appears ---------- */
  const KING = ['moon', 'pumpkin', 'pasta', 'garlic', 'mushrooms', 'swirl', 'candycorn', 'berries', 'crystals', 'herb'];
  const GOOD = new Set(['moon', 'pumpkin', 'pasta']);   // moon essence, pumpkin, bat-shaped pasta
  const ingEls = Object.fromEntries(KING.map((k) => [k, $('ing-' + k)]));
  // one spot per shelf (left shelves top→bottom, then right): bottom-centre of an ingredient as % of the stage
  const SLOTS = [[14.7, 23.0], [17.0, 31.7], [17.6, 40.3], [18.2, 48.7], [18.2, 56.7], [85.2, 22.7], [83.7, 31.9], [82.8, 40.3], [82.3, 48.7], [81.9, 56.6]];
  const WRONG_LINES = ['The pot coughs it right back out.', 'Not even a ghost would eat that.', 'Too lumpy. Try again.'];
  const kitchen = {
    mode: 'idle',        // idle | story (payoff playing) | done (arrows shown)
    phase: 'kitchen', progress: 0, busy: false, anims: new Set(),
    layout() { // the ten ingredients are dealt to the ten shelves at random, so the right three land on random shelves
      const slots = [...SLOTS];
      for (let i = slots.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [slots[i], slots[k]] = [slots[k], slots[i]]; }
      KING.forEach((k, i) => { ingEls[k].style.setProperty('--x', slots[i][0]); ingEls[k].style.setProperty('--y', slots[i][1]); });
    },
    fly(el, ms, back) { // the item arcs to the cauldron mouth (and, for a wrong one, back again); reduced motion just fades
      const m = $('potMouth').getBoundingClientRect(), r = el.getBoundingClientRect();
      const dx = m.left - (r.left + r.width / 2), dy = m.top - (r.top + r.height / 2);
      const at = (f, s, lift = 0) => `translate(-50%, -100%) translate(${dx * f}px, ${dy * f - lift}px) scale(${s})`;
      const base = 'translate(-50%, -100%)';
      const frames = reduced() ? [{ opacity: 1 }, { opacity: back ? 1 : 0 }]
        : back ? [{ transform: base }, { transform: at(1, .35), offset: .4 }, { transform: at(1, .35), offset: .55 }, { transform: base }]
               : [{ transform: base }, { transform: at(.5, .8, 30), offset: .5 }, { transform: at(1, .3), opacity: .9 }];
      const a = el.animate(frames, { duration: ms, easing: 'ease-in-out' }); kitchen.anims.add(a); a.onfinish = () => kitchen.anims.delete(a);
    },
    puffAt(x, y, size, color) { // a smoke puff at (x%, y%) of the stage
      const d = document.createElement('div'); d.className = 'puff'; d.style.cssText = `left:${x}%;top:${y}%;--ps:${size};${color ? `--pc:${color}` : ''}`;
      stage.appendChild(d); clock.after(900, () => d.remove());
    },
    toggleRiddle() { // the recipe scroll opens and closes the riddle (with a paper rustle)
      if (kitchen.mode !== 'idle' || !clock.running) return;
      hints.reset(); sfx.rustle();
      const open = stage.classList.toggle('riddle'); $('scroll').setAttribute('aria-pressed', String(open));
    },
    tap(id) {
      if (kitchen.mode !== 'idle' || kitchen.busy || !clock.running) return;
      const el = ingEls[id]; if (el.classList.contains('used')) return;
      hints.reset(); kitchen.busy = true;
      if (GOOD.has(id)) {   // drops into the cauldron with its own sound and adds a progress dot
        sfx.ing(id); kitchen.fly(el, 650, false);
        clock.after(650, () => {
          el.classList.add('used'); kitchen.progress++; setPips(kitchen.progress); sfx.blorp();
          kitchen.busy = false;
          if (kitchen.progress === 3) { kitchen.mode = 'story'; stage.classList.add('story', 'solved');   // the riddle fades away once the recipe is complete
             hintEl.classList.remove('show'); $('navK').hidden = true; clock.after(500, kitchen.play); }
        });
        return;
      }
      kitchen.fly(el, 950, true);   // wrong: the pot puffs and spits it back; progress is kept (garlic wipes it)
      clock.after(450, () => {
        if (id === 'garlic') { kitchen.puffAt(50, 64, 22, 'rgba(170, 230, 150, .85)'); sfx.nope(); toast('A voice roars: “GARLIC?! In MY soup?!” The pot spits everything out.', 3400); }
        else { kitchen.puffAt(50, 64, 14); sfx.puff(); toast(WRONG_LINES[Math.floor(Math.random() * WRONG_LINES.length)], 2000); }
      });
      clock.after(950, () => { if (id === 'garlic') kitchen.resetAll(true); kitchen.busy = false; });
    },
    resetAll(fadeBack = false) { // used ingredients return to their shelves and the recipe clears
      kitchen.progress = 0; setPips(0);
      KING.forEach((k) => { const el = ingEls[k], used = el.classList.contains('used'); el.classList.remove('used');
        if (fadeBack && used) { el.classList.add('back'); clock.after(800, () => el.classList.remove('back')); } });
    },
    reset(fresh = false) { kitchen.resetAll(fresh); kitchen.busy = false; kitchen.layout(); stageK.classList.remove('solved'); },
    play() { // ~8.5 s: soup bubbles + red glow → steam → Dracula fades in behind the pot with a low bell → funny lines → he leaves in a puff
      const at = (ms, fn) => clock.after(ms, fn);
      document.activeElement && document.activeElement.blur();
      stage.classList.add('cook'); sfx.bubbles();
      at(600, () => sfx.steam());
      at(1600, () => { $('kdrac').classList.add('show'); sfx.chime(); toast('A voice rumbles: “Who dares summon me… for DINNER?”', 2000); });
      at(1900, () => sfx.summonLaugh());   // his laugh rolls out just after the bell (5 s, ends as he leaves)
      at(6300, () => {   // he bursts into bats and flies off to nap
        const d = $('kdrac'); d.classList.add('gone'); d.classList.remove('show'); kitchen.puffAt(50, 56, 24, 'rgba(150, 110, 190, .85)'); sfx.puff(); sfx.bats();
        if (!reduced()) {
          $('kbats').innerHTML = [[-38, -70], [-22, -88], [-6, -96], [12, -90], [30, -80], [44, -66], [2, -60]].map(([dx, dy], k) =>
            `<div class="bat" style="left:50%;top:52%;--dx:${dx};--dy:${dy};animation-delay:${k * 0.1}s">${batSVG}</div>`).join('');
          at(3000, () => { $('kbats').innerHTML = ''; });
        }
      });
      at(7100, () => { stage.classList.remove('cook'); $('kdrac').classList.remove('gone'); sfx.end(); });
      at(8000, () => {
        kitchen.reset(true); kitchen.mode = 'idle'; stage.classList.remove('story', 'solved', 'riddle'); $('scroll').setAttribute('aria-pressed', 'false'); hints.reset();
        $('navK').hidden = false;
        toast('The kitchen is empty… where did the Count go?', 4500);
      });
    },
  };
  kitchen.layout();
  const STORIES = { castle: story, kitchen, cave: story2 };
  const NAV = { castle: ['nav1', 'pause'], kitchen: ['navK', 'pauseK'], cave: ['nav2', 'pause2'] };
  const currentStory = () => STORIES[scene];

  /* ---------- scene switching (next / back arrows) ---------- */
  function showScene(key) {
    scene = key; stage = STAGES[key];
    Object.entries(STAGES).forEach(([k, el]) => { el.hidden = k !== key; });
    hintEl = stage.querySelector('.hint'); toastEl = stage.querySelector('.toast');
    key === 'cave' ? audio.startRain() : audio.stopRain();
    hints.reset();
  }
  function go(key) { // leave the current story (reset, arrows hidden) and open another, ready to play
    const from = currentStory(); $(NAV[scene][0]).hidden = true; from.reset(); from.mode = 'idle';
    showScene(key); const to = STORIES[key]; to.reset && to.reset(); to.mode = 'idle';
    $(NAV[key][1]).focus({ preventScroll: true });
  }

  /* ---------- global Play/Pause: audio, CSS animation, shared timers and interaction together ---------- */
  function setPaused(paused) {
    clock.running = !paused; clock.last = performance.now();
    Object.values(STAGES).forEach((el) => el.classList.toggle('paused', paused));
    kitchen.anims.forEach((a) => (paused ? a.pause() : a.play()));
    document.body.classList.toggle('paused', paused);
    document.querySelectorAll('.pause').forEach((btn) => { btn.setAttribute('aria-pressed', String(paused)); btn.setAttribute('aria-label', paused ? 'Play' : 'Pause'); });
    paused ? audio.suspend() : audio.resume();
  }
  const isPaused = () => !clock.running;

  /* ---------- start / wiring ---------- */
  $('reduceMotion').checked = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('enter').addEventListener('click', async () => {
    document.documentElement.dataset.motion = $('reduceMotion').checked ? 'reduced' : 'full';
    $('start').hidden = true; stage.hidden = false;
    await audio.init();
    hints.reset(); scheduleOwl(true); scheduleLightning(true); scheduleRoach(true);
    $('pause').focus({ preventScroll: true });
    requestAnimationFrame((n) => { clock.last = n; clock.tick(n); });
    const jump = location.hash.slice(1);   // developer shortcut: index.html#kitchen or #cave opens that story directly
    if (STAGES[jump] && jump !== 'castle') go(jump);
  });
  gargs.forEach((g, i) => g.addEventListener('click', () => story.tapStatue(i)));
  eyeEls.forEach((e, k) => e.addEventListener('click', () => story.tapEyes(k)));
  bats2.forEach((b, i) => b.addEventListener('click', () => story2.tap(i)));
  document.querySelectorAll('.grave').forEach((g) => g.addEventListener('click', () => story2.reveal(g)));
  KING.forEach((k) => ingEls[k].addEventListener('click', () => kitchen.tap(k)));
  $('scroll').addEventListener('click', () => kitchen.toggleRiddle());
  $('scrollOpen').addEventListener('click', () => kitchen.toggleRiddle());
  $('next1').addEventListener('click', () => go('kitchen'));
  $('backK').addEventListener('click', () => go('castle'));
  $('nextK').addEventListener('click', () => go('cave'));
  $('back2').addEventListener('click', () => go('kitchen'));
  document.querySelectorAll('.pause').forEach((b) => b.addEventListener('click', () => setPaused(!isPaused())));
  document.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'p' && !stage.hidden) setPaused(!isPaused()); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && !stage.hidden && !isPaused()) setPaused(true); });
})();
