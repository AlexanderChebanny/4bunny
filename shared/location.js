// По названию локации (CONTENT.en.location, часть до запятой) находит координаты
// и часовой пояс через бесплатный геокодер Open-Meteo. Результат кэшируется у зрителя.
// Заполняет [data-tz] местным временем и смещением: «23:40 · GMT+7», время обновляется само.
// По нажатию показывает время посетителя и разницу: «У тебя 18:40 · У меня +5 часов».
// window.GEO — промис с { lat, lon, tz }.

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

  const clock = (tz) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());

  // Смещение часового пояса от UTC в минутах: «GMT+5:30» -> 330
  function offsetMinutes(tz) {
    const m = gmtOffset(tz).match(/GMT([+-])(\d+)(?::(\d+))?/);
    return m ? (m[1] === "-" ? -1 : 1) * (+m[2] * 60 + +(m[3] || 0)) : 0;
  }

  // Тап по времени показывает время посетителя и разницу с моим, через 6 секунд — обратно
  let showYours = false;
  let backTimer = null;

  function showTime(tz) {
    const dict = window.CONTENT[document.documentElement.lang] || window.CONTENT.ru;
    let text = `${clock(tz)} · ${gmtOffset(tz)}`;
    if (showYours) {
      const diff = (offsetMinutes(tz) + new Date().getTimezoneOffset()) / 60; // мой пояс минус пояс посетителя
      const lang = dict === window.CONTENT.ru ? "ru" : "en";
      const n = Math.round(Math.abs(diff) * 10) / 10;
      const unit = dict.tz_hours[new Intl.PluralRules(lang).select(n)] || dict.tz_hours.other; // 1 час, 4 часа, 11 часов
      const hours = `${diff > 0 ? "+" : "−"}${n.toLocaleString(lang)} ${unit}`;
      const relation = diff === 0 ? dict.tz_same : dict.tz_diff.replace("{h}", hours);
      text = `${dict.tz_yours.replace("{time}", clock(undefined))} · ${relation}`;
    }
    document.querySelectorAll("[data-tz]").forEach((el) => {
      el.textContent = text;
      el.classList.toggle("is-yours", showYours);
    });
  }

  window.GEO = lookup().then((geo) => {
    showTime(geo.tz);
    setInterval(() => showTime(geo.tz), 20000);
    document.querySelectorAll("[data-tz]").forEach((el) =>
      el.addEventListener("click", () => {
        showYours = !showYours;
        showTime(geo.tz);
        clearTimeout(backTimer);
        if (showYours) backTimer = setTimeout(() => ((showYours = false), showTime(geo.tz)), 6000);
      })
    );
    // Сменили язык — перерисовать строку сразу, а не через 20 секунд
    new MutationObserver(() => showTime(geo.tz)).observe(document.documentElement, { attributeFilter: ["lang"] });
    return geo;
  });
  window.GEO.catch((err) => console.warn(err));
})();
