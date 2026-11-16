// Motion for essay pages. Each step paragraph changes the sticky figure beside it.
// Everything animates from a hidden state to the natural layout, so reduced motion
// or a failed script load leaves the complete static page.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  // Wide screens sync each figure step to its paragraph beside it. Phones show the figure
  // inline above the text and play all its steps as the figure scrolls past.
  const wide = matchMedia("(min-width: 901px)").matches;
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add("motion");

  gsap.to(".progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });

  const passes = new Map();
  // On wide screens every step of a figure lives in one timeline, one time unit per step, and
  // the paragraphs' scroll positions drive that timeline's time. Separate scrubbed timelines
  // per step raced each other on fast scrolls: a lagging earlier step could finish after a
  // later one and put back what the later step had hidden.
  const masters = new Map();
  const sync = (m) => {
    let t = 0;
    m.triggers.forEach((st, i) => { if (st.progress > 0) t = i + st.progress; });
    gsap.to(m.tl, { time: t, duration: 0.6, ease: "power3", overwrite: true });
  };
  ScrollTrigger.addEventListener("refresh", () => masters.forEach(sync));
  const step = (story, k, build) => {
    if (wide) {
      if (!masters.has(story)) masters.set(story, { tl: gsap.timeline({ paused: true }), triggers: [] });
      const m = masters.get(story);
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut", duration: 0.5 } });
      build(tl);
      if (tl.duration()) tl.timeScale(tl.duration());
      const i = m.triggers.length;
      m.tl.add(tl, i).set({}, {}, i + 1);
      const para = story.querySelector(`[data-step="${k}"]`);
      m.triggers.push(ScrollTrigger.create({ trigger: para, start: "top 72%", end: "top 38%", onUpdate: () => sync(m) }));
      return;
    }
    if (!passes.has(story)) {
      passes.set(story, gsap.timeline({
        scrollTrigger: { trigger: story.querySelector(".visual"), start: "top 75%", end: "top 8%", scrub: 0.6 },
      }));
    }
    const tl = gsap.timeline({ defaults: { ease: "power2.inOut", duration: 0.5 } });
    build(tl);
    passes.get(story).add(tl).add(gsap.timeline().set({}, {}, 0.25));
  };

  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  // One entry per figure, named by the story's data-story attribute.
  const stories = {
    triage(story, q) {
      const chips = q(".inbox > div"), binItems = q(".bin span"), bins = q(".bin");
      gsap.set(q(".meter-fill:not(.meter-next)"), { width: "100%" });
      gsap.set(q(".meter-next"), { width: "0%" });
      gsap.set([...chips, ...binItems, ...q(".layer")], { opacity: 0 });
      gsap.set(bins, { opacity: 0.35 });
      step(story, 1, (tl) => {
        tl.fromTo(chips, { y: -60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, ease: "bounce.out", immediateRender: false });
        tl.to(q(".meter-fill:not(.meter-next)"), { width: "15%", backgroundColor: css("--coral") }, 0);
      });
      // Step 1 owns the chips and the first fill. Step 2 only touches the inbox box and the
      // second fill, so a fast scroll can't leave the two steps fighting over the same values.
      step(story, 2, (tl) => {
        tl.to(q(".inbox"), { y: 40, opacity: 0, duration: 0.3 });
        tl.to(q(".inbox"), { height: 0, marginBottom: 0, duration: 0.25 }, 0.25);
        tl.to(bins, { opacity: 1, duration: 0.2 }, 0.3);
        tl.fromTo(binItems, { y: -20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, immediateRender: false }, 0.35);
        tl.fromTo(q(".meter-next"), { width: "0%" }, { width: "85%", immediateRender: false }, 0.3);
      });
      step(story, 3, (tl) => tl.fromTo(q(".layer"), { y: 40, opacity: 0 }, { y: 0, opacity: 1, immediateRender: false }));
    },

    lanes(story, q) {
      const [a, b] = q(".lane-row");
      gsap.set([a, b].map((l) => l.querySelector(".meter-fill")), { width: "100%", backgroundColor: css("--mint") });
      gsap.set([...a.querySelectorAll(".lane-flow > *"), b], { opacity: 0 });
      step(story, 1, (tl) => {
        tl.fromTo(a.querySelectorAll(".lane-flow > *"), { x: -30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.07, immediateRender: false });
        tl.to(a.querySelector(".meter-fill"), { width: "18%", backgroundColor: css("--coral") }, 0.2);
      });
      step(story, 2, (tl) => {
        tl.fromTo(b, { y: 30, opacity: 0 }, { y: 0, opacity: 1, immediateRender: false });
        tl.fromTo(b.querySelectorAll(".lane-flow > *"), { x: -30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.07, immediateRender: false }, 0.1);
        tl.to(b.querySelector(".meter-fill"), { width: "85%" }, 0.3);
      });
    },

    chain(story, q) {
      const intent = q(".intent"), rest = q(".align-chain > .check, .fence-box .node-box, .fence-box .check, .align-chain > .node-box:not(.intent)");
      gsap.set([...intent, ...rest, ...q(".fence-tag"), ...q(".runs > div")], { opacity: 0 });
      gsap.set(q(".fence-box"), { borderColor: "transparent" });
      gsap.set(q(".truth, .hatch"), { opacity: 0 });
      step(story, 1, (tl) => tl.fromTo(intent, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, ease: "back.out(2)", immediateRender: false }));
      step(story, 2, (tl) => tl.fromTo(rest, { x: -20, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.08, immediateRender: false }));
      step(story, 3, (tl) => {
        tl.to(q(".fence-box"), { borderColor: css("--cobalt"), duration: 0.4 });
        tl.to(q(".fence-tag"), { opacity: 1, duration: 0.3 }, 0.1);
      });
      step(story, 4, (tl) => {
        tl.fromTo(q(".runs > div"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, immediateRender: false });
        tl.to(q(".look"), { opacity: 0, duration: 0.2 }, 0.55);
        tl.to(q(".truth, .hatch"), { opacity: 1, duration: 0.3 }, 0.65);
      });
    },

    checker(story, q) {
      const dots = q(".dots i");
      gsap.set([...dots, ...q(".scorer")], { opacity: 0 });
      step(story, 1, (tl) => tl.fromTo(dots, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.015, ease: "back.out(2)", immediateRender: false }));
      step(story, 2, (tl) => {
        tl.to(dots, { backgroundColor: css("--mint"), stagger: 0.015, duration: 0.2 });
        tl.set(q(".grid-label .before"), { display: "none" }, 0.3);
        tl.set(q(".grid-label .after"), { display: "inline" }, 0.3);
        tl.fromTo(q(".scorer"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, immediateRender: false }, 0.4);
      });
    },

    // A context window that gets compacted, then one that gets rebuilt from a core.
    reseed(story, q) {
      const [a, b] = q(".win-row");
      const fillA = a.querySelector(".win-fill"), stripes = a.querySelector(".stripes");
      const lost = [...a.querySelectorAll(".lost")], gist = a.querySelector(".gist");
      const fillB = b.querySelector(".win-fill");
      gsap.set(fillA, { width: "18%" });
      gsap.set([stripes, gist, b], { opacity: 0 });
      gsap.set(lost, { opacity: 1, textDecoration: "none" });
      gsap.set(fillB, { width: "0%" });
      step(story, 1, (tl) => {
        tl.to(fillA, { width: "92%", ease: "none", duration: 0.6 });
        tl.to(fillA, { width: "28%", duration: 0.25 });
        tl.to(stripes, { opacity: 1, duration: 0.2 }, "<");
      });
      step(story, 2, (tl) => {
        tl.to(lost, { opacity: 0.35, stagger: 0.12, duration: 0.3 });
        tl.set(lost, { textDecoration: "line-through" }, 0.3);
        tl.to(gist, { opacity: 1, duration: 0.3 }, 0.4);
      });
      step(story, 3, (tl) => {
        tl.to(b, { opacity: 1, duration: 0.3 });
        tl.to(fillB, { width: "42%", ease: "none", duration: 0.5 });
        tl.to(fillB, { width: "14%", duration: 0.25 });
      });
    },

    // Everyone reviewing everyone, thinned to the links worth having.
    teams(story, q) {
      const nodes = q(".tm-node"), mesh = q(".tm-all"), kept = q(".tm-kept"), obj = q(".tm-obj");
      const all = q(".tm-count-all"), few = q(".tm-count-kept");
      gsap.set([...nodes, ...mesh, ...kept, ...obj, ...all, ...few], { opacity: 0 });
      step(story, 1, (tl) => tl.fromTo(nodes, { scale: 0.5, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, transformOrigin: "50% 50%", stagger: 0.05, ease: "back.out(2)", immediateRender: false }));
      step(story, 2, (tl) => {
        tl.to(mesh, { opacity: 0.6, stagger: 0.008, duration: 0.2 });
        tl.to(all, { opacity: 1, duration: 0.2 }, 0);
        tl.to(mesh, { opacity: 0.08, duration: 0.3 }, 0.6);
        tl.to(all, { opacity: 0, duration: 0.2 }, 0.6);
        tl.to(kept, { opacity: 1, stagger: 0.03, duration: 0.2 }, 0.7);
        tl.to(few, { opacity: 1, duration: 0.2 }, 0.85);
      });
      step(story, 3, (tl) => tl.to(obj, { opacity: 1, duration: 0.4 }));
    },

    // The model running its own loop, then plain code starting one short-lived agent per event.
    clock(story, q) {
      const evs = q(".ev"), done = q(".ev-done"), mem = q(".mem"), track = q(".orch-track");
      gsap.set([...evs, ...done, ...mem], { opacity: 0 });
      gsap.set(track, { scaleX: 0, transformOrigin: "0 50%" });
      step(story, 1, (tl) => {
        tl.to(q(".loop-a"), { opacity: 0.4, duration: 0.3 });
        tl.to(track, { scaleX: 1, ease: "none", duration: 0.5 }, 0.1);
        tl.fromTo(evs, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.15, duration: 0.3, immediateRender: false }, 0.2);
      });
      step(story, 2, (tl) => tl.fromTo(done, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.1, ease: "back.out(2)", immediateRender: false }));
      step(story, 3, (tl) => tl.fromTo(mem, { y: 15, opacity: 0 }, { y: 0, opacity: 1, immediateRender: false }));
    },
  };

  document.querySelectorAll(".story").forEach((story) => {
    const q = (sel) => [...story.querySelector(".visual").querySelectorAll(sel)];
    stories[story.dataset.story]?.(story, q);
  });

  // Figures that sit in the text column play once as they scroll past.
  const figures = {
    agree(tl, q) {
      tl.from(q(".votes i"), { scale: 0, opacity: 0, stagger: 0.04, ease: "back.out(2)", duration: 0.3 });
      tl.from(q(".approve"), { opacity: 0, duration: 0.2 }, 0.2);
      tl.from(q(".found span"), { y: -30, opacity: 0, stagger: 0.15, duration: 0.3 }, 0.6);
      tl.from(q(".checked"), { opacity: 0, duration: 0.2 }, 0.6);
    },
    decide(tl, q) {
      tl.from(q(".cons"), { height: 0, opacity: 0, duration: 0.5 });
      tl.from(q(".considered li"), { y: 14, opacity: 0, stagger: 0.12, duration: 0.3 }, 0.2);
      tl.from(q(".cons .pill"), { scale: 0.8, opacity: 0, duration: 0.25 });
    },
    door(tl, q) {
      tl.to(q(".verb-merge"), { opacity: 0, scale: 0.6, duration: 0.4 }, 0.15);
      tl.from(q(".verb-gone"), { opacity: 0, duration: 0.3 }, 0.4);
    },
  };

  document.querySelectorAll(".figure[data-figure]").forEach((fig) => {
    const q = (sel) => [...fig.querySelectorAll(sel)];
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut", duration: 0.5 },
      scrollTrigger: { trigger: fig, start: "top 78%", end: "top 30%", scrub: 0.6 },
    });
    figures[fig.dataset.figure]?.(tl, q);
  });

  gsap.utils.toArray(".rise").forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 92%", end: "top 70%", scrub: 0.6 } });
  });

  gsap.utils.toArray(".deco").forEach((el) => {
    const tilt = el.classList.contains("diamond") ? 45 : el.classList.contains("ring") ? -45 : 0;
    gsap.set(el, { rotate: 0 });
    gsap.fromTo(el, { yPercent: 0, rotation: tilt }, { yPercent: -60, rotation: tilt + 20, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top top", end: "bottom top", scrub: true } });
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
})();
