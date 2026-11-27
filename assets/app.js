/* Umami AI — sitio público. Sin dependencias externas. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  root.classList.add("js");

  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- títulos partidos en palabras ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(function (w, i) {
      return '<span class="wd" aria-hidden="true"><span style="--i:' + i + '">' + esc(w) + "</span></span>";
    }).join(" ");
  });

  /* ---------- palabras que se encienden con el scroll ---------- */
  var scrub = $("scrub"), scrubWords = [];
  if (scrub) {
    var txt = scrub.textContent.trim();
    scrub.setAttribute("aria-label", txt);
    scrub.innerHTML = txt.split(/\s+/).map(function (w) {
      return '<span class="w" aria-hidden="true">' + esc(w) + "</span>";
    }).join(" ");
    scrubWords = scrub.querySelectorAll(".w");
  }

  /* ---------- secuencia de carga ---------- */
  function markLoaded() {
    requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.add("loaded"); }); });
  }
  if (document.fonts && document.fonts.ready) {
    var done = false;
    var go = function () { if (!done) { done = true; markLoaded(); } };
    document.fonts.ready.then(go);
    setTimeout(go, 900);
  } else { markLoaded(); }

  /* ---------- todo lo que depende del scroll, en un solo cuadro ---------- */
  var head = $("head"), bar = $("progress");
  var darkSecs = document.querySelectorAll("[data-theme='dark']");
  var stepsBox = $("steps"), railFill = $("railFill"), steps = document.querySelectorAll(".step");
  var story = $("que-hace"), appStage = $("appStage"), app = $("app");
  var narrow = window.matchMedia("(max-width: 640px)");
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;

    if (head) {
      head.classList.toggle("stuck", y > 8);
      var onDark = false;
      for (var i = 0; i < darkSecs.length; i++) {
        var r = darkSecs[i].getBoundingClientRect();
        if (r.top <= 36 && r.bottom > 36) { onDark = true; break; }
      }
      head.classList.toggle("on-dark", onDark);
    }
    if (bar) {
      var h = document.documentElement.scrollHeight - vh;
      bar.style.transform = "scaleX(" + (h > 0 ? clamp(y / h, 0, 1) : 0) + ")";
    }

    if (scrubWords.length) {
      var sr = scrub.getBoundingClientRect();
      var sp = reduce ? 1 : clamp((vh * 0.82 - sr.top) / (vh * 0.55), 0, 1);
      var lit = Math.round(sp * scrubWords.length);
      for (var w = 0; w < scrubWords.length; w++) scrubWords[w].classList.toggle("lit", w < lit);
    }

    if (story) storyFromScroll(vh);

    if (stepsBox && railFill) {
      var rr = stepsBox.getBoundingClientRect();
      var pct = clamp((vh * 0.75 - rr.top) / (rr.height * 0.9 + 1), 0, 1);
      railFill.style.transform = narrow.matches ? "scaleY(" + pct + ")" : "scaleX(" + pct + ")";
      steps.forEach(function (s, i) { s.classList.toggle("on", pct >= i / steps.length + 0.05); });
    }

    if (appStage && app && !reduce) {
      var ar = appStage.getBoundingClientRect();
      var ap = clamp((vh - ar.top) / (vh * 0.7), 0, 1);
      ap = 1 - Math.pow(1 - ap, 3);
      app.style.setProperty("--p", ap.toFixed(3));
      if (ap > 0.75) goLive();
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", function () { requestAnimationFrame(onScroll); });

  /* ---------- menú móvil ---------- */
  var burger = $("burger"), drawer = $("drawer");
  function closeNav() {
    document.body.classList.remove("nav-open");
    if (burger) { burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Abrir menú"); }
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    drawer.addEventListener("click", function (e) { if (e.target.closest("a")) closeNav(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) { closeNav(); burger.focus(); }
    });
  }

  /* ---------- revelados al entrar en pantalla ---------- */
  var revs = document.querySelectorAll("[data-rev],[data-split]");
  function revealAll() { revs.forEach(function (el) { el.classList.add("seen"); }); }
  if (reduce || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("seen"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    revs.forEach(function (el) { io.observe(el); });
  }

  /* ---------- panel: cifras que cuentan ---------- */
  var live = false;
  function goLive() {
    if (live || !app) return;
    live = true;
    app.classList.add("live");
    app.querySelectorAll("[data-count]").forEach(function (el) {
      var to = parseInt(el.getAttribute("data-count"), 10), t0 = null, dur = 1400;
      if (reduce) { el.textContent = to; return; }
      el.textContent = "0";
      function step(t) {
        if (t0 === null) t0 = t;
        var k = clamp((t - t0) / dur, 0, 1);
        el.textContent = Math.round(to * (1 - Math.pow(2, -10 * k)));
        if (k < 1) requestAnimationFrame(step); else el.textContent = to;
      }
      requestAnimationFrame(step);
    });
  }
  if (reduce) goLive();

  /* ---------- luz que sigue al puntero (portada y panel) ---------- */
  function follower(area, el, strength) {
    if (!area || !el || reduce || !finePointer) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    function loop() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      el.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) requestAnimationFrame(loop); else running = false;
    }
    area.addEventListener("pointermove", function (e) {
      var r = area.getBoundingClientRect();
      tx = (e.clientX - r.left - r.width / 2) * strength;
      ty = (e.clientY - r.top - r.height / 2) * strength;
      if (!running) { running = true; requestAnimationFrame(loop); }
    });
    area.addEventListener("pointerleave", function () {
      tx = 0; ty = 0;
      if (!running) { running = true; requestAnimationFrame(loop); }
    });
  }
  follower($("hero"), $("heroGlow"), 0.18);
  follower($("panel"), $("spot"), 0.5);

  /* ---------- botones magnéticos ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll(".magnet").forEach(function (btn) {
      var label = btn.querySelector("span");
      var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
      function loop() {
        cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
        btn.style.translate = cx.toFixed(2) + "px " + cy.toFixed(2) + "px";
        if (label) label.style.translate = (cx * 0.45).toFixed(2) + "px " + (cy * 0.45).toFixed(2) + "px";
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) requestAnimationFrame(loop); else running = false;
      }
      function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        tx = clamp((e.clientX - r.left - r.width / 2) * 0.22, -10, 10);
        ty = clamp((e.clientY - r.top - r.height / 2) * 0.35, -7, 7);
        kick();
      });
      btn.addEventListener("pointerleave", function () { tx = 0; ty = 0; kick(); });
    });
  }

  /* ---------- historia anclada: el scroll avanza la conversación ---------- */
  var storyStream = $("storyStream");
  var storySteps = document.querySelectorAll("#storySteps li");
  var storyDots = document.querySelectorAll("#storyDots i");
  var storyScript = [
    { st: 0, s: "in",  t: "Buenas noches, ¿tienen cita para ortodoncia esta semana?", h: "21:47" },
    { st: 1, s: "out", t: "Buenas noches. Sí, el Dr. Ramírez atiende ortodoncia y tiene espacios el jueves y el viernes. Para reservarle, ¿me confirma su nombre completo y un número de contacto?", h: "21:47", b: "respondió en 4 s" },
    { st: 2, s: "in",  t: "Claudia Effio, 987 654 321", h: "21:48" },
    { st: 2, s: "out", t: "Gracias, Claudia. Tengo jueves 10 a las 4:30 p. m. o viernes 11 a las 11:00 a. m. ¿Cuál le acomoda?", h: "21:48", b: "respondió en 3 s" },
    { st: 3, s: "in",  t: "El jueves a las 4:30 está perfecto", h: "21:49" },
    { st: 3, s: "out", t: "Reservado. Por último, para registrarla en el sistema de la clínica, ¿me brinda su DNI?", h: "21:49", b: "respondió en 3 s" },
    { st: 3, s: "in",  t: "45872301", h: "21:50" },
    { st: 4, s: "receipt" }
  ];
  var shown = [], storyStep = -1, storyTimers = [];

  function bubble(m) {
    if (m.s === "receipt") {
      var r = document.createElement("div");
      r.className = "receipt";
      r.innerHTML = "<b>Lo que quedó hecho</b><ul>" +
        "<li>Cita creada: jue 10 set, 4:30 p. m. con el Dr. Ramírez</li>" +
        "<li>Prospecto registrado: Claudia Effio, DNI 45872301</li>" +
        "<li>Recepción notificada con el resumen</li></ul>";
      return r;
    }
    var d = document.createElement("div");
    d.className = "msg " + m.s;
    d.innerHTML = esc(m.t) + (m.b ? '<span class="badge">' + m.b + "</span>" : "") + (m.h ? "<time>" + m.h + "</time>" : "");
    return d;
  }

  function setStoryStep(k) {
    if (k === storyStep || !storyStream) return;
    var forwardOne = k === storyStep + 1 && storyStep >= 0;
    storyStep = k;

    storySteps.forEach(function (li, i) { li.classList.toggle("on", i === k); li.classList.toggle("gone", i < k); });
    storyDots.forEach(function (d, i) { d.classList.toggle("on", i === k); d.classList.toggle("done", i < k); });

    storyTimers.forEach(clearTimeout); storyTimers = [];
    storyStream.querySelectorAll(".typing").forEach(function (t) { t.remove(); });

    shown = shown.filter(function (item) {
      if (item.m.st > k) {
        item.el.classList.add("leaving");
        setTimeout(function () { item.el.remove(); }, 220);
        return false;
      }
      return true;
    });

    var missing = storyScript.filter(function (m) {
      return m.st <= k && !shown.some(function (it) { return it.m === m; });
    });
    if (!forwardOne || reduce) {
      missing.forEach(function (m) { var el = bubble(m); storyStream.appendChild(el); shown.push({ m: m, el: el }); });
      return;
    }
    var delay = 60;
    missing.forEach(function (m) {
      if (m.s === "out") {
        storyTimers.push(setTimeout(function () {
          var t = document.createElement("div");
          t.className = "typing"; t.innerHTML = "<i></i><i></i><i></i>";
          storyStream.appendChild(t);
        }, delay));
        delay += 650;
      }
      storyTimers.push(setTimeout(function () {
        storyStream.querySelectorAll(".typing").forEach(function (t) { t.remove(); });
        var el = bubble(m); storyStream.appendChild(el); shown.push({ m: m, el: el });
      }, delay));
      delay += 420;
    });
  }

  function storyFromScroll(vh) {
    var r = story.getBoundingClientRect();
    var total = story.offsetHeight - vh;
    var p = total > 0 ? clamp(-r.top / total, 0, 0.9999) : 1;
    setStoryStep(Math.floor(p * storySteps.length));
  }

  /* ---------- acordeón con avance automático ---------- */
  var acc = $("accordion");
  if (acc) {
    var items = Array.prototype.slice.call(acc.querySelectorAll(".acc"));
    var wide = window.matchMedia("(min-width: 981px)");
    var select = function (i) {
      items.forEach(function (b, j) {
        b.classList.toggle("on", j === i);
        b.setAttribute("aria-expanded", j === i ? "true" : "false");
      });
    };
    items.forEach(function (b, i) {
      b.addEventListener("click", function () { select(i); });
      var fill = b.querySelector(".acc-bar i");
      if (fill) fill.addEventListener("animationend", function () {
        if (b.classList.contains("on") && acc.classList.contains("auto")) select((i + 1) % items.length);
      });
    });
    acc.addEventListener("pointerenter", function () { acc.classList.add("paused"); });
    acc.addEventListener("pointerleave", function () { acc.classList.remove("paused"); });
    acc.addEventListener("focusin", function () { acc.classList.add("paused"); });
    acc.addEventListener("focusout", function () { acc.classList.remove("paused"); });
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { acc.classList.toggle("auto", en.isIntersecting && wide.matches); });
      }, { threshold: 0.45 }).observe(acc);
    }
  }

  /* ---------- preguntas frecuentes con apertura suave ---------- */
  var faq = $("faq");
  if (faq && !reduce && Element.prototype.animate) {
    faq.querySelectorAll("details").forEach(function (d) {
      var sum = d.querySelector("summary"), ans = d.querySelector(".ans"), anim = null;
      sum.addEventListener("click", function (e) {
        e.preventDefault();
        var from = ans.getBoundingClientRect().height;
        if (anim) anim.cancel();
        if (d.open && !d.classList.contains("closing")) {
          d.classList.add("closing");
          anim = ans.animate([{ height: from + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
            { duration: 380, easing: "cubic-bezier(.22,1,.36,1)" });
          anim.onfinish = function () { d.open = false; d.classList.remove("closing"); anim = null; };
        } else {
          d.classList.remove("closing");
          d.open = true;
          var to = ans.scrollHeight;
          anim = ans.animate([{ height: (d.classList.contains("closing") ? from : 0) + "px", opacity: 0 }, { height: to + "px", opacity: 1 }],
            { duration: 520, easing: "cubic-bezier(.22,1,.36,1)" });
          anim.onfinish = function () { anim = null; };
        }
      });
    });
  }

  onScroll();

  /* ---------- demo interactiva ---------- */
  var demoStream = $("demoStream"), chipsBox = $("chips");
  if (demoStream && chipsBox) {
    var qa = [
      { q: "¿Cuánto cuesta una limpieza dental?",
        a: "Con gusto le paso el detalle. La limpieza dental está dentro de nuestros tratamientos preventivos y el precio depende de si necesita destartraje. Si me deja su nombre y un número de contacto, le confirmo el monto exacto y, si desea, le separo una evaluación sin costo." },
      { q: "¿Atienden los sábados?",
        a: "Sí. Atendemos de lunes a viernes de 9:00 a. m. a 7:00 p. m. y los sábados de 9:00 a. m. a 1:00 p. m. ¿Le busco un espacio para este sábado?" },
      { q: "Tengo un dolor fuerte desde anoche",
        a: "Lamento que esté con dolor. No puedo darle indicaciones médicas por este medio, así que voy a avisar ahora mismo al equipo de la clínica para que la contacten y le den prioridad. ¿Me confirma su nombre y su número, por favor?" },
      { q: "¿Dónde quedan?",
        a: "Estamos en la dirección de la clínica, a media cuadra de la referencia principal. Contamos con estacionamiento para pacientes. ¿Le agendo una cita?" },
      { q: "¿Aceptan mi seguro?",
        a: "Trabajamos con las aseguradoras que la clínica tiene configuradas. Si me indica cuál es el suyo, le confirmo la cobertura y qué necesita traer el día de la cita." }
    ];
    var dBubble = function (side, text, badge) {
      return bubble({ s: side, t: text, b: badge });
    };
    var scrollDown = function () {
      demoStream.scrollTo({ top: demoStream.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    };
    var intro = function () {
      demoStream.innerHTML = "";
      demoStream.appendChild(dBubble("out", "Hola, soy el asistente de la clínica. ¿En qué puedo ayudarle?"));
    };
    intro();
    var busy = false;
    qa.forEach(function (item, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = item.q;
      b.addEventListener("click", function () {
        if (busy) return;
        busy = true; b.disabled = true;
        demoStream.appendChild(dBubble("in", item.q)); scrollDown();
        setTimeout(function () {
          var t = null;
          if (!reduce) {
            t = document.createElement("div");
            t.className = "typing"; t.innerHTML = "<i></i><i></i><i></i>";
            demoStream.appendChild(t); scrollDown();
          }
          setTimeout(function () {
            if (t) t.remove();
            demoStream.appendChild(dBubble("out", item.a, i === 2 ? "derivado al equipo" : null)); scrollDown();
            busy = false;
          }, reduce ? 0 : 1000);
        }, reduce ? 0 : 450);
      });
      chipsBox.appendChild(b);
    });
    var reset = document.createElement("button");
    reset.type = "button"; reset.className = "chip reset";
    reset.textContent = "Empezar de nuevo";
    reset.addEventListener("click", function () {
      if (busy) return;
      intro();
      chipsBox.querySelectorAll(".chip").forEach(function (c) { c.disabled = false; });
    });
    chipsBox.appendChild(reset);
  }

  /* ---------- selector de horarios ---------- */
  var bookedBox = $("booked"), allSlots = [];
  function buildSlots(list, host, dayLabel) {
    if (!host) return;
    list.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "slot"; b.textContent = s.h;
      if (!s.free) { b.disabled = true; b.setAttribute("aria-label", s.h + ", ocupado"); }
      else {
        b.addEventListener("click", function () {
          allSlots.forEach(function (x) { x.classList.remove("taken"); });
          b.classList.add("taken");
          if (bookedBox) {
            bookedBox.innerHTML = '<div class="receipt"><b>Cita confirmada</b><ul>' +
              "<li>" + dayLabel + " a las " + s.h + " con el Dr. Ramírez</li>" +
              "<li>Espacio bloqueado en el calendario del doctor</li>" +
              "<li>Paciente y recepción con la cita a la vista</li></ul></div>";
          }
        });
      }
      allSlots.push(b); host.appendChild(b);
    });
  }
  buildSlots([{ h: "09:00", free: false }, { h: "10:00", free: false }, { h: "11:30", free: true },
              { h: "15:00", free: false }, { h: "16:30", free: true }, { h: "18:00", free: true }],
             $("slotsA"), "Jueves 10 de septiembre");
  buildSlots([{ h: "09:00", free: true }, { h: "11:00", free: true }, { h: "12:00", free: false },
              { h: "16:00", free: false }, { h: "17:30", free: true }],
             $("slotsB"), "Viernes 11 de septiembre");
})();
