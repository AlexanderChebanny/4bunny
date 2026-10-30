// Подставляет тексты, ссылки и иконки, переключает RU/EN.
// Разметка: data-t="ключ", data-link="ключ из LINKS", data-icon="ключ из ICONS",
// data-lang-toggle — кнопка переключения языка.

(function () {
  const KEY = "lang";

  function load() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }

  function save(lang) {
    try {
      localStorage.setItem(KEY, lang);
    } catch {}
  }

  function apply(lang) {
    const dict = window.CONTENT[lang];
    document.documentElement.lang = lang;
    document.title = dict.name;
    document.querySelectorAll("[data-t]").forEach((el) => {
      el.textContent = dict[el.dataset.t] ?? el.dataset.t;
    });
    document.querySelectorAll("[data-lang-toggle]").forEach((el) => {
      el.textContent = lang === "ru" ? "EN" : "RU";
      el.setAttribute("aria-label", lang === "ru" ? "Switch to English" : "Переключить на русский");
    });
  }

  function init() {
    document.querySelectorAll("[data-link]").forEach((el) => {
      const href = window.LINKS[el.dataset.link];
      el.href = href;
      if (href.startsWith("http")) {
        el.target = "_blank";
        el.rel = "noopener";
      }
    });
    document.querySelectorAll("[data-icon]").forEach((el) => {
      el.innerHTML = window.ICONS[el.dataset.icon];
    });

    let lang = load() === "en" ? "en" : "ru";
    apply(lang);

    document.querySelectorAll("[data-lang-toggle]").forEach((btn) =>
      btn.addEventListener("click", () => {
        lang = lang === "ru" ? "en" : "ru";
        save(lang);
        document.body.classList.add("is-switching");
        setTimeout(() => {
          apply(lang);
          document.body.classList.remove("is-switching");
        }, 180);
      })
    );
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
