(() => {
  "use strict";

  const TABLE_NAME = "fcc_student_cards";
  const STORAGE_BUCKET = "fcc-student-card-photos";
  const CROP_OUTPUT_SIZE = 900;
  const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
  const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
  const GENERIC_LOGO = "assets/favicon.svg";

  const DEFAULT_COLORS = Object.freeze({
    primary: "#155a91",
    secondary: "#1c78b0",
    accent: "#67c5d5",
    background: "#eef8ff",
    backgroundEnd: "#e9f5fd",
    backgroundSoft: "#f8fcff",
    cardStart: "#e6f6ff",
    cardEnd: "#cceaff",
    cardInk: "#17334b",
    cardMuted: "#5d7890"
  });

  function blankUniversity(overrides = {}) {
    return {
      entityId: "",
      name: "",
      shortName: "",
      description: "",
      website: "",
      logoUrl: "",
      logoTitle: "",
      sourceUrl: "",
      colors: { ...DEFAULT_COLORS },
      ...overrides,
      colors: { ...DEFAULT_COLORS, ...(overrides.colors || {}) }
    };
  }

  const DEFAULT_CARD = Object.freeze({
    studentName: "Aluno(a) Exemplo",
    course: "Neuropsicologia",
    registration: "00000000-0",
    validUntil: "12/2029",
    university: blankUniversity(),
    photoPath: "",
    photoUrl: "",
    localPhoto: ""
  });

  const VIEW_TITLES = Object.freeze({
    courses: "Minha vida universitária",
    activities: "Prazos e atividades",
    card: "Carteirinha virtual",
    questions: "Central de dúvidas",
    profile: "Minha conta"
  });

  const els = {
    appShell: document.getElementById("appShell"),
    authScreen: document.getElementById("authScreen"),
    googleLoginButton: document.getElementById("googleLoginButton"),
    authHint: document.getElementById("authHint"),
    headerSubtitle: document.getElementById("headerSubtitle"),
    backButton: document.getElementById("backButton"),
    notificationButton: document.getElementById("notificationButton"),
    views: [...document.querySelectorAll(".view")],
    navItems: [...document.querySelectorAll("[data-view-target]")],
    goButtons: [...document.querySelectorAll("[data-go]")],
    courseNameLabel: document.getElementById("courseNameLabel"),
    courseStudentLabel: document.getElementById("courseStudentLabel"),
    courseRegistrationLabel: document.getElementById("courseRegistrationLabel"),
    courseUniversityLabel: document.getElementById("courseUniversityLabel"),
    headerUniversityLogo: document.getElementById("headerUniversityLogo"),
    authUniversityLogo: document.getElementById("authUniversityLogo"),
    cardUniversityLogo: document.getElementById("cardUniversityLogo"),
    cardInstitutionLabel: document.getElementById("cardInstitutionLabel"),
    themeColorMeta: document.getElementById("themeColorMeta"),
    cardStudentName: document.getElementById("cardStudentName"),
    cardCourseName: document.getElementById("cardCourseName"),
    cardRegistration: document.getElementById("cardRegistration"),
    cardValidUntil: document.getElementById("cardValidUntil"),
    cardDocumentNumber: document.getElementById("cardDocumentNumber"),
    studentPhoto: document.getElementById("studentPhoto"),
    studentInitial: document.getElementById("studentInitial"),
    profileForm: document.getElementById("profileForm"),
    universitySearchInput: document.getElementById("universitySearchInput"),
    universitySearchButton: document.getElementById("universitySearchButton"),
    changeUniversityButton: document.getElementById("changeUniversityButton"),
    selectedUniversityPanel: document.getElementById("selectedUniversityPanel"),
    selectedUniversityLogo: document.getElementById("selectedUniversityLogo"),
    selectedUniversityInitial: document.getElementById("selectedUniversityInitial"),
    selectedUniversityName: document.getElementById("selectedUniversityName"),
    selectedUniversityDescription: document.getElementById("selectedUniversityDescription"),
    studentNameInput: document.getElementById("studentNameInput"),
    courseInput: document.getElementById("courseInput"),
    registrationInput: document.getElementById("registrationInput"),
    randomRegistrationButton: document.getElementById("randomRegistrationButton"),
    validUntilInput: document.getElementById("validUntilInput"),
    studentPhotoInput: document.getElementById("studentPhotoInput"),
    removePhotoButton: document.getElementById("removePhotoButton"),
    profileStudentPhoto: document.getElementById("profileStudentPhoto"),
    profileStudentInitial: document.getElementById("profileStudentInitial"),
    navAvatar: document.getElementById("navAvatar"),
    profileAvatarLarge: document.getElementById("profileAvatarLarge"),
    profileName: document.getElementById("profileName"),
    profileEmail: document.getElementById("profileEmail"),
    storageMode: document.getElementById("storageMode"),
    syncBadge: document.getElementById("syncBadge"),
    logoutButton: document.getElementById("logoutButton"),
    cropModal: document.getElementById("cropModal"),
    cropBackdrop: document.getElementById("cropBackdrop"),
    cropCloseButton: document.getElementById("cropCloseButton"),
    cropCancelButton: document.getElementById("cropCancelButton"),
    cropApplyButton: document.getElementById("cropApplyButton"),
    cropStage: document.getElementById("cropStage"),
    cropImage: document.getElementById("cropImage"),
    cropZoom: document.getElementById("cropZoom"),
    universityModal: document.getElementById("universityModal"),
    universityModalBackdrop: document.getElementById("universityModalBackdrop"),
    universityModalCloseButton: document.getElementById("universityModalCloseButton"),
    universityModalCancelButton: document.getElementById("universityModalCancelButton"),
    universityModalApplyButton: document.getElementById("universityModalApplyButton"),
    universityModalQuery: document.getElementById("universityModalQuery"),
    universityModalSearchButton: document.getElementById("universityModalSearchButton"),
    universitySearchStatus: document.getElementById("universitySearchStatus"),
    universitySearchResults: document.getElementById("universitySearchResults"),
    universityPreview: document.getElementById("universityPreview"),
    universityPreviewLogo: document.getElementById("universityPreviewLogo"),
    universityPreviewInitial: document.getElementById("universityPreviewInitial"),
    universityPreviewName: document.getElementById("universityPreviewName"),
    universityPreviewDescription: document.getElementById("universityPreviewDescription"),
    universityPreviewWebsite: document.getElementById("universityPreviewWebsite"),
    universityLogoChoices: document.getElementById("universityLogoChoices"),
    universityColorSwatches: document.getElementById("universityColorSwatches"),
    universityMiniPreview: document.getElementById("universityMiniPreview"),
    toast: document.getElementById("toast")
  };

  let supabaseClient = null;
  let currentUser = null;
  let currentView = "courses";
  let cardData = { ...DEFAULT_CARD };
  let toastTimer = null;
  let universitySearchResults = [];
  let universityPreviewCandidate = null;
  let universitySearchController = null;
  let cropState = {
    source: "",
    naturalWidth: 0,
    naturalHeight: 0,
    stageSize: 0,
    baseScale: 1,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0
  };

  function getConfig() {
    return window.PORTAL_CONFIG || {};
  }

  function hasSupabaseConfig() {
    const config = getConfig();
    const key = config.SUPABASE_PUBLISHABLE_KEY || config.SUPABASE_ANON_KEY || "";
    return Boolean(
      config.SUPABASE_URL &&
      key &&
      !String(config.SUPABASE_URL).includes("SEU-PROJETO") &&
      !String(key).includes("SUA_CHAVE")
    );
  }

  function localKey() {
    return `portal-carteirinhas-v2:${currentUser?.id || "guest"}`;
  }

  function initials(name) {
    return String(name || "Aluno")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "A";
  }

  function normalizeValidity(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 6);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function normalizeHex(value, fallback = "") {
    const raw = String(value || "").trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(raw)) {
      return `#${raw.split("").map((char) => `${char}${char}`).join("")}`.toLowerCase();
    }
    if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toLowerCase()}`;
    return fallback;
  }

  function safeRemoteUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const url = new URL(raw, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function normalizeUniversity(value) {
    if (!value) return blankUniversity();
    if (typeof value === "string") {
      const raw = value.trim();
      if (/^[a-z0-9_-]{2,24}$/.test(raw) && raw === raw.toLowerCase()) return blankUniversity();
      return blankUniversity({ name: raw, shortName: raw });
    }
    if (typeof value !== "object") return blankUniversity();

    const rawName = String(value.name || value.universityName || "").trim();
    const legacyName = rawName;
    const colors = value.colors && typeof value.colors === "object" ? value.colors : {};
    return blankUniversity({
      entityId: String(value.entityId || value.wikidataId || "").trim(),
      name: legacyName,
      shortName: String(value.shortName || legacyName).trim(),
      description: String(value.description || "").trim(),
      website: safeRemoteUrl(value.website),
      logoUrl: safeRemoteUrl(value.logoUrl || value.logo),
      logoTitle: String(value.logoTitle || "").trim(),
      sourceUrl: safeRemoteUrl(value.sourceUrl),
      colors: {
        primary: normalizeHex(colors.primary, DEFAULT_COLORS.primary),
        secondary: normalizeHex(colors.secondary, DEFAULT_COLORS.secondary),
        accent: normalizeHex(colors.accent, DEFAULT_COLORS.accent),
        background: normalizeHex(colors.background, DEFAULT_COLORS.background),
        backgroundEnd: normalizeHex(colors.backgroundEnd, DEFAULT_COLORS.backgroundEnd),
        backgroundSoft: normalizeHex(colors.backgroundSoft, DEFAULT_COLORS.backgroundSoft),
        cardStart: normalizeHex(colors.cardStart, DEFAULT_COLORS.cardStart),
        cardEnd: normalizeHex(colors.cardEnd, DEFAULT_COLORS.cardEnd),
        cardInk: normalizeHex(colors.cardInk, DEFAULT_COLORS.cardInk),
        cardMuted: normalizeHex(colors.cardMuted, DEFAULT_COLORS.cardMuted)
      }
    });
  }

  function currentUniversity() {
    return normalizeUniversity(cardData.university);
  }

  function setUniversityLogo(imgElement, fallbackElement, university) {
    if (!imgElement) return;
    const hasLogo = Boolean(university.logoUrl);
    imgElement.onerror = null;
    imgElement.src = hasLogo ? university.logoUrl : GENERIC_LOGO;
    imgElement.alt = hasLogo ? university.name : "Portal Acadêmico";
    imgElement.classList.toggle("is-generic-logo", !hasLogo);
    if (fallbackElement) {
      fallbackElement.textContent = initials(university.name || "Universidade").slice(0, 2);
      fallbackElement.hidden = hasLogo;
      imgElement.hidden = !hasLogo;
    }
    if (hasLogo) {
      imgElement.onerror = () => {
        imgElement.onerror = null;
        if (fallbackElement) {
          imgElement.hidden = true;
          fallbackElement.hidden = false;
        } else {
          imgElement.src = GENERIC_LOGO;
          imgElement.alt = "Portal Acadêmico";
          imgElement.classList.add("is-generic-logo");
        }
      };
    }
  }

  function applyCssVariables(colors) {
    const root = document.documentElement;
    const primaryRgb = hexToRgb(colors.primary) || { r: 21, g: 90, b: 145 };
    const variables = {
      "--bg": colors.background,
      "--bg-end": colors.backgroundEnd,
      "--bg-soft": colors.backgroundSoft,
      "--ink": "#102b42",
      "--muted": mixHex(colors.primary, "#6b8091", 72),
      "--blue": colors.primary,
      "--blue-2": colors.secondary,
      "--cyan": colors.accent,
      "--accent": colors.accent,
      "--line": `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, .14)`,
      "--shadow-rgb": `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
      "--header-surface": "rgba(255,255,255,.89)",
      "--nav-surface": "rgba(250,252,255,.95)",
      "--hero-1": "rgba(255,255,255,.98)",
      "--hero-2": hexToRgba(colors.background, .86),
      "--soft-tint": mixHex(colors.primary, "#ffffff", 88),
      "--soft-tint-2": mixHex(colors.accent, "#ffffff", 90),
      "--card-bg-1": colors.cardStart,
      "--card-bg-2": colors.cardEnd,
      "--card-ink": colors.cardInk,
      "--card-muted": colors.cardMuted,
      "--card-line": hexToRgba(colors.accent, .38)
    };
    Object.entries(variables).forEach(([name, value]) => root.style.setProperty(name, value));
  }

  function applyUniversityTheme(universityValue, remember = true) {
    const university = normalizeUniversity(universityValue);
    cardData.university = university;
    document.documentElement.dataset.university = university.entityId || (university.name ? "custom" : "blank");
    applyCssVariables(university.colors);

    if (els.themeColorMeta) els.themeColorMeta.content = university.colors.background;
    setUniversityLogo(els.headerUniversityLogo, null, university);
    setUniversityLogo(els.authUniversityLogo, null, university);
    setUniversityLogo(els.cardUniversityLogo, null, university);
    if (els.courseUniversityLabel) els.courseUniversityLabel.textContent = university.name || "Universidade não definida";
    if (els.cardInstitutionLabel) {
      els.cardInstitutionLabel.textContent = university.name
        ? university.name.toUpperCase()
        : "IDENTIFICAÇÃO ACADÊMICA";
    }
    document.title = university.name ? `Portal Acadêmico · ${university.shortName || university.name}` : "Portal Acadêmico";
    renderSelectedUniversity();
    if (remember) localStorage.setItem("portal-carteirinhas:last-university", JSON.stringify(university));
  }

  function hexToRgb(hex) {
    const normalized = normalizeHex(hex);
    if (!normalized) return null;
    return {
      r: Number.parseInt(normalized.slice(1, 3), 16),
      g: Number.parseInt(normalized.slice(3, 5), 16),
      b: Number.parseInt(normalized.slice(5, 7), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")).join("")}`;
  }

  function mixHex(colorA, colorB, percentageOfB = 50) {
    const a = hexToRgb(colorA) || hexToRgb(DEFAULT_COLORS.primary);
    const b = hexToRgb(colorB) || hexToRgb("#ffffff");
    const ratio = clamp(Number(percentageOfB) / 100, 0, 1);
    return rgbToHex(
      a.r * (1 - ratio) + b.r * ratio,
      a.g * (1 - ratio) + b.g * ratio,
      a.b * (1 - ratio) + b.b * ratio
    );
  }

  function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex) || { r: 21, g: 90, b: 145 };
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function relativeLuminance(hex) {
    const rgb = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
    const values = [rgb.r, rgb.g, rgb.b].map((value) => {
      const channel = value / 255;
      return channel <= .03928 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    });
    return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
  }

  function contrastText(background, dark = "#102b42", light = "#ffffff") {
    return relativeLuminance(background) > .48 ? dark : light;
  }

  function rgbToHsl(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    let h = 0;
    if (delta) {
      if (max === rn) h = ((gn - bn) / delta) % 6;
      else if (max === gn) h = (bn - rn) / delta + 2;
      else h = (rn - gn) / delta + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const l = (max + min) / 2;
    const s = delta ? delta / (1 - Math.abs(2 * l - 1)) : 0;
    return { h, s, l };
  }

  function hslToHex(h, s, l) {
    const saturation = clamp(s, 0, 100) / 100;
    const lightness = clamp(l, 0, 100) / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lightness - chroma / 2;
    let [r, g, b] = [0, 0, 0];
    if (h < 60) [r, g, b] = [chroma, x, 0];
    else if (h < 120) [r, g, b] = [x, chroma, 0];
    else if (h < 180) [r, g, b] = [0, chroma, x];
    else if (h < 240) [r, g, b] = [0, x, chroma];
    else if (h < 300) [r, g, b] = [x, 0, chroma];
    else [r, g, b] = [chroma, 0, x];
    return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }

  function deterministicColor(seed) {
    let hash = 0;
    for (const char of String(seed || "universidade")) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return hslToHex(Math.abs(hash) % 360, 62, 38);
  }

  function buildColorTheme(primaryValue, accentValue, name = "") {
    const primary = normalizeHex(primaryValue, deterministicColor(name));
    let accent = normalizeHex(accentValue, "");
    const primaryRgb = hexToRgb(primary);
    const primaryHsl = rgbToHsl(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    if (!accent || Math.abs(relativeLuminance(accent) - relativeLuminance(primary)) < .04) {
      accent = hslToHex((primaryHsl.h + 155) % 360, Math.max(58, primaryHsl.s * 100), primaryHsl.l > .58 ? 38 : 58);
    }
    const primaryIsLight = relativeLuminance(primary) > .53;
    const secondary = primaryIsLight ? mixHex(primary, "#000000", 28) : mixHex(primary, "#ffffff", 18);
    const cardStart = primaryIsLight ? mixHex(primary, "#ffffff", 62) : mixHex(primary, "#ffffff", 5);
    const cardEnd = primaryIsLight ? mixHex(primary, "#ffffff", 42) : mixHex(primary, "#000000", 24);
    const cardInk = contrastText(cardEnd);
    const cardMuted = cardInk === "#ffffff" ? mixHex("#ffffff", cardEnd, 24) : mixHex(cardInk, cardEnd, 48);
    return {
      primary,
      secondary,
      accent,
      background: mixHex(primary, "#ffffff", 91),
      backgroundEnd: mixHex(primary, "#ffffff", 84),
      backgroundSoft: mixHex(primary, "#ffffff", 97),
      cardStart,
      cardEnd,
      cardInk,
      cardMuted
    };
  }

  function claimValue(entity, property) {
    return entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value ?? null;
  }

  function localizedValue(collection, fallback = "") {
    return collection?.["pt-br"]?.value || collection?.pt?.value || collection?.en?.value || fallback;
  }

  async function mediaWikiRequest(endpoint, params, signal) {
    const url = new URL(endpoint);
    Object.entries({ ...params, format: "json", origin: "*" }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`A busca online respondeu com o código ${response.status}.`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.info || "Não foi possível consultar a fonte pública.");
    return data;
  }

  function fileTitleKey(value) {
    return String(value || "").replace(/^File:/i, "").replace(/_/g, " ").trim().toLowerCase();
  }

  async function resolveCommonsFiles(fileNames, signal) {
    const names = [...new Set(fileNames.filter(Boolean))];
    if (!names.length) return new Map();
    const data = await mediaWikiRequest(COMMONS_API, {
      action: "query",
      prop: "imageinfo",
      titles: names.map((name) => `File:${name}`).join("|"),
      iiprop: "url|mime",
      iiurlwidth: 900
    }, signal);
    const map = new Map();
    Object.values(data.query?.pages || {}).forEach((page) => {
      const info = page.imageinfo?.[0];
      if (!info) return;
      map.set(fileTitleKey(page.title), {
        title: page.title,
        url: info.thumburl || info.url || "",
        originalUrl: info.url || "",
        mime: info.thumbmime || info.mime || ""
      });
    });
    return map;
  }

  async function searchCommonsLogos(name, signal) {
    const cleanName = String(name || "").replace(/["']/g, " ").trim();
    if (!cleanName) return [];
    const searches = [`intitle:"${cleanName}" logo`, `"${cleanName}" logotipo`, `"${cleanName}" logo`];
    const found = new Map();
    for (const query of searches) {
      try {
        const data = await mediaWikiRequest(COMMONS_API, {
          action: "query",
          generator: "search",
          gsrsearch: query,
          gsrnamespace: 6,
          gsrlimit: 8,
          prop: "imageinfo",
          iiprop: "url|mime",
          iiurlwidth: 900
        }, signal);
        Object.values(data.query?.pages || {}).forEach((page) => {
          const info = page.imageinfo?.[0];
          const url = info?.thumburl || info?.url || "";
          if (!url || !/^image\//.test(info?.thumbmime || info?.mime || "image/")) return;
          const key = fileTitleKey(page.title);
          if (!found.has(key)) found.set(key, { title: page.title, url, originalUrl: info.url || url });
        });
      } catch (error) {
        if (error.name === "AbortError") throw error;
        console.warn("Busca complementar de logo:", error.message);
      }
      if (found.size >= 5) break;
    }
    return [...found.values()].slice(0, 5);
  }

  function parseSearchEntity(entity, searchItem, logoMap) {
    const logoFile = claimValue(entity, "P154");
    const colorClaim = claimValue(entity, "P465");
    const website = claimValue(entity, "P856") || "";
    const logoInfo = logoFile ? logoMap.get(fileTitleKey(logoFile)) : null;
    const name = localizedValue(entity.labels, searchItem?.label || entity.id);
    return {
      entityId: entity.id,
      name,
      shortName: name,
      description: localizedValue(entity.descriptions, searchItem?.description || "Instituição de ensino"),
      website: typeof website === "string" ? website : "",
      logoUrl: logoInfo?.url || "",
      logoTitle: logoInfo?.title || (logoFile ? `File:${logoFile}` : ""),
      sourceUrl: `https://www.wikidata.org/wiki/${entity.id}`,
      claimedColor: normalizeHex(colorClaim, "")
    };
  }

  async function searchUniversityEntities(query, signal) {
    const searchById = new Map();
    for (const language of ["pt-br", "pt", "en"]) {
      const searchData = await mediaWikiRequest(WIKIDATA_API, {
        action: "wbsearchentities",
        search: query,
        language,
        uselang: "pt-br",
        type: "item",
        limit: 10
      }, signal);
      (searchData.search || []).forEach((item) => {
        if (!searchById.has(item.id)) searchById.set(item.id, item);
      });
      if (searchById.size >= 8) break;
    }

    const searchItems = [...searchById.values()].slice(0, 10);
    if (!searchItems.length) return [];
    const ids = searchItems.map((item) => item.id).join("|");
    const entityData = await mediaWikiRequest(WIKIDATA_API, {
      action: "wbgetentities",
      ids,
      props: "labels|descriptions|claims",
      languages: "pt-br|pt|en"
    }, signal);
    const entities = entityData.entities || {};
    const logos = searchItems.map((item) => claimValue(entities[item.id], "P154")).filter(Boolean);
    const logoMap = await resolveCommonsFiles(logos, signal);
    return searchItems
      .map((item) => parseSearchEntity(entities[item.id] || {}, item, logoMap))
      .filter((item) => item.name);
  }

  function imageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível analisar as cores do logo.")); };
      image.src = url;
    });
  }

  async function extractLogoColors(url) {
    if (!url) return [];
    try {
      const response = await fetch(url, { mode: "cors", credentials: "omit" });
      if (!response.ok) throw new Error("Logo indisponível para análise.");
      const image = await imageFromBlob(await response.blob());
      const canvas = document.createElement("canvas");
      canvas.width = 96;
      canvas.height = 96;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.clearRect(0, 0, 96, 96);
      const scale = Math.min(92 / image.naturalWidth, 92 / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.drawImage(image, (96 - width) / 2, (96 - height) / 2, width, height);
      const pixels = context.getImageData(0, 0, 96, 96).data;
      const buckets = new Map();
      for (let index = 0; index < pixels.length; index += 16) {
        const alpha = pixels[index + 3];
        if (alpha < 100) continue;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const hsl = rgbToHsl(r, g, b);
        if (hsl.l > .94 || hsl.l < .04) continue;
        const qr = Math.round(r / 24) * 24;
        const qg = Math.round(g / 24) * 24;
        const qb = Math.round(b / 24) * 24;
        const key = `${qr},${qg},${qb}`;
        const score = .35 + hsl.s * 1.8 + (1 - Math.abs(hsl.l - .48)) * .7;
        buckets.set(key, (buckets.get(key) || 0) + score);
      }
      return [...buckets.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => rgbToHex(...key.split(",").map(Number)))
        .filter((color, index, array) => array.findIndex((other) => Math.abs(relativeLuminance(other) - relativeLuminance(color)) < .025) === index)
        .slice(0, 5);
    } catch (error) {
      console.warn("Análise de cores:", error.message);
      return [];
    }
  }

  async function createUniversityTheme(candidate, logoChoice) {
    const selectedLogo = logoChoice || (candidate.logoUrl ? { url: candidate.logoUrl, title: candidate.logoTitle } : null);
    const extracted = selectedLogo?.url ? await extractLogoColors(selectedLogo.url) : [];
    const primary = candidate.claimedColor || extracted[0] || deterministicColor(candidate.name);
    const accent = extracted.find((color) => Math.abs(relativeLuminance(color) - relativeLuminance(primary)) > .07) || extracted[1] || "";
    return normalizeUniversity({
      ...candidate,
      logoUrl: selectedLogo?.url || "",
      logoTitle: selectedLogo?.title || "",
      colors: buildColorTheme(primary, accent, candidate.name)
    });
  }

  function renderSelectedUniversity() {
    if (!els.selectedUniversityPanel) return;
    const university = currentUniversity();
    const selected = Boolean(university.name);
    els.selectedUniversityPanel.classList.toggle("is-empty", !selected);
    els.selectedUniversityName.textContent = selected ? university.name : "Nenhuma universidade escolhida";
    els.selectedUniversityDescription.textContent = selected
      ? (university.description || "Identidade visual selecionada para o portal.")
      : "Use a busca online para localizar sua instituição e conferir o logo antes de aplicar.";
    setUniversityLogo(els.selectedUniversityLogo, els.selectedUniversityInitial, university);
    if (els.universitySearchInput && document.activeElement !== els.universitySearchInput) {
      els.universitySearchInput.value = university.name || "";
    }
    if (els.changeUniversityButton) els.changeUniversityButton.textContent = selected ? "Trocar" : "Buscar";
  }

  function openUniversityModal(query = "") {
    els.universityModal.hidden = false;
    document.body.classList.add("modal-open");
    els.universityModalQuery.value = query || els.universitySearchInput.value.trim() || currentUniversity().name;
    universityPreviewCandidate = null;
    els.universityPreview.hidden = true;
    els.universityModalApplyButton.disabled = true;
    window.setTimeout(() => els.universityModalQuery.focus(), 60);
    if (els.universityModalQuery.value.trim()) performUniversitySearch();
  }

  function closeUniversityModal() {
    universitySearchController?.abort();
    universitySearchController = null;
    els.universityModal.hidden = true;
    if (els.cropModal.hidden) document.body.classList.remove("modal-open");
  }

  function renderUniversityResults(results) {
    els.universitySearchResults.innerHTML = "";
    results.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "university-result";
      button.dataset.index = String(index);
      const media = document.createElement("span");
      media.className = "university-result__media";
      if (item.logoUrl) {
        const image = document.createElement("img");
        image.src = item.logoUrl;
        image.alt = "";
        media.appendChild(image);
      } else {
        media.textContent = initials(item.name).slice(0, 2);
      }
      const copy = document.createElement("span");
      copy.className = "university-result__copy";
      const name = document.createElement("strong");
      name.textContent = item.name;
      const description = document.createElement("small");
      description.textContent = item.description || "Instituição encontrada na busca pública";
      copy.append(name, description);
      const action = document.createElement("span");
      action.className = "university-result__action";
      action.textContent = item.isCustom ? "Buscar logo" : "Conferir";
      button.append(media, copy, action);
      button.addEventListener("click", () => prepareUniversityPreview(index));
      els.universitySearchResults.appendChild(button);
    });
  }

  async function performUniversitySearch() {
    const query = els.universityModalQuery.value.trim();
    if (query.length < 2) {
      els.universitySearchStatus.textContent = "Digite pelo menos duas letras para pesquisar.";
      els.universityModalQuery.focus();
      return;
    }
    universitySearchController?.abort();
    universitySearchController = new AbortController();
    universityPreviewCandidate = null;
    els.universityPreview.hidden = true;
    els.universityModalApplyButton.disabled = true;
    els.universitySearchResults.innerHTML = "";
    els.universitySearchStatus.innerHTML = '<span class="search-spinner" aria-hidden="true"></span> Buscando universidades e identidades visuais…';
    els.universityModalSearchButton.disabled = true;
    try {
      universitySearchResults = await searchUniversityEntities(query, universitySearchController.signal);
      const normalizedQuery = query.toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();
      const hasExactResult = universitySearchResults.some((item) => item.name.toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim() === normalizedQuery);
      if (!hasExactResult) {
        universitySearchResults.push({
          entityId: `custom-${Date.now()}`,
          name: query,
          shortName: query,
          description: "Usar exatamente o nome informado e procurar logos públicos relacionados.",
          website: "",
          logoUrl: "",
          logoTitle: "",
          sourceUrl: "",
          claimedColor: "",
          isCustom: true
        });
      }
      els.universitySearchStatus.textContent = universitySearchResults.length > 1
        ? `${universitySearchResults.length} opção(ões). Selecione a instituição correta para conferir o logo.`
        : "A busca livre está disponível. Confira os logos encontrados antes de aplicar.";
      renderUniversityResults(universitySearchResults);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(error);
      universitySearchResults = [{
        entityId: `custom-${Date.now()}`,
        name: query,
        shortName: query,
        description: "Busca livre pelo nome informado. Confira os logos públicos encontrados antes de aplicar.",
        website: "",
        logoUrl: "",
        logoTitle: "",
        sourceUrl: "",
        claimedColor: "",
        isCustom: true
      }];
      els.universitySearchStatus.textContent = "A consulta principal não respondeu, mas a busca livre pelo nome informado continua disponível.";
      renderUniversityResults(universitySearchResults);
    } finally {
      els.universityModalSearchButton.disabled = false;
    }
  }

  function renderLogoChoices(choices, selectedUrl) {
    els.universityLogoChoices.innerHTML = "";
    if (choices.length <= 1) {
      els.universityLogoChoices.hidden = true;
      return;
    }
    els.universityLogoChoices.hidden = false;
    choices.forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "logo-choice";
      button.classList.toggle("active", choice.url === selectedUrl);
      button.title = "Usar este logo";
      const image = document.createElement("img");
      image.src = choice.url;
      image.alt = "Alternativa de logo";
      button.appendChild(image);
      button.addEventListener("click", async () => {
        if (!universityPreviewCandidate) return;
        els.universityModalApplyButton.disabled = true;
        universityPreviewCandidate.theme = await createUniversityTheme(universityPreviewCandidate.base, choice);
        universityPreviewCandidate.selectedLogo = choice;
        renderUniversityPreview();
      });
      els.universityLogoChoices.appendChild(button);
    });
  }

  function renderUniversityPreview() {
    const state = universityPreviewCandidate;
    if (!state?.theme) return;
    const university = state.theme;
    els.universityPreview.hidden = false;
    els.universityPreviewName.textContent = university.name;
    els.universityPreviewDescription.textContent = university.description || "Instituição de ensino";
    if (university.website) {
      els.universityPreviewWebsite.href = university.website;
      els.universityPreviewWebsite.textContent = (() => {
        try { return new URL(university.website).hostname.replace(/^www\./, ""); }
        catch { return "Site oficial informado"; }
      })();
      els.universityPreviewWebsite.hidden = false;
    } else {
      els.universityPreviewWebsite.hidden = true;
    }
    setUniversityLogo(els.universityPreviewLogo, els.universityPreviewInitial, university);
    renderLogoChoices(state.logoChoices, university.logoUrl);
    const swatches = [university.colors.primary, university.colors.secondary, university.colors.accent];
    els.universityColorSwatches.innerHTML = "";
    swatches.forEach((color) => {
      const span = document.createElement("span");
      span.style.background = color;
      span.title = color;
      els.universityColorSwatches.appendChild(span);
    });
    els.universityMiniPreview.style.setProperty("--preview-primary", university.colors.primary);
    els.universityMiniPreview.style.setProperty("--preview-accent", university.colors.accent);
    els.universityMiniPreview.style.setProperty("--preview-bg", university.colors.background);
    els.universityMiniPreview.style.setProperty("--preview-card", university.colors.cardStart);
    const miniLogo = els.universityMiniPreview.querySelector("img");
    const miniInitial = els.universityMiniPreview.querySelector("span");
    setUniversityLogo(miniLogo, miniInitial, university);
    els.universityModalApplyButton.disabled = false;
    els.universityPreview.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function prepareUniversityPreview(index) {
    const candidate = universitySearchResults[index];
    if (!candidate) return;
    [...els.universitySearchResults.querySelectorAll(".university-result")].forEach((item) => {
      item.classList.toggle("active", Number(item.dataset.index) === index);
    });
    els.universitySearchStatus.innerHTML = '<span class="search-spinner" aria-hidden="true"></span> Preparando a prévia da identidade visual…';
    els.universityModalApplyButton.disabled = true;
    try {
      let logoChoices = candidate.logoUrl ? [{ title: candidate.logoTitle, url: candidate.logoUrl }] : [];
      const extraChoices = await searchCommonsLogos(candidate.name, universitySearchController?.signal);
      extraChoices.forEach((choice) => {
        if (!logoChoices.some((item) => item.url === choice.url)) logoChoices.push(choice);
      });
      logoChoices = logoChoices.slice(0, 5);
      const selectedLogo = logoChoices[0] || null;
      const theme = await createUniversityTheme(candidate, selectedLogo);
      universityPreviewCandidate = { base: candidate, logoChoices, selectedLogo, theme };
      els.universitySearchStatus.textContent = logoChoices.length
        ? "Confira o logo, as cores e a instituição antes de aplicar."
        : "A instituição foi encontrada, mas não houve logo disponível. Será usado um símbolo com as iniciais.";
      renderUniversityPreview();
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(error);
      els.universitySearchStatus.textContent = "Não foi possível preparar esta identidade. Escolha outro resultado ou tente novamente.";
    }
  }

  function applyUniversityPreview() {
    if (!universityPreviewCandidate?.theme) return;
    cardData.university = normalizeUniversity(universityPreviewCandidate.theme);
    applyUniversityTheme(cardData.university);
    els.universitySearchInput.value = cardData.university.name;
    els.syncBadge.textContent = "Alterações pendentes";
    closeUniversityModal();
    showToast(`Identidade de ${cardData.university.name} aplicada. Salve as informações para confirmar.`);
  }

  function randomInteger(max) {
    if (window.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      window.crypto.getRandomValues(value);
      return value[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function generateRandomRegistration() {
    let base = String(1 + randomInteger(9));
    for (let index = 0; index < 7; index += 1) base += String(randomInteger(10));
    return `${base}-${randomInteger(10)}`;
  }

  function safeCssUrl(url) {
    return String(url || "").replace(/["'()\\]/g, "");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      els.toast.hidden = true;
    }, 3000);
  }

  function setAvatar(element, avatarUrl, fallbackText) {
    if (!element) return;
    if (avatarUrl) {
      element.textContent = "";
      element.style.backgroundImage = `url("${safeCssUrl(avatarUrl)}")`;
    } else {
      element.style.backgroundImage = "";
      element.textContent = fallbackText;
    }
  }

  function setStudentPhoto(imgElement, initialElement, source) {
    if (source) {
      imgElement.src = source;
      imgElement.hidden = false;
      initialElement.hidden = true;
    } else {
      imgElement.removeAttribute("src");
      imgElement.hidden = true;
      initialElement.hidden = false;
      initialElement.textContent = initials(cardData.studentName).slice(0, 1);
    }
  }

  function renderUser() {
    const metadata = currentUser?.user_metadata || {};
    const displayName = metadata.full_name || metadata.name || currentUser?.email?.split("@")[0] || "Estudante";
    const email = currentUser?.email || "";
    const avatarUrl = metadata.avatar_url || metadata.picture || "";
    const fallback = initials(displayName);

    setAvatar(els.navAvatar, avatarUrl, fallback);
    setAvatar(els.profileAvatarLarge, avatarUrl, fallback);
    els.profileName.textContent = displayName;
    els.profileEmail.textContent = email;
    els.storageMode.textContent = "Conta online";
    els.syncBadge.textContent = "Sincronizado";
  }

  function fillProfileForm() {
    els.universitySearchInput.value = currentUniversity().name || "";
    els.studentNameInput.value = cardData.studentName;
    els.courseInput.value = cardData.course;
    els.registrationInput.value = cardData.registration;
    els.validUntilInput.value = cardData.validUntil;
    renderSelectedUniversity();
  }

  function syncCardDataFromProfileForm() {
    const studentName = els.studentNameInput.value.trim();
    const course = els.courseInput.value.trim();
    const registration = els.registrationInput.value.trim();
    const validUntil = els.validUntilInput.value.trim();

    if (studentName) cardData.studentName = studentName;
    if (course) cardData.course = course;
    if (registration) cardData.registration = registration;
    if (validUntil) cardData.validUntil = validUntil;
    cardData.university = normalizeUniversity(cardData.university);
  }

  function renderCard() {
    applyUniversityTheme(cardData.university);
    els.cardStudentName.textContent = cardData.studentName;
    els.cardCourseName.textContent = cardData.course;
    els.cardRegistration.textContent = cardData.registration;
    els.cardValidUntil.textContent = cardData.validUntil;
    els.cardDocumentNumber.textContent = `RGM ${cardData.registration}`;
    els.courseNameLabel.textContent = cardData.course;
    els.courseStudentLabel.textContent = cardData.studentName;
    els.courseRegistrationLabel.textContent = cardData.registration;

    const source = cardData.photoUrl || cardData.localPhoto || "";
    setStudentPhoto(els.studentPhoto, els.studentInitial, source);
    setStudentPhoto(els.profileStudentPhoto, els.profileStudentInitial, source);
    els.removePhotoButton.hidden = !source;
    fillProfileForm();
  }

  function navigate(viewName) {
    if (!VIEW_TITLES[viewName]) return;
    currentView = viewName;

    els.views.forEach((view) => {
      const active = view.dataset.view === viewName;
      view.hidden = !active;
      view.classList.toggle("active", active);
    });

    els.navItems.forEach((item) => {
      const active = item.dataset.viewTarget === viewName;
      item.classList.toggle("active", active);
      item.setAttribute("aria-current", active ? "page" : "false");
    });

    els.headerSubtitle.textContent = VIEW_TITLES[viewName];
    els.backButton.hidden = viewName === "courses";
    if (viewName === "profile") fillProfileForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveLocal() {
    localStorage.setItem(localKey(), JSON.stringify({
      studentName: cardData.studentName,
      course: cardData.course,
      registration: cardData.registration,
      validUntil: cardData.validUntil,
      university: normalizeUniversity(cardData.university),
      photoPath: cardData.photoPath || "",
      localPhoto: cardData.localPhoto || ""
    }));
  }

  function loadLocal() {
    try {
      const saved = JSON.parse(localStorage.getItem(localKey()) || "null");
      cardData = saved && typeof saved === "object"
        ? { ...DEFAULT_CARD, ...saved, university: normalizeUniversity(saved.university), photoUrl: "" }
        : { ...DEFAULT_CARD, university: blankUniversity() };
    } catch {
      cardData = { ...DEFAULT_CARD, university: blankUniversity() };
    }
  }

  async function createPhotoSignedUrl(path) {
    if (!path || !supabaseClient) return "";
    const { data, error } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (error) {
      console.warn("Não foi possível assinar a foto:", error.message);
      return "";
    }
    return data?.signedUrl || "";
  }

  function isMissingThemeColumn(error) {
    const text = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase();
    return text.includes("university_theme") || text.includes("pgrst204") || text.includes("42703");
  }

  async function loadRemote() {
    if (!supabaseClient || !currentUser) return;

    let response = await supabaseClient
      .from(TABLE_NAME)
      .select("student_name, course_name, registration_number, valid_until, university, university_theme, photo_path")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    let usingLegacySchema = false;
    if (response.error && isMissingThemeColumn(response.error)) {
      usingLegacySchema = true;
      response = await supabaseClient
        .from(TABLE_NAME)
        .select("student_name, course_name, registration_number, valid_until, university, photo_path")
        .eq("user_id", currentUser.id)
        .maybeSingle();
    }

    const { data, error } = response;
    if (error) {
      console.warn("Falha ao carregar a carteirinha:", error.message);
      els.syncBadge.textContent = "Somente local";
      showToast("Não foi possível carregar os dados online. Verifique a configuração do projeto.");
      return;
    }

    if (!data) {
      await saveRemote();
      return;
    }

    cardData = {
      ...cardData,
      studentName: data.student_name || DEFAULT_CARD.studentName,
      course: data.course_name || DEFAULT_CARD.course,
      registration: data.registration_number || DEFAULT_CARD.registration,
      validUntil: data.valid_until || DEFAULT_CARD.validUntil,
      university: normalizeUniversity(data.university_theme && Object.keys(data.university_theme).length ? data.university_theme : data.university),
      photoPath: data.photo_path || "",
      localPhoto: "",
      photoUrl: ""
    };

    if (usingLegacySchema) els.syncBadge.textContent = "Atualização necessária";
    if (cardData.photoPath) cardData.photoUrl = await createPhotoSignedUrl(cardData.photoPath);
  }

  async function saveRemote() {
    if (!supabaseClient || !currentUser) return false;

    const payload = {
      user_id: currentUser.id,
      student_name: cardData.studentName,
      course_name: cardData.course,
      registration_number: cardData.registration,
      valid_until: cardData.validUntil,
      university: currentUniversity().name || "",
      university_theme: normalizeUniversity(cardData.university),
      photo_path: cardData.photoPath || null,
      updated_at: new Date().toISOString()
    };

    let response = await supabaseClient
      .from(TABLE_NAME)
      .upsert(payload, { onConflict: "user_id" });

    if (response.error && isMissingThemeColumn(response.error)) {
      const { university_theme: ignoredTheme, ...legacyPayload } = payload;
      response = await supabaseClient
        .from(TABLE_NAME)
        .upsert(legacyPayload, { onConflict: "user_id" });
      if (!response.error) {
        els.syncBadge.textContent = "Atualização necessária";
        return false;
      }
    }

    if (response.error) {
      console.error(response.error);
      els.syncBadge.textContent = "Somente local";
      return false;
    }

    els.syncBadge.textContent = "Sincronizado";
    return true;
  }

  async function persistCard(successMessage) {
    saveLocal();
    const synced = await saveRemote();
    renderCard();
    showToast(synced ? successMessage : "Salvo somente neste navegador.");
    return synced;
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.readAsDataURL(file);
    });
  }

  function resetCropState() {
    cropState = {
      source: "",
      naturalWidth: 0,
      naturalHeight: 0,
      stageSize: 0,
      baseScale: 1,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      dragging: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      startOffsetX: 0,
      startOffsetY: 0
    };
  }

  function waitForImage(image, source) {
    return new Promise((resolve, reject) => {
      const handleLoad = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error("Não foi possível abrir a imagem selecionada."));
      };
      const cleanup = () => {
        image.removeEventListener("load", handleLoad);
        image.removeEventListener("error", handleError);
      };

      image.addEventListener("load", handleLoad);
      image.addEventListener("error", handleError);
      image.src = source;
      if (image.complete && image.naturalWidth) handleLoad();
    });
  }

  function updateCropPreview() {
    if (!cropState.naturalWidth || !cropState.naturalHeight || els.cropModal.hidden) return;

    const stageSize = els.cropStage.clientWidth;
    if (!stageSize) return;

    cropState.stageSize = stageSize;
    cropState.baseScale = Math.max(
      stageSize / cropState.naturalWidth,
      stageSize / cropState.naturalHeight
    );

    const scale = cropState.baseScale * cropState.zoom;
    const imageWidth = cropState.naturalWidth * scale;
    const imageHeight = cropState.naturalHeight * scale;
    const maxOffsetX = Math.max(0, (imageWidth - stageSize) / 2);
    const maxOffsetY = Math.max(0, (imageHeight - stageSize) / 2);

    cropState.offsetX = clamp(cropState.offsetX, -maxOffsetX, maxOffsetX);
    cropState.offsetY = clamp(cropState.offsetY, -maxOffsetY, maxOffsetY);

    els.cropImage.style.width = `${imageWidth}px`;
    els.cropImage.style.height = `${imageHeight}px`;
    els.cropImage.style.left = `${(stageSize - imageWidth) / 2 + cropState.offsetX}px`;
    els.cropImage.style.top = `${(stageSize - imageHeight) / 2 + cropState.offsetY}px`;
  }

  function initializeCropPreview() {
    cropState.zoom = 1;
    cropState.offsetX = 0;
    cropState.offsetY = 0;
    els.cropZoom.value = "1";
    updateCropPreview();
  }

  function closeCropModal() {
    els.cropModal.hidden = true;
    document.body.classList.remove("modal-open");
    els.cropStage.classList.remove("is-dragging");
    els.cropImage.removeAttribute("src");
    els.cropImage.removeAttribute("style");
    els.studentPhotoInput.value = "";
    resetCropState();
  }

  async function openPhotoCropper(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Selecione uma foto válida.");
      els.studentPhotoInput.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast("A foto deve ter no máximo 8 MB.");
      els.studentPhotoInput.value = "";
      return;
    }

    try {
      const source = await fileToDataUrl(file);
      cropState.source = source;
      els.cropModal.hidden = false;
      document.body.classList.add("modal-open");
      await waitForImage(els.cropImage, source);
      cropState.naturalWidth = els.cropImage.naturalWidth;
      cropState.naturalHeight = els.cropImage.naturalHeight;
      window.requestAnimationFrame(() => {
        initializeCropPreview();
        els.cropCloseButton.focus();
      });
    } catch (error) {
      console.error(error);
      closeCropModal();
      showToast(error.message || "Não foi possível abrir a foto.");
    }
  }

  function startCropDrag(event) {
    if (!cropState.naturalWidth) return;
    event.preventDefault();
    cropState.dragging = true;
    cropState.pointerId = event.pointerId;
    cropState.startX = event.clientX;
    cropState.startY = event.clientY;
    cropState.startOffsetX = cropState.offsetX;
    cropState.startOffsetY = cropState.offsetY;
    els.cropStage.classList.add("is-dragging");
    els.cropStage.setPointerCapture?.(event.pointerId);
  }

  function moveCropDrag(event) {
    if (!cropState.dragging || event.pointerId !== cropState.pointerId) return;
    event.preventDefault();
    cropState.offsetX = cropState.startOffsetX + (event.clientX - cropState.startX);
    cropState.offsetY = cropState.startOffsetY + (event.clientY - cropState.startY);
    updateCropPreview();
  }

  function endCropDrag(event) {
    if (!cropState.dragging || event.pointerId !== cropState.pointerId) return;
    cropState.dragging = false;
    cropState.pointerId = null;
    els.cropStage.classList.remove("is-dragging");
    els.cropStage.releasePointerCapture?.(event.pointerId);
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Não foi possível preparar a foto."));
      }, type, quality);
    });
  }

  async function saveCroppedPhoto(blob, dataUrl) {
    syncCardDataFromProfileForm();

    if (!supabaseClient || !currentUser) {
      cardData.localPhoto = dataUrl;
      cardData.photoPath = "";
      cardData.photoUrl = "";
      await persistCard("Foto enquadrada e adicionada à carteirinha.");
      return;
    }

    showToast("Salvando a foto ajustada…");
    const previousPath = cardData.photoPath;
    const path = `${currentUser.id}/student-photo-${Date.now()}.jpg`;
    const { error: uploadError } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .upload(path, blob, {
        upsert: false,
        contentType: "image/jpeg",
        cacheControl: "3600"
      });

    if (uploadError) throw uploadError;

    cardData.photoPath = path;
    cardData.photoUrl = await createPhotoSignedUrl(path);
    cardData.localPhoto = "";

    const synced = await persistCard("Foto enquadrada e atualizada com segurança.");

    if (synced && previousPath && previousPath !== path) {
      const { error: removeOldError } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .remove([previousPath]);
      if (removeOldError) console.warn("Não foi possível remover a foto anterior:", removeOldError.message);
    }
  }

  async function applyCrop() {
    if (!cropState.naturalWidth || !cropState.stageSize) return;

    const originalText = els.cropApplyButton.innerHTML;
    els.cropApplyButton.disabled = true;
    els.cropApplyButton.textContent = "Preparando…";

    try {
      updateCropPreview();
      const stageSize = cropState.stageSize;
      const scale = cropState.baseScale * cropState.zoom;
      const imageWidth = cropState.naturalWidth * scale;
      const imageHeight = cropState.naturalHeight * scale;
      const left = (stageSize - imageWidth) / 2 + cropState.offsetX;
      const top = (stageSize - imageHeight) / 2 + cropState.offsetY;
      const sourceX = clamp(-left / scale, 0, cropState.naturalWidth);
      const sourceY = clamp(-top / scale, 0, cropState.naturalHeight);
      const sourceSize = stageSize / scale;

      const canvas = document.createElement("canvas");
      canvas.width = CROP_OUTPUT_SIZE;
      canvas.height = CROP_OUTPUT_SIZE;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Seu navegador não conseguiu preparar a foto.");

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      const boundedSourceSize = Math.min(
        sourceSize,
        cropState.naturalWidth - sourceX,
        cropState.naturalHeight - sourceY
      );

      context.drawImage(
        els.cropImage,
        sourceX,
        sourceY,
        boundedSourceSize,
        boundedSourceSize,
        0,
        0,
        CROP_OUTPUT_SIZE,
        CROP_OUTPUT_SIZE
      );

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
      await saveCroppedPhoto(blob, dataUrl);
      closeCropModal();
    } catch (error) {
      console.error(error);
      showToast(error.message || "Não foi possível salvar a foto ajustada.");
    } finally {
      els.cropApplyButton.disabled = false;
      els.cropApplyButton.innerHTML = originalText;
    }
  }

  async function removePhoto() {
    try {
      syncCardDataFromProfileForm();
      if (supabaseClient && currentUser && cardData.photoPath) {
        const { error } = await supabaseClient.storage
          .from(STORAGE_BUCKET)
          .remove([cardData.photoPath]);
        if (error) throw error;
      }

      cardData.photoPath = "";
      cardData.photoUrl = "";
      cardData.localPhoto = "";
      await persistCard("Foto removida da carteirinha.");
    } catch (error) {
      console.error(error);
      showToast("Não foi possível remover a foto agora.");
    }
  }

  function showApp() {
    els.authScreen.hidden = true;
    els.appShell.hidden = false;
    renderUser();
    renderCard();
    navigate(currentView);
  }

  function showAuth() {
    if (!els.cropModal.hidden) closeCropModal();
    if (!els.universityModal.hidden) closeUniversityModal();
    els.authScreen.hidden = false;
    els.appShell.hidden = true;
  }

  async function enterSession(user) {
    currentUser = user;
    loadLocal();
    await loadRemote();
    showApp();
  }

  async function signInWithGoogle() {
    if (!supabaseClient) {
      showToast("Não foi possível carregar a configuração de acesso.");
      return;
    }

    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { access_type: "offline", prompt: "select_account" }
      }
    });

    if (error) showToast(`Falha no login: ${error.message}`);
  }

  async function logout() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    currentUser = null;
    let rememberedUniversity = blankUniversity();
    try {
      rememberedUniversity = normalizeUniversity(JSON.parse(localStorage.getItem("portal-carteirinhas:last-university") || "null"));
    } catch {
      rememberedUniversity = blankUniversity();
    }
    cardData = { ...DEFAULT_CARD, university: rememberedUniversity };
    applyUniversityTheme(rememberedUniversity, false);
    showAuth();
  }

  function bindEvents() {
    els.navItems.forEach((item) => item.addEventListener("click", () => navigate(item.dataset.viewTarget)));
    els.goButtons.forEach((item) => item.addEventListener("click", () => navigate(item.dataset.go)));
    els.backButton.addEventListener("click", () => navigate("courses"));
    els.notificationButton.addEventListener("click", () => showToast("Nenhuma nova notificação no momento."));
    els.googleLoginButton.addEventListener("click", signInWithGoogle);
    els.logoutButton.addEventListener("click", logout);
    els.universitySearchButton.addEventListener("click", () => openUniversityModal(els.universitySearchInput.value.trim()));
    els.changeUniversityButton.addEventListener("click", () => openUniversityModal(els.universitySearchInput.value.trim()));
    els.universitySearchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        openUniversityModal(els.universitySearchInput.value.trim());
      }
    });
    els.universityModalBackdrop.addEventListener("click", closeUniversityModal);
    els.universityModalCloseButton.addEventListener("click", closeUniversityModal);
    els.universityModalCancelButton.addEventListener("click", closeUniversityModal);
    els.universityModalApplyButton.addEventListener("click", applyUniversityPreview);
    els.universityModalSearchButton.addEventListener("click", performUniversitySearch);
    els.universityModalQuery.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        performUniversitySearch();
      }
    });
    els.studentPhotoInput.addEventListener("change", () => openPhotoCropper(els.studentPhotoInput.files?.[0]));
    els.removePhotoButton.addEventListener("click", removePhoto);
    els.randomRegistrationButton.addEventListener("click", () => {
      els.registrationInput.value = generateRandomRegistration();
      showToast("RGM aleatório gerado. Salve as informações para confirmar.");
    });

    els.cropBackdrop.addEventListener("click", closeCropModal);
    els.cropCloseButton.addEventListener("click", closeCropModal);
    els.cropCancelButton.addEventListener("click", closeCropModal);
    els.cropApplyButton.addEventListener("click", applyCrop);
    els.cropStage.addEventListener("pointerdown", startCropDrag);
    els.cropStage.addEventListener("pointermove", moveCropDrag);
    els.cropStage.addEventListener("pointerup", endCropDrag);
    els.cropStage.addEventListener("pointercancel", endCropDrag);
    els.cropZoom.addEventListener("input", () => {
      const nextZoom = Number(els.cropZoom.value);
      const ratio = nextZoom / cropState.zoom;
      cropState.offsetX *= ratio;
      cropState.offsetY *= ratio;
      cropState.zoom = nextZoom;
      updateCropPreview();
    });
    window.addEventListener("resize", updateCropPreview);
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!els.universityModal.hidden) closeUniversityModal();
      else if (!els.cropModal.hidden) closeCropModal();
    });

    els.validUntilInput.addEventListener("input", () => {
      els.validUntilInput.value = normalizeValidity(els.validUntilInput.value);
    });

    els.profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!currentUniversity().name) {
        showToast("Busque e selecione sua universidade antes de salvar.");
        openUniversityModal(els.universitySearchInput.value.trim());
        return;
      }
      cardData.university = normalizeUniversity(cardData.university);
      cardData.studentName = els.studentNameInput.value.trim();
      cardData.course = els.courseInput.value.trim();
      cardData.registration = els.registrationInput.value.trim();
      cardData.validUntil = els.validUntilInput.value.trim();
      await persistCard("Informações da carteirinha salvas.");
    });

    document.querySelectorAll(".round-check").forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("checked");
        button.closest(".activity-item")?.classList.toggle("completed", button.classList.contains("checked"));
      });
    });
  }

  function loadExternalScript(src) {
    return new Promise((resolve, reject) => {
      if (window.supabase?.createClient) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Falha ao carregar a biblioteca de autenticação."));
      document.head.appendChild(script);
    });
  }

  async function initSupabase() {
    if (!hasSupabaseConfig()) {
      els.authHint.innerHTML = 'Configuração compartilhada não encontrada. Veja o arquivo <code>js/config.js</code>.';
      return;
    }

    try {
      await loadExternalScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
    } catch (error) {
      console.error(error);
      els.authHint.textContent = "Não foi possível carregar a autenticação.";
      return;
    }

    const config = getConfig();
    const key = config.SUPABASE_PUBLISHABLE_KEY || config.SUPABASE_ANON_KEY;
    supabaseClient = window.supabase.createClient(config.SUPABASE_URL, key, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true
      }
    });

    els.authHint.textContent = config.USING_SHARED_FCC_CONFIG
      ? "Acesso online conectado."
      : "Configuração de acesso carregada.";

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) await enterSession(session.user);

    supabaseClient.auth.onAuthStateChange((event, sessionData) => {
      if (event === "SIGNED_IN" && sessionData?.user && currentUser?.id !== sessionData.user.id) {
        enterSession(sessionData.user);
      }
      if (event === "SIGNED_OUT") showAuth();
    });
  }

  async function init() {
    let rememberedUniversity = blankUniversity();
    try {
      rememberedUniversity = normalizeUniversity(JSON.parse(localStorage.getItem("portal-carteirinhas:last-university") || "null"));
    } catch {
      rememberedUniversity = blankUniversity();
    }
    cardData.university = rememberedUniversity;
    applyUniversityTheme(rememberedUniversity, false);
    bindEvents();
    showAuth();

    if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch((error) => console.warn("Service Worker:", error));
    }

    await initSupabase();
  }

  init().catch((error) => {
    console.error(error);
    showToast("O portal encontrou um erro ao iniciar.");
  });
})();
