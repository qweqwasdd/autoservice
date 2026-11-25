(() => {
  const byId = (id) => document.getElementById(id);
  const scene = byId('scene');
  const stage = scene.querySelector('.stage');
  const footer = scene.querySelector('.stage-footer');
  const comb = byId('comb');
  const scissors = byId('scissors');
  const trimmer = byId('trimmer');
  const jawA = byId('jaw-a');
  const jawB = byId('jaw-b');
  const clippings = byId('clippings');
  const finish = byId('portrait-finish');
  const backMask = byId('back-sweep');
  const sideMask = byId('side-sweep');
  const beardMask = byId('beard-sweep');
  const ship = byId('ship-track');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (number) => Math.max(0, Math.min(1, number));
  const interval = (t, start, end) => clamp((t - start) / (end - start));
  const smooth = (t, start, end) => {
    const p = interval(t, start, end);
    return p * p * (3 - 2 * p);
  };
  const show = (node, opacity) => node.setAttribute('opacity', opacity);
  const move = (node, x, y, angle = 0, scale = 1) => {
    node.setAttribute('transform', `translate(${x} ${y}) rotate(${angle}) scale(${scale})`);
  };
  const gradient = (node, x1, y1, x2, y2) => {
    node.setAttribute('x1', x1);
    node.setAttribute('y1', y1);
    node.setAttribute('x2', x2);
    node.setAttribute('y2', y2);
  };
  const snips = [
    { time: .19, x: 813, y: 625, side: 1 },
    { time: .27, x: 785, y: 546, side: 1 },
    { time: .35, x: 762, y: 460, side: 1 },
    { time: .45, x: 695, y: 376, side: 1 },
    { time: .53, x: 552, y: 287, side: 1 },
    { time: .61, x: 459, y: 193, side: 1 },
    { time: .72, x: 549, y: 596, side: -1 },
    { time: .79, x: 426, y: 629, side: -1 },
    { time: .87, x: 304, y: 566, side: -1 },
  ];
  let enabled = false;
  let ready = false;
  let progress = 0;
  let scrollTarget = 0;
  const page = document.documentElement;
  let completed = false;
  function unlock() {
    page.classList.remove('scene-gated');
  }
  let velocity = 0;
  let lastFrameTime = null;
  let frame = 0;

  function draw(value) {
    progress = clamp(value);
    const t = progress;
    const nape = smooth(t, .15, .41);
    const side = smooth(t, .39, .65);
    const beard = smooth(t, .655, .93);
    move(ship, 150 + 30 * smooth(t, 0, 1), 488);

    const backEdge = 790 - nape * 550;
    gradient(backMask, 0, backEdge - 35, 0, backEdge + 35);
    const sideEdge = 1055 - side * 877;
    gradient(sideMask, sideEdge - 38, 0, sideEdge + 38, 0);
    const beardEdge = 1000 - beard * 1120;
    gradient(beardMask, beardEdge - 31, 440, beardEdge + 31, 502);
    show(finish, smooth(t, .94, 1));

    const opening = 1 - smooth(t, .038, .145);
    const retreat = smooth(t, .61, .71);
    const toolsAlpha = smooth(t, .04, .125) * (1 - smooth(t, .64, .71));
    const toolX = 905 - 63 * nape - 317 * side;
    const toolY = 645 - 212 * nape - 199 * side;
    const toolAngle = -15 + 19 * nape + 22 * side;
    move(scissors, toolX + 160 * opening + 120 * retreat, toolY + 125 * opening - 132 * retreat, toolAngle - 20 * opening - 31 * retreat, .78);
    move(comb, toolX - 53 + 180 * opening + 99 * retreat, toolY + 34 + 99 * opening - 89 * retreat, toolAngle - 63 + 22 * side, .78);
    show(scissors, toolsAlpha);
    show(comb, toolsAlpha * .94);

    let jaw = 0;
    let latest;
    for (const cut of snips) {
      if (cut.side === 1) {
        const open = smooth(t, cut.time - .068, cut.time - .024) * (1 - smooth(t, cut.time - .024, cut.time));
        jaw = Math.max(jaw, open);
      }
      if (t >= cut.time) latest = cut;
    }
    jawA.setAttribute('transform', `rotate(${-6 + 18 * jaw})`);
    jawB.setAttribute('transform', `rotate(${6 - 18 * jaw})`);

    const beardApproach = 1 - smooth(t, .62, .711);
    const sweep = smooth(t, .704, .885);
    const beardExit = smooth(t, .89, .975);
    const trimX = 554 - 260 * sweep - 106 * beardExit;
    const trimY = 599 + 45 * Math.sin(Math.PI * sweep) - 38 * sweep + 142 * beardApproach + 106 * beardExit;
    move(trimmer, trimX + 33 * beardApproach, trimY, -39 + 72 * sweep + 31 * beardExit, .79);
    show(trimmer, smooth(t, .625, .715) * (1 - smooth(t, .905, .97)));

    if (latest) {
      const age = t - latest.time;
      move(clippings, latest.x + latest.side * 440 * age, latest.y + 4800 * age * age, latest.side * 280 * age, latest.side === 1 ? .72 : .42);
      show(clippings, .95 * smooth(age, 0, .018) * (1 - smooth(age, .052, .128)));
    } else {
      show(clippings, 0);
    }

  }

  function cancelScroll() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastFrameTime = null;
    velocity = 0;
    scrollTarget = progress;
  }

  function scrollFrame(now) {
    const elapsed = lastFrameTime === null ? 16 : Math.min(22, now - lastFrameTime);
    const gap = scrollTarget - progress;
    if ((scrollTarget === 1 && gap <= .012) || (Math.abs(gap) <= .00015 && Math.abs(velocity) < .000005)) {
      velocity = 0;
      draw(scrollTarget);
      if (scrollTarget === 1 && !completed && page.classList.contains('scene-gated')) {
        // Present the final frame before moving the viewport to the contact card.
        requestAnimationFrame(() => {
          if (!enabled || completed || pageProgress() !== 1 || document.hidden) return;
          completed = true;
          unlock();
          byId('links').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      frame = 0;
      lastFrameTime = null;
      return;
    }
    // Critically damp the response so wheel steps and reversals have continuous velocity.
    const rate = .0073;
    const decay = Math.exp(-rate * elapsed);
    const offset = -gap;
    const slope = velocity + rate * offset;
    const next = scrollTarget + (offset + slope * elapsed) * decay;
    velocity = (velocity - rate * slope * elapsed) * decay;
    const step = Math.max(-elapsed / 2400, Math.min(elapsed / 2400, next - progress));
    draw(progress + step);
    lastFrameTime = now;
    frame = requestAnimationFrame(scrollFrame);
  }

  function pageProgress() {
    const travel = scene.offsetHeight - stage.offsetHeight;
    const distance = window.scrollY - scene.offsetTop;
    return travel <= 0 ? 0 : distance >= travel - 2 ? 1 : clamp(distance / travel);
  }

  function followScroll() {
    if (!enabled) return;
    const next = pageProgress();
    if (completed && next > 0) return;
    if (next === 0) {
      completed = false;
      page.classList.add('scene-gated');
    }
    if (next === scrollTarget) return;
    scrollTarget = next;
    if (!frame) frame = requestAnimationFrame(scrollFrame);
  }

  addEventListener('scroll', followScroll, { passive: true });
  addEventListener('resize', followScroll);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelScroll();
    else if (enabled && !completed && progress === 1 && pageProgress() === 1 && !frame) {
      frame = requestAnimationFrame(scrollFrame);
    } else followScroll();
  });

  if ('IntersectionObserver' in window) {
    const stageVisibility = new IntersectionObserver(([entry]) => {
      scene.classList.toggle('sea-visible', entry.isIntersecting);
    }, { threshold: .05 });
    stageVisibility.observe(stage);
  } else {
    scene.classList.add('sea-visible');
  }

  function configure() {
    cancelScroll();
    enabled = ready && !preference.matches;
    scene.classList.toggle('scene-ready', enabled);
    footer.hidden = !enabled;
    if (!enabled || location.hash === '#links') unlock();
    if (location.hash === '#links') byId('links').scrollIntoView({ behavior: 'instant' });
    if (enabled) {
      draw(page.classList.contains('scene-gated') ? 0 : pageProgress());
      scrollTarget = progress;
      followScroll();
    }
  }

  scene.querySelector('.jump').addEventListener('click', () => {
    cancelScroll();
    completed = true;
    if (enabled) draw(1);
    unlock();
    requestAnimationFrame(() => byId('tap-title').focus({ preventScroll: true }));
  });
  document.querySelector('.prices').addEventListener('toggle', (event) => {
    if (!event.currentTarget.open || preference.matches) return;
    event.currentTarget.querySelector('ul').animate(
      [{ opacity: .25, transform: 'translateY(-5px)' }, { opacity: 1, transform: 'none' }],
      { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' }
    );
  });
  preference.addEventListener('change', configure);
  const fileNames = ['overgrown.webp', 'groomed.webp', 'cut-nape.webp', 'cut-sides.webp', 'cut-beard.webp', 'cut-water.webp', 'cut-sea.webp'];
  Promise.all(fileNames.map((name) => {
    const image = new Image();
    image.src = `img/${name}`;
    return image.decode();
  })).then(() => {
    clearTimeout(window.sceneLoadFallback);
    if (!preference.matches && location.hash !== '#links' && !page.classList.contains('scene-gated')) return;
    completed = location.hash === '#links';
    ready = true;
    configure();
  }).catch(() => {
    unlock();
    // The contact links and the static poster remain usable if a plate fails.
  });
})();
