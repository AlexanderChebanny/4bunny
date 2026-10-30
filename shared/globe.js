// Глобус с контурами стран (d3-geo, SVG). Центр — текущая локация из window.GEO,
// страна, в которую попадает точка, подсвечивается. Крутится перетаскиванием и
// плавно возвращается домой.
// Обычный скрипт с динамическим import(): так он работает и при открытии файла
// двойным кликом (file://), где браузер блокирует локальные type="module".

(async function () {
  const wrap = document.querySelector("[data-globe-wrap]");
  if (!wrap) return;

  const [d3, topojson, world, { lat, lon }] = await Promise.all([
    import("https://cdn.jsdelivr.net/npm/d3-geo@3.1.1/+esm"),
    import("https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm"),
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json").then((r) => r.json()),
    window.GEO,
  ]);

  const svg = wrap.querySelector("svg");
  const el = (name) => svg.querySelector(`[data-${name}]`);
  const graticuleEl = el("graticule");
  const landEl = el("land");
  const homeEl = el("home");
  const dotEl = el("dot");

  const here = [lon, lat];
  const home = [-lon, -lat]; // поворот, при котором точка смотрит прямо на зрителя
  const projection = d3.geoOrthographic().scale(176).translate([200, 200]).rotate(home);
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

  // Перетаскивание: 0.35° поворота на пиксель, наклон ограничен, чтобы не перевернуть глобус
  let last = null;
  let returning = null;

  svg.addEventListener("pointerdown", (e) => {
    cancelAnimationFrame(returning);
    last = { x: e.clientX, y: e.clientY };
    svg.setPointerCapture(e.pointerId);
    wrap.classList.add("is-dragging");
  });
  svg.addEventListener("pointermove", (e) => {
    if (!last) return;
    const [lambda, phi] = projection.rotate();
    projection.rotate([
      lambda + (e.clientX - last.x) * 0.35,
      Math.max(-80, Math.min(80, phi - (e.clientY - last.y) * 0.35)),
    ]);
    last = { x: e.clientX, y: e.clientY };
    render();
  });
  const release = () => {
    if (!last) return;
    last = null;
    wrap.classList.remove("is-dragging");
    const from = projection.rotate();
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 1100);
      const k = 1 - Math.pow(1 - t, 3); // ease-out
      projection.rotate([from[0] + (home[0] - from[0]) * k, from[1] + (home[1] - from[1]) * k]);
      render();
      if (t < 1) returning = requestAnimationFrame(step);
    };
    returning = requestAnimationFrame(step);
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);

  render();
  wrap.classList.add("is-ready");
})().catch((err) => console.warn("Глобус не загрузился:", err));
