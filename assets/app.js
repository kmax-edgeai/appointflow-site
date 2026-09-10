/* AppointFlow — sitio público. Sin dependencias externas. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- cabecera pegada + barra de progreso ---------- */
  var head = $("head"), bar = $("progress");
  var stepsBox = $("steps"), railFill = $("railFill");
  var steps = document.querySelectorAll(".step");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (head) head.classList.toggle("stuck", y > 12);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + "%";
    }
    if (stepsBox && railFill) {
      var r = stepsBox.getBoundingClientRect();
      var pct = (window.innerHeight * 0.78 - r.top) / (r.height * 0.85);
      pct = Math.max(0, Math.min(1, pct));
      railFill.style.height = pct * 100 + "%";
      steps.forEach(function (s, i) {
        s.classList.toggle("on", pct > (i + 0.25) / steps.length);
      });
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- menú móvil ---------- */
  var burger = $("burger"), drawer = $("drawer");
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    drawer.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        document.body.classList.remove("nav-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
        document.body.classList.remove("nav-open");
        burger.setAttribute("aria-expanded", "false");
        burger.focus();
      }
    });
  }

  /* ---------- revelado al entrar en pantalla ---------- */
  var revs = document.querySelectorAll("[data-rev]");
  function revealAll() { revs.forEach(function (el) { el.classList.add("seen"); }); }
  if (reduce || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("seen"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revs.forEach(function (el) { io.observe(el); });
    setTimeout(revealAll, 3500);
  }

  /* ---------- foco luminoso de la sección oscura ---------- */
  var dark = document.querySelector(".dark"), spot = $("spot");
  if (dark && spot && !reduce) {
    dark.addEventListener("mousemove", function (e) {
      var r = dark.getBoundingClientRect();
      spot.style.left = e.clientX - r.left + "px";
      spot.style.top = e.clientY - r.top + "px";
    });
  }

  /* ================= a partir de aquí, solo la portada ================= */
  var stream = $("stream");
  if (!stream) return;

  var script = [
    { s: "in",  t: "Buenas noches, ¿tienen cita para ortodoncia esta semana?", h: "21:47" },
    { s: "out", t: "Buenas noches. Sí, el Dr. Ramírez atiende ortodoncia y tiene espacios el jueves y el viernes. Para reservarle, ¿me confirma su nombre completo y un número de contacto?", h: "21:47", b: "respondió en 4 s" },
    { s: "in",  t: "Claudia Effio, 987 654 321", h: "21:48" },
    { s: "out", t: "Gracias, Claudia. Tengo jueves 10 a las 4:30 p. m. o viernes 11 a las 11:00 a. m. ¿Cuál le acomoda?", h: "21:48", b: "respondió en 3 s" },
    { s: "in",  t: "El jueves a las 4:30 está perfecto", h: "21:49" },
    { s: "out", t: "Reservado. Por último, para registrarla en el sistema de la clínica, ¿me brinda su DNI?", h: "21:49", b: "respondió en 3 s" },
    { s: "in",  t: "45872301", h: "21:50" },
    { s: "receipt" }
  ];
  var timers = [];

  function bubble(m) {
    if (m.s === "receipt") {
      var r = document.createElement("div");
      r.className = "receipt";
      r.innerHTML = "<b>Lo que quedó hecho</b><ul>" +
        "<li>Cita creada — jue 10 set, 4:30 p. m. · Dr. Ramírez</li>" +
        "<li>Prospecto registrado — Claudia Effio · DNI 45872301</li>" +
        "<li>Recepción notificada con el resumen</li></ul>";
      return r;
    }
    var d = document.createElement("div");
    d.className = "msg " + m.s;
    d.innerHTML = esc(m.t) + (m.b ? '<span class="badge">' + m.b + "</span>" : "") +
      "<time>" + m.h + "</time>";
    return d;
  }

  function play() {
    timers.forEach(clearTimeout); timers = [];
    stream.innerHTML = "";
    var delay = 260;
    script.forEach(function (m, i) {
      if (m.s === "out") {
        timers.push(setTimeout(function () {
          var t = document.createElement("div");
          t.className = "typing"; t.id = "typing" + i;
          t.innerHTML = "<i></i><i></i><i></i>";
          stream.appendChild(t); stream.scrollTop = stream.scrollHeight;
        }, delay));
        delay += 900;
        timers.push(setTimeout(function () {
          var t = $("typing" + i); if (t) t.remove();
          stream.appendChild(bubble(m)); stream.scrollTop = stream.scrollHeight;
        }, delay));
      } else {
        timers.push(setTimeout(function () {
          stream.appendChild(bubble(m)); stream.scrollTop = stream.scrollHeight;
        }, delay));
      }
      delay += m.s === "receipt" ? 600 : 1100;
    });
  }

  stream.appendChild(bubble(script[0]));
  if (reduce) {
    stream.innerHTML = "";
    script.forEach(function (m) { stream.appendChild(bubble(m)); });
  } else {
    setTimeout(play, 700);
  }
  var replay = $("replay");
  if (replay) replay.addEventListener("click", play);

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
      var d = document.createElement("div");
      d.className = "msg " + side;
      d.innerHTML = esc(text) + (badge ? '<span class="badge">' + badge + "</span>" : "");
      return d;
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
        demoStream.appendChild(dBubble("in", item.q));
        demoStream.scrollTop = demoStream.scrollHeight;
        setTimeout(function () {
          if (!reduce) {
            var t = document.createElement("div");
            t.className = "typing"; t.id = "dtyping";
            t.innerHTML = "<i></i><i></i><i></i>";
            demoStream.appendChild(t); demoStream.scrollTop = demoStream.scrollHeight;
          }
          setTimeout(function () {
            var t = $("dtyping"); if (t) t.remove();
            demoStream.appendChild(dBubble("out", item.a, i === 2 ? "derivado al equipo" : null));
            demoStream.scrollTop = demoStream.scrollHeight;
            busy = false;
          }, reduce ? 0 : 1000);
        }, reduce ? 0 : 850);
      });
      chipsBox.appendChild(b);
    });
    var reset = document.createElement("button");
    reset.type = "button"; reset.className = "chip";
    reset.style.fontFamily = "var(--mono)"; reset.style.fontSize = ".76rem";
    reset.textContent = "↻ empezar de nuevo";
    reset.addEventListener("click", function () {
      intro();
      chipsBox.querySelectorAll(".chip").forEach(function (c) { if (c !== reset) c.disabled = false; });
    });
    chipsBox.appendChild(reset);
  }

  /* ---------- selector de horarios ---------- */
  var bookedBox = $("booked"), all = [];
  function buildSlots(list, host, dayLabel) {
    if (!host) return;
    list.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "slot"; b.textContent = s.h;
      if (!s.free) { b.disabled = true; b.title = "Ocupado"; }
      else {
        b.addEventListener("click", function () {
          all.forEach(function (x) { x.classList.remove("taken"); });
          b.classList.add("taken");
          if (bookedBox) {
            bookedBox.innerHTML = '<div class="receipt"><b>Cita confirmada</b><ul>' +
              "<li>" + dayLabel + " a las " + s.h + " · Dr. Ramírez</li>" +
              "<li>Espacio bloqueado en el calendario del doctor</li>" +
              "<li>Recordatorio programado para el día anterior</li></ul></div>";
          }
        });
      }
      all.push(b); host.appendChild(b);
    });
  }
  buildSlots([{h:"09:00",free:false},{h:"10:00",free:false},{h:"11:30",free:true},
              {h:"15:00",free:false},{h:"16:30",free:true},{h:"18:00",free:true}],
             $("slotsA"), "Jueves 10 de septiembre");
  buildSlots([{h:"09:00",free:true},{h:"11:00",free:true},{h:"12:00",free:false},
              {h:"16:00",free:false},{h:"17:30",free:true}],
             $("slotsB"), "Viernes 11 de septiembre");
})();
