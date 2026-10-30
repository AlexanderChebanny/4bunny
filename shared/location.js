// По названию локации (CONTENT.en.location, часть до запятой) находит координаты
// и часовой пояс через бесплатный геокодер Open-Meteo. Результат кэшируется у зрителя.
// Заполняет [data-tz] смещением вида «GMT+7»; window.GEO — промис с { lat, lon, tz }.

(function () {
  const query = window.CONTENT.en.location.split(",")[0].trim();
  const CACHE = "geo:" + query;

  function gmtOffset(tz) {
    const part = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    return part ? part.value : "";
  }

  async function lookup() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE));
      if (cached) return cached;
    } catch {}
    const url = "https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(query);
    const hit = (await (await fetch(url)).json()).results?.[0];
    if (!hit) throw new Error("Локация не найдена: " + query);
    const geo = { lat: hit.latitude, lon: hit.longitude, tz: hit.timezone };
    try {
      localStorage.setItem(CACHE, JSON.stringify(geo));
    } catch {}
    return geo;
  }

  window.GEO = lookup().then((geo) => {
    const gmt = gmtOffset(geo.tz);
    document.querySelectorAll("[data-tz]").forEach((el) => (el.textContent = gmt));
    return geo;
  });
  window.GEO.catch((err) => console.warn(err));
})();
