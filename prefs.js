(() => {
  "use strict";

  const ROWS = [
    ["Heavy machinery rental", "Raskaan kaluston vuokraus", "Аренда тяжёлой техники"],
    ["Client Portal", "Asiakasportaali", "Портал клиента"],
    ["Internal ERP", "Sisäinen ERP", "Внутренняя ERP"],
    ["Client account", "Asiakastili", "Аккаунт клиента"],
    ["Fleet manager", "Kalustopäällikkö", "Менеджер парка техники"],
    ["Client portal · Anjalankoski mill", "Asiakasportaali · Anjalankosken tehdas", "Портал клиента · завод Anjalankoski"],
    ["Welcome back, Stora Enso Anjalankoski", "Tervetuloa takaisin, Stora Enso Anjalankoski", "С возвращением, Stora Enso Anjalankoski"],
    ["Live status of your contracted fleet, hours to service, and on-site support.", "Sopimuskalustosi reaaliaikainen tila, tunnit seuraavaan huoltoon ja tuki paikan päällä.", "Актуальное состояние вашей техники по договору, моточасы до обслуживания и поддержка на объекте."],
    ["SOS / Report Breakdown", "SOS / Ilmoita vika", "SOS / Сообщить о поломке"],
    ["Active fleet", "Aktiivinen kalusto", "Активная техника"],
    ["Invoices", "Laskut", "Счета"],
    ["Order History", "Tilaushistoria", "История заказов"],
    ["Order history", "Tilaushistoria", "История заказов"],
    ["2 units on site", "2 konetta työmaalla", "2 единицы на объекте"],
    ["Last 6 months", "Viimeiset 6 kuukautta", "Последние 6 месяцев"],
    ["Invoice", "Lasku", "Счёт"],
    ["Order", "Tilaus", "Заказ"],
    ["Date", "Päivämäärä", "Дата"],
    ["Description", "Kuvaus", "Описание"],
    ["Amount (VAT 0%)", "Summa (ALV 0 %)", "Сумма (НДС 0%)"],
    ["Status", "Tila", "Статус"],
    ["Machine", "Kone", "Машина"],
    ["Period", "Ajanjakso", "Период"],
    ["Modules", "Moduulit", "Модули"],
    ["Dashboard", "Koontinäyttö", "Дашборд"],
    ["Fleet Passport", "Konekortit", "Паспорта техники"],
    ["Mechanics & Tasks", "Asentajat ja tehtävät", "Механики и задачи"],
    ["Accounting", "Kirjanpito", "Бухгалтерия"],
    ["AI Insights", "Tekoälyanalyysit", "AI-аналитика"],
    ["NEW", "UUSI", "НОВОЕ"],
    ["Internal ERP · Operations", "Sisäinen ERP · Toiminta", "Внутренняя ERP · Операции"],
    ["Manager view — Ville", "Päällikkönäkymä — Ville", "Панель менеджера — Ville"],
    ["Utilization, revenue, and zombie-asset risk across the Kymen fleet.", "Käyttöaste, tuotto ja zombi-koneiden riski koko Kymen-kalustossa.", "Загрузка, выручка и риск «зомби-активов» по всему парку Kymen."],
    ["FY 2026 · Apr–Sep", "TK 2026 · huhti–syys", "ФГ 2026 · апр–сен"],
    ["Utilization growth over 6 months", "Käyttöasteen kasvu 6 kuukauden aikana", "Рост загрузки за 6 месяцев"],
    ["Fleet average", "Kaluston keskiarvo", "Среднее по парку"],
    ["ROI & zombie tracker", "ROI- ja zombi-seuranta", "ROI и трекер «зомби»"],
    ["Assets with maintenance cost exceeding rental yield are flagged for disposal.", "Koneet, joiden huoltokulut ylittävät vuokratuoton, merkitään myytäviksi.", "Активы, расходы на обслуживание которых превышают доход от аренды, помечаются на продажу."],
    ["Model", "Malli", "Модель"],
    ["Revenue YTD", "Tuotto alkuvuodesta", "Выручка с начала года"],
    ["Maint. Cost YTD", "Huoltokulut alkuvuodesta", "Расходы на ТО с начала года"],
    ["ROI Status", "ROI-tila", "Статус ROI"],
    ["Priority dispatch", "Kiireellinen lähetys", "Срочный выезд"],
    ["Report breakdown", "Ilmoita vika", "Сообщить о поломке"],
    ["Machine on site", "Kone työmaalla", "Машина на объекте"],
    ["Issue description", "Vian kuvaus", "Описание проблемы"],
    ["Hydraulic leak on left lift mast, unit stopped at warehouse B…", "Hydrauliikkavuoto vasemmassa nostomastossa, kone pysähtyi varastolle B…", "Утечка гидравлики на левой мачте подъёмника, машина остановилась на складе B…"],
    ["Upload photo", "Lataa kuva", "Загрузить фото"],
    ["Drop an image or click to browse", "Pudota kuva tähän tai selaa klikkaamalla", "Перетащите изображение или нажмите для выбора"],
    ["Cancel", "Peruuta", "Отмена"],
    ["Send to dispatch", "Lähetä päivystykseen", "Отправить диспетчеру"],
    ["Close", "Sulje", "Закрыть"],
    ["Konekortti · Digital machine passport", "Konekortti · Digitaalinen konepassi", "Konekortti · Цифровой паспорт машины"],
    ["Dashboard views", "Näkymät", "Режимы просмотра"],
    ["ERP modules", "ERP-moduulit", "Модули ERP"],
    ["Language", "Kieli", "Язык"],
    ["Switch theme", "Vaihda teemaa", "Сменить тему"],
    ["Active", "Aktiivinen", "Активна"],
    ["Rented", "Vuokrattu", "В аренде"],
    ["Idle", "Joutilas", "Простаивает"],
    ["Paid", "Maksettu", "Оплачен"],
    ["Due", "Erääntyy", "К оплате"],
    ["Completed", "Valmis", "Завершён"],
    ["Excellent", "Erinomainen", "Отлично"],
    ["Zombie machine", "Zombi-kone", "Машина-зомби"],
    ["Sell asset", "Myy kone", "Продать"],
    ["Details", "Tiedot", "Подробнее"],
    ["Download Katsastus PDF", "Lataa katsastus-PDF", "Скачать PDF техосмотра"],
    ["Download PDF", "Lataa PDF", "Скачать PDF"],
    ["Order PDF", "Tilaus-PDF", "PDF заказа"],
    ["contracted unit", "sopimuskone", "единица по договору"],
    ["Engine hours", "Käyttötunnit", "Моточасы"],
    ["hrs", "h", "ч"],
    ["h", "h", "ч"],
    ["Fleet utilization", "Kaluston käyttöaste", "Загрузка парка"],
    ["Est. monthly revenue", "Arvioitu kuukausituotto", "Расчётная выручка за месяц"],
    ["Purchase price", "Hankintahinta", "Цена покупки"],
    ["Current value", "Nykyarvo", "Текущая стоимость"],
    ["Total revenue", "Kokonaistuotto", "Общая выручка"],
    ["Total maintenance", "Huoltokulut yhteensä", "Расходы на ТО всего"],
    ["Last 3 repairs", "Viimeiset 3 korjausta", "Последние 3 ремонта"],
    ["Export passport PDF", "Vie konekortti PDF:nä", "Экспорт паспорта в PDF"],
    ["Digital Konekortti for the whole fleet: purchase price, depreciation and lifetime P&L per machine. Open any asset from the Dashboard table via Details.", "Digitaalinen konekortti koko kalustolle: hankintahinta, poistot ja elinkaaren tulos koneittain. Avaa mikä tahansa kone koontinäytön taulukosta Tiedot-painikkeella.", "Цифровой Konekortti для всего парка: цена покупки, амортизация и P&L за срок службы по каждой машине. Откройте любую машину из таблицы дашборда через «Подробнее»."],
    ["Work orders, service schedules and mechanic assignments, linked to client SOS tickets.", "Työmääräykset, huoltoaikataulut ja asentajien tehtävät, yhdistettynä asiakkaiden SOS-ilmoituksiin.", "Заказ-наряды, графики обслуживания и назначение механиков, связанные с SOS-заявками клиентов."],
    ["One-click invoice export to Procountor and Netvisor. No double entry.", "Laskujen vienti Procountoriin ja Netvisoriin yhdellä napsautuksella. Ei kaksoiskirjauksia.", "Экспорт счетов в Procountor и Netvisor в один клик. Без двойного ввода."],
    ["Predictive maintenance, zombie-asset forecasting and pricing suggestions from your own fleet data.", "Ennakoiva huolto, zombi-koneiden ennustaminen ja hinnoitteluehdotukset oman kalustodatasi pohjalta.", "Предиктивное обслуживание, прогноз «зомби-активов» и рекомендации по ценам на основе данных вашего парка."],
    ["Module in development. Expected release: Phase 2", "Moduuli on kehityksessä. Julkaisu: vaihe 2", "Модуль в разработке. Релиз: этап 2"],
    ["Katsastus PDF opened for {id}", "Katsastus-PDF avattu: {id}", "PDF техосмотра открыт: {id}"],
    ["{id} queued for asset sale", "{id} lisätty myyntijonoon", "{id} поставлена в очередь на продажу"],
    ["Breakdown ticket sent for {id}", "Vikailmoitus lähetetty: {id}", "Заявка о поломке отправлена: {id}"],
    ["Utilization %", "Käyttöaste %", "Загрузка %"],
    ["Hours used", "Käytetyt tunnit", "Использовано моточасов"],
    ["ongoing", "käynnissä", "продолжается"],
    ["Sep rental: Mitsubishi EDIA EM + Yanmar V80", "Syyskuun vuokra: Mitsubishi EDIA EM + Yanmar V80", "Аренда за сентябрь: Mitsubishi EDIA EM + Yanmar V80"],
    ["Aug rental + service call-out", "Elokuun vuokra + huoltokäynti", "Аренда за август + выезд сервиса"],
    ["Jul rental: 2 units", "Heinäkuun vuokra: 2 konetta", "Аренда за июль: 2 единицы"],
    ["Hydraulic hose replacement", "Hydrauliletkun vaihto", "Замена гидравлического шланга"],
    ["Annual service + oil change", "Vuosihuolto + öljynvaihto", "Ежегодное ТО + замена масла"],
    ["Mast chain adjustment", "Nostomaston ketjun säätö", "Регулировка цепи мачты"],
    ["Transmission repair", "Vaihteiston korjaus", "Ремонт трансмиссии"],
    ["Boom cylinder reseal", "Puomisylinterin tiivistys", "Замена уплотнений цилиндра стрелы"],
    ["Brake system overhaul", "Jarrujärjestelmän kunnostus", "Капитальный ремонт тормозной системы"],
  ];

  const I18N = { fi: {}, ru: {} };
  ROWS.forEach(([en, fi, ru]) => { I18N.fi[en] = fi; I18N.ru[en] = ru; });
  const LOCALES = { en: "en-GB", fi: "fi-FI", ru: "ru-RU" };
  const ATTRS = ["aria-label", "placeholder", "title"];

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {  } },
  };

  const root = document.documentElement;
  const listeners = [];
  let lang = store.get("ktp-lang");
  if (!LOCALES[lang]) {
    const nav = (navigator.language || "en").slice(0, 2);
    lang = LOCALES[nav] ? nav : "en";
  }
  let theme = store.get("ktp-theme") === "light" ? "light" : "dark";

  const t = (key) => (I18N[lang] && I18N[lang][key]) || key;

  function translateDom() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.parentElement && n.parentElement.closest("script,style")) continue;
      if (n.__en === undefined) n.__en = n.nodeValue;
      const key = n.__en.trim();
      if (!key) continue;
      const out = t(key);
      n.nodeValue = out === key ? n.__en : n.__en.replace(key, () => out);
    }
    document.querySelectorAll("[aria-label],[placeholder],[title]").forEach((el) => {
      el.__en = el.__en || {};
      ATTRS.forEach((a) => {
        if (!el.hasAttribute(a)) return;
        if (!(a in el.__en)) el.__en[a] = el.getAttribute(a);
        el.setAttribute(a, t(el.__en[a]));
      });
    });
  }

  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; translateDom(); });
  }).observe(document.body, { childList: true, subtree: true });

  function setLang(next, notify = true) {
    lang = next;
    store.set("ktp-lang", lang);
    root.lang = lang;
    document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
    translateDom();
    if (notify) listeners.forEach((fn) => fn());
  }

  function setTheme(next, notify = true) {
    theme = next;
    store.set("ktp-theme", theme);
    root.dataset.theme = theme;
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.content = theme === "dark" ? "#0f1115" : "#eef2f6";
    document.getElementById("theme-icon").className = `fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`;
    if (notify) {
      root.classList.add("theme-anim");
      setTimeout(() => root.classList.remove("theme-anim"), 350);
      listeners.forEach((fn) => fn());
    }
  }

  document.querySelectorAll(".lang-btn").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  document.getElementById("theme-toggle").addEventListener("click", () => setTheme(theme === "dark" ? "light" : "dark"));

  setTheme(theme, false);
  setLang(lang, false);

  window.Prefs = { t, locale: () => LOCALES[lang], onChange: (fn) => listeners.push(fn) };
})();

