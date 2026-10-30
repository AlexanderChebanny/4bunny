// Глобус с контурами стран (d3-geo, SVG). Центр — текущая локация из window.GEO,
// страна, в которую попадает точка, подсвечивается. Один палец или мышь крутят,
// щипок двумя пальцами (или Ctrl + колесо / щипок на трекпаде) приближает.
// Через 5 секунд без касаний глобус плавно возвращается домой — успеваешь приблизить и покрутить.
// Библиотеки и карта лежат в assets/vendor/ и подключены обычными скриптами до этого:
// window.d3 (d3-array + d3-geo), window.topojson, window.WORLD — без CDN и без модулей,
// поэтому работает и при открытии файла двойным кликом (file://).

(async function () {
  const wrap = document.querySelector("[data-globe-wrap]");
  if (!wrap) return;

  const { d3, topojson, WORLD: world } = window;
  const { lat, lon } = await window.GEO;

  const svg = wrap.querySelector("svg");
  const el = (name) => svg.querySelector(`[data-${name}]`);
  const graticuleEl = el("graticule");
  const landEl = el("land");
  const homeEl = el("home");
  const dotEl = el("dot");

  const BASE_SCALE = 176;
  const MAX_ZOOM = 3; // дальше карта 110m становится заметно угловатой

  const here = [lon, lat];
  const home = [-lon, -lat]; // поворот, при котором точка смотрит прямо на зрителя
  const projection = d3.geoOrthographic().scale(BASE_SCALE).translate([200, 200]).rotate(home);
  const path = d3.geoPath(projection);

  // Страну находим по координатам: в какой контур попала точка. На упрощённой карте
  // мелкие острова и самые края побережья могут не попасть — тогда просто без подсветки.
  const countries = topojson.feature(world, world.objects.countries).features;
  const homeCountry = countries.find((f) => d3.geoContains(f, here));
  const land = { type: "FeatureCollection", features: countries.filter((f) => f !== homeCountry) };
  const graticule = d3.geoGraticule10();

  function render() {
    graticuleEl.setAttribute("d", path(graticule));
    landEl.setAttribute("d", path(land));
    homeEl.setAttribute("d", homeCountry ? path(homeCountry) || "" : "");
    const [x, y] = projection(here);
    const facing = d3.geoDistance(here, projection.invert([200, 200])) < Math.PI / 2;
    dotEl.setAttribute("transform", `translate(${x},${y})`);
    dotEl.style.opacity = facing ? 1 : 0;
  }

  // Вращение: 0.35° на пиксель при обычном масштабе, при зуме медленнее, чтобы
  // приближенная карта не улетала из-под пальца. Наклон ограничен, глобус не переворачивается.
  function rotateBy(dx, dy) {
    const k = (0.35 * BASE_SCALE) / projection.scale();
    const [lambda, phi] = projection.rotate();
    projection.rotate([lambda + dx * k, Math.max(-80, Math.min(80, phi - dy * k))]);
  }

  function zoomTo(scale) {
    projection.scale(Math.max(BASE_SCALE, Math.min(BASE_SCALE * MAX_ZOOM, scale)));
  }

  const RETURN_DELAY = 5000; // мс без касаний до возврата домой
  let returning = null;
  let homeTimer = null;

  function goHomeLater() {
    clearTimeout(homeTimer);
    homeTimer = setTimeout(goHome, RETURN_DELAY);
  }

  function goHome() {
    const fromRotate = projection.rotate();
    const fromScale = projection.scale();
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 1100);
      const k = 1 - Math.pow(1 - t, 3); // ease-out
      projection.rotate([
        fromRotate[0] + (home[0] - fromRotate[0]) * k,
        fromRotate[1] + (home[1] - fromRotate[1]) * k,
      ]);
      projection.scale(fromScale + (BASE_SCALE - fromScale) * k);
      render();
      if (t < 1) returning = requestAnimationFrame(step);
    };
    returning = requestAnimationFrame(step);
  }

  // Жесты: каждый палец — отдельный pointer. Один — вращение, два — щипок
  // (расстояние между пальцами = зум, сдвиг их середины = вращение).
  const pointers = new Map();
  let pinch = null;

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
    cancelAnimationFrame(returning);
    clearTimeout(homeTimer);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      svg.setPointerCapture(e.pointerId); // палец может уйти за край глобуса — жест всё равно наш
    } catch {}
    if (pointers.size === 2) pinch = { spread: spread(), scale: projection.scale(), middle: middle() };
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
      rotateBy(e.clientX - prev.x, e.clientY - prev.y);
    }
    render();
  });

  const release = (e) => {
    if (!pointers.delete(e.pointerId)) return;
    pinch = null; // после щипка оставшийся палец продолжает просто вращать
    if (pointers.size) return;
    wrap.classList.remove("is-dragging");
    goHomeLater();
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);

  // Трекпад присылает щипок как wheel с ctrlKey. Обычное колесо не трогаем — им листают страницу
  svg.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      cancelAnimationFrame(returning);
      zoomTo(projection.scale() * Math.exp(-e.deltaY / 100));
      render();
      goHomeLater();
    },
    { passive: false }
  );

  render();
  wrap.classList.add("is-ready");
})().catch((err) => console.warn("Глобус не загрузился:", err));
