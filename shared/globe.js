// Глобус с контурами стран (d3-geo, SVG). Два режима:
//   here    — центр на текущей локации (window.GEO), её страна подсвечена;
//   flights — перелёты из window.FLIGHTS: дуги, аэропорты, страны, где был.
// Один палец или мышь крутят, щипок двумя пальцами (или Ctrl + колесо / щипок
// на трекпаде) приближает. Без касаний глобус плавно возвращается к центру режима:
// через 4 секунды у точки, через 5 — в перелётах.
//
// Способ переключения режима задаётся атрибутом data-trigger у [data-globe-wrap]:
//   caption — подписи-кнопки [data-globe-mode] рядом с глобусом;
//   tap     — короткое касание глобуса без движения;
//   fling   — резко раскрутить: глобус по инерции делает оборот и меняет режим;
//   pinch   — отдалить щипком меньше обычного размера.
//
// Независимо от жеста режим переключает кнопка [data-globe-toggle] рядом с глобусом
// (aria-pressed отражает, включены ли перелёты). В режиме перелётов текущая страна
// окрашивается как остальные посещённые — CSS по классу .is-flights.
//
// Библиотеки и карта лежат в assets/vendor/ и подключены обычными скриптами до этого:
// window.d3 (d3-array + d3-geo), window.topojson, window.WORLD — без CDN и без модулей,
// поэтому работает и при открытии файла двойным кликом (file://).

