// Глобус (cobe, WebGL) с точкой текущей локации в центре. Координаты — из window.GEO.
// Обычный скрипт с динамическим import(): так он работает и при открытии файла
// двойным кликом (file://), где браузер блокирует локальные type="module".

(async function () {
  const wrap = document.querySelector("[data-globe-wrap]");
  if (!wrap) return;

  const [{ default: createGlobe }, { lat, lon }] = await Promise.all([
    import("https://cdn.jsdelivr.net/npm/cobe@0.6.5/+esm"),
    window.GEO,
  ]);
  const canvas = wrap.querySelector("canvas");

  // Повороты, при которых точка (lat, lon) смотрит прямо на зрителя
  const phi = Math.PI - ((lon * Math.PI) / 180 - Math.PI / 2);
  const theta = (lat * Math.PI) / 180;

  let size = canvas.offsetWidth;
  addEventListener("resize", () => (size = canvas.offsetWidth));

  // Перетаскивание: копим смещение от исходного поворота, после отпускания
  // оно плавно затухает и точка возвращается в центр
  let last = null;
  let offPhi = 0;
  let offTheta = 0;

  canvas.addEventListener("pointerdown", (e) => {
    last = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    wrap.classList.add("is-dragging");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!last) return;
    offPhi += (e.clientX - last.x) / 150;
    offTheta = Math.max(-0.8, Math.min(0.8, offTheta + (e.clientY - last.y) / 300));
    last = { x: e.clientX, y: e.clientY };
  });
  const release = () => {
    last = null;
    wrap.classList.remove("is-dragging");
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  createGlobe(canvas, {
    devicePixelRatio: 2,
    width: size * 2,
    height: size * 2,
    phi,
    theta,
    dark: 1,
    diffuse: 1.2,
    mapSamples: 16000,
    mapBrightness: 5,
    baseColor: [0.32, 0.32, 0.42],
    markerColor: [0.1, 0.83, 1],
    glowColor: [0.22, 0.28, 0.75],
    markers: [{ location: [lat, lon], size: 0.05 }],
    onRender(state) {
      if (!last) {
        offPhi *= 0.93;
        offTheta *= 0.93;
      }
      state.phi = phi + offPhi;
      state.theta = theta + offTheta;
      wrap.classList.toggle("is-off", Math.abs(offPhi) + Math.abs(offTheta) > 0.03);
      state.width = size * 2;
      state.height = size * 2;
    },
  });

  wrap.classList.add("is-ready");
})().catch((err) => console.warn("Глобус не загрузился:", err));