(function () {
  const { d3, topojson, WORLD } = window;

  const BASE_SCALE = 176;
  const MAX_ZOOM = 3; // дальше карта 110m становится заметно угловатой
  const PINCH_OUT_MIN = 0.6; // насколько можно отдалить в варианте pinch
  const PINCH_OUT_SWITCH = 0.8; // отпустил меньше этого — режим переключается
  // мс без касаний до возврата к центру режима: у точки — быстрее, в перелётах есть что разглядывать
  const RETURN_DELAY = { here: 4000, flights: 5000 };
  const TAP_MAX_MOVE = 6; // px — больше уже не тап, а вращение
  const TAP_MAX_TIME = 350; // мс
  const FLING_SPEED = 1.1; // px/мс в момент отпускания — это «швырок»

  const countries = topojson.feature(WORLD, WORLD.objects.countries).features;
  const graticule = d3.geoGraticule10();
  const collection = (features) => ({ type: "FeatureCollection", features });

  let uid = 0;

  function svgMarkup(id) {
    return `<svg viewBox="0 0 400 400" aria-hidden="true">
      <defs>
        <radialGradient id="globe-sphere-${id}" cx="40%" cy="35%">
          <stop offset="0%" stop-color="#141a33"/><stop offset="100%" stop-color="#05060c"/>
        </radialGradient>
        <filter id="globe-glow-${id}"><feGaussianBlur stdDeviation="6"/></filter>
        <clipPath id="globe-clip-${id}"><circle cx="200" cy="200" r="176"/></clipPath>
      </defs>
      <circle cx="200" cy="200" r="178" fill="none" stroke="#3b5bff" stroke-width="6" opacity=".7" filter="url(#globe-glow-${id})"/>
      <circle cx="200" cy="200" r="176" fill="url(#globe-sphere-${id})"/>
      <g clip-path="url(#globe-clip-${id})">
        <path data-graticule fill="none" stroke="rgba(255,255,255,.06)" stroke-width=".5"/>
        <path data-land fill="rgba(255,255,255,.035)" stroke="rgba(255,255,255,.28)" stroke-width=".45"/>
        <g class="flight-layer"><path data-visited fill="rgba(169,155,255,.3)" stroke="rgba(201,191,255,.85)" stroke-width=".8"/></g>
        <path data-home fill="rgba(24,212,255,.35)" stroke="#18d4ff" stroke-width="1.2"/>
        <g class="flight-layer">
          <path data-flights class="flight" fill="none" stroke="#c9bfff" stroke-width="1.3"/>
          <path data-airports fill="rgba(255,255,255,.8)"/>
        </g>
        <g data-dot><circle class="ring" r="3.4"/><circle class="core" r="3.4"/></g>
      </g>
    </svg>`;
  }

  function createGlobe(wrap, { trigger, geo, flights }) {
    const id = ++uid;
    wrap.insertAdjacentHTML("afterbegin", svgMarkup(id));
    const box = wrap.closest("[data-globe-box]") || wrap; // сюда вешаем класс режима, подписи реагируют
    const svg = wrap.querySelector("svg");
    const el = (name) => svg.querySelector(`[data-${name}]`);
    const layers = {
      graticule: el("graticule"),
      land: el("land"),
      visited: el("visited"),
      home: el("home"),
      flights: el("flights"),
      airports: el("airports"),
    };
    const dotEl = el("dot");

    // Страну находим по координатам: в какой контур попала точка. На упрощённой карте
    // мелкие острова и самые края побережья могут не попасть — тогда просто без подсветки.
    const here = [geo.lon, geo.lat];
    const homeCountry = countries.find((f) => d3.geoContains(f, here));
    const others = countries.filter((f) => f !== homeCountry);
    const visitedIds = new Set(flights?.countries ?? []);
    const shapes = {
      graticule,
      land: collection(others),
      visited: collection(others.filter((f) => visitedIds.has(f.id))),
      home: homeCountry ?? collection([]),
      flights: {
        type: "MultiLineString",
        coordinates: (flights?.routes ?? []).map(([a, b]) => [flights.airports[a], flights.airports[b]]),
      },
      airports: { type: "MultiPoint", coordinates: Object.values(flights?.airports ?? {}) },
    };

    // Куда смотрит глобус в каждом режиме: на точку или на «центр тяжести» аэропортов
    const flightsCenter = flights ? d3.geoCentroid(shapes.airports) : here;
    const views = { here: [-here[0], -here[1]], flights: [-flightsCenter[0], -flightsCenter[1]] };
    let mode = "here";

    const projection = d3.geoOrthographic().scale(BASE_SCALE).translate([200, 200]).rotate(views.here);
    const path = d3.geoPath(projection).pointRadius(2.2);

    function render() {
      for (const [name, node] of Object.entries(layers)) node.setAttribute("d", path(shapes[name]) || "");
      const [x, y] = projection(here);
      const facing = d3.geoDistance(here, projection.invert([200, 200])) < Math.PI / 2;
      dotEl.setAttribute("transform", `translate(${x},${y})`);
      dotEl.style.opacity = facing ? 1 : 0;
    }

    // ---------- анимации ----------
    let animation = null;
    let homeTimer = null;

    // Плавный поворот к rotate и масштабу scale. spin — лишние градусы по долготе
    // для «швырка»: глобус докручивается в сторону жеста и делает полный оборот.
    function animateTo(rotate, scale, { duration = 1100, spin = 0 } = {}) {
      cancelAnimationFrame(animation);
      const fromRotate = projection.rotate();
      const fromScale = projection.scale();
      let dLambda = ((((rotate[0] - fromRotate[0]) % 360) + 540) % 360) - 180; // кратчайший путь
      if (spin) {
        if (Math.sign(dLambda) !== Math.sign(spin)) dLambda += Math.sign(spin) * 360;
        dLambda += spin;
      }
      const dPhi = rotate[1] - fromRotate[1];
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const k = 1 - Math.pow(1 - t, 3); // ease-out
        projection.rotate([fromRotate[0] + dLambda * k, fromRotate[1] + dPhi * k]);
        projection.scale(fromScale + (scale - fromScale) * k);
        render();
        if (t < 1) animation = requestAnimationFrame(step);
      };
      animation = requestAnimationFrame(step);
    }

    const goHome = () => animateTo(views[mode], BASE_SCALE);
    function goHomeLater() {
      clearTimeout(homeTimer);
      homeTimer = setTimeout(goHome, RETURN_DELAY[mode]);
    }

    function setMode(next, { spin = 0 } = {}) {
      if (!flights) return;
      clearTimeout(homeTimer);
      mode = next;
      box.classList.toggle("is-flights", mode === "flights");
      box.querySelectorAll("[data-globe-mode]").forEach((btn) =>
        btn.setAttribute("aria-pressed", String(btn.dataset.globeMode === mode))
      );
      box.querySelectorAll("[data-globe-toggle]").forEach((btn) => btn.setAttribute("aria-pressed", String(mode === "flights")));
      animateTo(views[mode], BASE_SCALE, { duration: spin ? 1800 : 1100, spin });
    }
    const toggleMode = (options) => setMode(mode === "here" ? "flights" : "here", options);

    // ---------- жесты ----------
    // Вращение: 0.35° на пиксель при обычном масштабе, при зуме медленнее, чтобы
    // приближенная карта не улетала из-под пальца. Наклон ограничен.
    function rotateBy(dx, dy) {
      const k = (0.35 * BASE_SCALE) / projection.scale();
      const [lambda, phi] = projection.rotate();
      projection.rotate([lambda + dx * k, Math.max(-80, Math.min(80, phi - dy * k))]);
    }

    const minScale = trigger === "pinch" ? BASE_SCALE * PINCH_OUT_MIN : BASE_SCALE;
    const zoomTo = (scale) => projection.scale(Math.max(minScale, Math.min(BASE_SCALE * MAX_ZOOM, scale)));

    // Каждый палец — отдельный pointer. Один — вращение, два — щипок
    // (расстояние между пальцами = зум, сдвиг их середины = вращение).
    const pointers = new Map();
    let pinch = null;
    let gesture = null; // текущее касание: для тапа и для скорости «швырка»

    const pair = () => [...pointers.values()];
    const spread = () => {
      const [a, b] = pair();
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const middle = () => {
      const [a, b] = pair();
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };

    svg.addEventListener("pointerdown", (e) => {
      cancelAnimationFrame(animation);
      clearTimeout(homeTimer);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try {
        svg.setPointerCapture(e.pointerId); // палец может уйти за край глобуса — жест всё равно наш
      } catch {}
      const now = performance.now();
      if (pointers.size === 1) {
        gesture = { x: e.clientX, y: e.clientY, t: now, lastT: now, vx: 0, moved: false, pinched: false };
      }
      if (pointers.size === 2) {
        pinch = { spread: spread(), scale: projection.scale(), middle: middle() };
        gesture.pinched = true;
      }
      wrap.classList.add("is-dragging");
    });

    svg.addEventListener("pointermove", (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) {
        zoomTo((pinch.scale * spread()) / pinch.spread);
        const mid = middle();
        rotateBy(mid.x - pinch.middle.x, mid.y - pinch.middle.y);
        pinch.middle = mid;
      } else if (pointers.size === 1) {
        const dx = e.clientX - prev.x;
        rotateBy(dx, e.clientY - prev.y);
        const now = performance.now();
        // Скорость сглаживаем, чтобы один дёрганый кадр не решал за весь жест
        gesture.vx = 0.7 * (dx / Math.max(1, now - gesture.lastT)) + 0.3 * gesture.vx;
        gesture.lastT = now;
        if (Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > TAP_MAX_MOVE) gesture.moved = true;
      }
      render();
    });

    const release = (e) => {
      if (!pointers.delete(e.pointerId)) return;
      pinch = null; // после щипка оставшийся палец продолжает просто вращать
      if (pointers.size) return;
      wrap.classList.remove("is-dragging");
      const now = performance.now();
      const g = gesture;

      if (trigger === "tap" && !g.moved && !g.pinched && now - g.t < TAP_MAX_TIME) return toggleMode();
      if (trigger === "fling" && !g.pinched && Math.abs(g.vx) > FLING_SPEED && now - g.lastT < 80) {
        return toggleMode({ spin: Math.sign(g.vx) * 360 });
      }
      if (trigger === "pinch" && projection.scale() < BASE_SCALE * PINCH_OUT_SWITCH) return toggleMode();
      goHomeLater();
    };
    svg.addEventListener("pointerup", release);
    svg.addEventListener("pointercancel", release);

    // Трекпад присылает щипок как wheel с ctrlKey. Обычное колесо не трогаем — им листают страницу
    let wheelIdle = null;
    svg.addEventListener(
      "wheel",
      (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        cancelAnimationFrame(animation);
        clearTimeout(homeTimer);
        zoomTo(projection.scale() * Math.exp(-e.deltaY / 100));
        render();
        clearTimeout(wheelIdle);
        wheelIdle = setTimeout(() => {
          if (trigger === "pinch" && projection.scale() < BASE_SCALE * PINCH_OUT_SWITCH) toggleMode();
          else goHomeLater();
        }, 300);
      },
      { passive: false }
    );

    // Кнопки работают в любом варианте жеста, если они есть рядом с глобусом
    box.querySelectorAll("[data-globe-mode]").forEach((btn) =>
      btn.addEventListener("click", () => setMode(btn.dataset.globeMode))
    );
    box.querySelectorAll("[data-globe-toggle]").forEach((btn) => btn.addEventListener("click", () => toggleMode()));

    render();
    wrap.classList.add("is-ready");
    return { setMode };
  }

  window.GEO.then((geo) => {
    document.querySelectorAll("[data-globe-wrap]").forEach((wrap) =>
      createGlobe(wrap, { trigger: wrap.dataset.trigger || "caption", geo, flights: window.FLIGHTS || null })
    );
  }).catch((err) => console.warn("Глобус не загрузился:", err));
})();
