(() => {
  "use strict";

  const TABLE_NAME = "fcc_student_cards";
  const STORAGE_BUCKET = "fcc-student-card-photos";
  const CROP_OUTPUT_SIZE = 900;
  const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
  const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
  const WIKIPEDIA_APIS = Object.freeze([
    { language: "pt", endpoint: "https://pt.wikipedia.org/w/api.php" },
    { language: "en", endpoint: "https://en.wikipedia.org/w/api.php" }
  ]);
  const MICROLINK_API = "https://api.microlink.io/";
  const GENERIC_LOGO = "assets/favicon.svg";
  const BRAND_LOOKUP_CACHE = new Map();
  const EDUCATION_WORDS = /\b(universidade|universitário|universitaria|faculdade|centro universitário|instituição de ensino|ensino superior|university|college|higher education|school)\b/i;
  const LOGO_WORDS = /\b(logo|logotipo|logomarca|wordmark|brand|marca|emblem|emblema|symbol|símbolo)\b/i;
  const PHOTO_WORDS = /\b(campus|prédio|predio|building|biblioteca|library|teatro|theatre|fachada|foto|photograph|aerial|vista|sala|classroom)\b/i;
  const SEARCH_HINTS = Object.freeze([
    {
      keys: ["anhembi", "anhembi morumbi", "universidade anhembi morumbi", "uam"],
      canonicalName: "Universidade Anhembi Morumbi",
      aliases: ["Anhembi Morumbi", "UAM"],
      website: "https://portal.anhembi.br/",
      claimedColor: "#00a98f",
      palette: ["#00a98f", "#007f76", "#454545"],
      description: "Universidade privada de ensino superior em São Paulo"
    }
  ]);

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

  function createGentleVisualTheme(colors = DEFAULT_COLORS) {
    const brandPrimary = normalizeBrandTone(colors.primary, DEFAULT_COLORS.primary);
    const brandSecondary = normalizeBrandTone(colors.accent || colors.secondary, DEFAULT_COLORS.accent);
    const brandRgb = hexToRgb(brandPrimary) || { r: 21, g: 90, b: 145 };

    return {
      brandPrimary,
      brandSecondary,
      brandRgb,
      background: mixHex(DEFAULT_COLORS.background, brandPrimary, 4),
      backgroundEnd: mixHex(DEFAULT_COLORS.backgroundEnd, brandSecondary, 3),
      backgroundSoft: DEFAULT_COLORS.backgroundSoft,
      cardStart: mixHex(DEFAULT_COLORS.cardStart, brandPrimary, 8),
      cardEnd: mixHex(DEFAULT_COLORS.cardEnd, brandSecondary, 8),
      cardLine: hexToRgba(brandPrimary, .22),
      brandSoft: mixHex(brandPrimary, "#ffffff", 92)
    };
  }

  function applyCssVariables(colors) {
    const root = document.documentElement;
    const gentle = createGentleVisualTheme(colors);
    const baseRgb = hexToRgb(DEFAULT_COLORS.primary) || { r: 21, g: 90, b: 145 };
    const variables = {
      "--bg": gentle.background,
      "--bg-end": gentle.backgroundEnd,
      "--bg-soft": gentle.backgroundSoft,
      "--ink": "#102b42",
      "--muted": "#668096",
      "--blue": DEFAULT_COLORS.primary,
      "--blue-2": DEFAULT_COLORS.secondary,
      "--cyan": DEFAULT_COLORS.accent,
      "--accent": DEFAULT_COLORS.accent,
      "--brand-primary": gentle.brandPrimary,
      "--brand-secondary": gentle.brandSecondary,
      "--brand-soft": gentle.brandSoft,
      "--brand-line": `rgba(${gentle.brandRgb.r}, ${gentle.brandRgb.g}, ${gentle.brandRgb.b}, .18)`,
      "--line": `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, .14)`,
      "--shadow-rgb": `${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}`,
      "--header-surface": "rgba(249,253,255,.89)",
      "--nav-surface": "rgba(246,251,255,.95)",
      "--hero-1": "rgba(255,255,255,.98)",
      "--hero-2": hexToRgba(gentle.background, .86),
      "--soft-tint": mixHex(DEFAULT_COLORS.primary, "#ffffff", 88),
      "--soft-tint-2": gentle.brandSoft,
      "--card-bg-1": gentle.cardStart,
      "--card-bg-2": gentle.cardEnd,
      "--card-ink": DEFAULT_COLORS.cardInk,
      "--card-muted": DEFAULT_COLORS.cardMuted,
      "--card-line": gentle.cardLine
    };
    Object.entries(variables).forEach(([name, value]) => root.style.setProperty(name, value));
  }

  function applyUniversityTheme(universityValue, remember = true) {
    const university = normalizeUniversity(universityValue);
    cardData.university = university;
    document.documentElement.dataset.university = university.entityId || (university.name ? "custom" : "blank");
    applyCssVariables(university.colors);

    if (els.themeColorMeta) els.themeColorMeta.content = DEFAULT_COLORS.background;
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

  function normalizeBrandTone(value, fallback) {
    let color = normalizeHex(value, fallback);
    let luminance = relativeLuminance(color);

    // Cores institucionais muito claras somem no branco; as muito escuras pesam na interface.
    // O logo permanece original, mas os pequenos detalhes visuais recebem uma versão equilibrada.
    if (luminance > .56) {
      color = mixHex(color, "#102b42", 34);
      luminance = relativeLuminance(color);
    }
    if (luminance < .075) color = mixHex(color, "#ffffff", 22);
    return color;
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
    const gentle = createGentleVisualTheme({ primary, secondary, accent });
    return {
      primary,
      secondary,
      accent,
      background: gentle.background,
      backgroundEnd: gentle.backgroundEnd,
      backgroundSoft: gentle.backgroundSoft,
      cardStart: gentle.cardStart,
      cardEnd: gentle.cardEnd,
      cardInk: DEFAULT_COLORS.cardInk,
      cardMuted: DEFAULT_COLORS.cardMuted
    };
  }

  function claimValue(entity, property) {
    return entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value ?? null;
  }

  function claimValues(entity, property) {
    return (entity?.claims?.[property] || [])
      .map((claim) => claim?.mainsnak?.datavalue?.value)
      .filter((value) => value !== undefined && value !== null);
  }

  function localizedValue(collection, fallback = "") {
    return collection?.["pt-br"]?.value || collection?.pt?.value || collection?.en?.value || fallback;
  }

  function localizedAliases(collection) {
    const aliases = [];
    ["pt-br", "pt", "en"].forEach((language) => {
      (collection?.[language] || []).forEach((item) => {
        const value = String(item?.value || "").trim();
        if (value && !aliases.some((alias) => alias.toLocaleLowerCase("pt-BR") === value.toLocaleLowerCase("pt-BR"))) aliases.push(value);
      });
    });
    return aliases;
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function uniqueText(values) {
    const seen = new Set();
    return values.filter((value) => {
      const clean = String(value || "").replace(/\s+/g, " ").trim();
      const key = normalizeSearchText(clean);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function institutionHint(query) {
    const normalized = normalizeSearchText(query);
    return SEARCH_HINTS.find((hint) => hint.keys.some((key) => {
      const normalizedKey = normalizeSearchText(key);
      if (normalized === normalizedKey) return true;
      if (normalized.length < 5 || normalizedKey.length < 5) return false;
      return normalized.includes(normalizedKey) || normalizedKey.includes(normalized);
    })) || null;
  }

  function buildSearchVariants(query) {
    const clean = String(query || "").replace(/["'`]/g, " ").replace(/\s+/g, " ").trim();
    const variants = [clean];
    const normalized = normalizeSearchText(clean);
    const genericPattern = /\b(universidade|faculdade|centro universitario|instituto|escola|university|college)\b/i;
    if (!genericPattern.test(normalized)) {
      variants.push(`Universidade ${clean}`, `Faculdade ${clean}`, `Centro Universitário ${clean}`);
    } else {
      const stripped = clean
        .replace(/\b(universidade|faculdade|centro universitário|centro universitario|instituto|escola|university|college)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (stripped.length >= 2) variants.push(stripped);
    }
    const hint = institutionHint(clean);
    if (hint) variants.push(hint.canonicalName, ...(hint.aliases || []));
    return uniqueText(variants).slice(0, 6);
  }

  function searchTokens(value) {
    const stopWords = new Set(["universidade", "universitario", "universitaria", "faculdade", "centro", "instituto", "escola", "university", "college", "de", "da", "do", "das", "dos", "e", "ead"]);
    return normalizeSearchText(value).split(" ").filter((token) => token.length > 1 && !stopWords.has(token));
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

  async function jsonRequest(url, signal, timeoutMs = 15000) {
    const controller = new AbortController();
    const relayAbort = () => controller.abort();
    signal?.addEventListener("abort", relayAbort, { once: true });
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        mode: "cors",
        credentials: "omit",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`Serviço de identidade visual indisponível (${response.status}).`);
      return await response.json();
    } catch (error) {
      if (signal?.aborted) throw new DOMException("Busca cancelada", "AbortError");
      throw error;
    } finally {
      window.clearTimeout(timer);
      signal?.removeEventListener("abort", relayAbort);
    }
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
      iiprop: "url|mime|size|mediatype",
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
        mime: info.thumbmime || info.mime || "",
        width: info.thumbwidth || info.width || 0,
        height: info.thumbheight || info.height || 0,
        source: "Wikimedia Commons"
      });
    });
    return map;
  }

  function scoreLogoFile(item, institutionNames) {
    const title = normalizeSearchText(item.title);
    const tokens = searchTokens(institutionNames.join(" "));
    const tokenMatches = tokens.filter((token) => title.includes(token)).length;
    let score = tokenMatches * 14;
    if (LOGO_WORDS.test(item.title)) score += 90;
    if (/\.svg$/i.test(item.title) || /svg/i.test(item.mime || "")) score += 28;
    else if (/\.png$/i.test(item.title) || /png/i.test(item.mime || "")) score += 16;
    else if (/\.jpe?g$/i.test(item.title)) score -= 15;
    if (PHOTO_WORDS.test(item.title)) score -= 100;
    if (!LOGO_WORDS.test(item.title) && tokenMatches < Math.min(2, tokens.length)) score -= 45;
    return score;
  }

  async function searchCommonsLogos(name, aliases = [], commonsCategory = "", signal) {
    const institutionNames = uniqueText([name, ...aliases]).slice(0, 4);
    if (!institutionNames.length) return [];
    const found = new Map();

    const collectPages = (pages) => {
      Object.values(pages || {}).forEach((page) => {
        const info = page.imageinfo?.[0];
        const url = info?.thumburl || info?.url || "";
        const mime = info?.thumbmime || info?.mime || "";
        if (!url || !/^image\//.test(mime || "image/")) return;
        const item = {
          title: page.title,
          url,
          originalUrl: info.url || url,
          mime,
          width: info.thumbwidth || info.width || 0,
          height: info.thumbheight || info.height || 0,
          source: "Wikimedia Commons"
        };
        item.score = scoreLogoFile(item, institutionNames);
        const key = fileTitleKey(page.title);
        if (item.score >= 45 && (!found.has(key) || found.get(key).score < item.score)) found.set(key, item);
      });
    };

    for (const institutionName of institutionNames.slice(0, 3)) {
      const cleanName = institutionName.replace(/["']/g, " ").trim();
      const searches = [
        `intitle:"${cleanName}" logo`,
        `"${cleanName}" logotipo`,
        `"${cleanName}" wordmark`
      ];
      for (const query of searches) {
        try {
          const data = await mediaWikiRequest(COMMONS_API, {
            action: "query",
            generator: "search",
            gsrsearch: query,
            gsrnamespace: 6,
            gsrlimit: 10,
            prop: "imageinfo",
            iiprop: "url|mime|size|mediatype",
            iiurlwidth: 900
          }, signal);
          collectPages(data.query?.pages);
        } catch (error) {
          if (error.name === "AbortError") throw error;
          console.warn("Busca complementar de logo:", error.message);
        }
        if (found.size >= 7) break;
      }
      if (found.size >= 7) break;
    }

    if (commonsCategory) {
      try {
        const data = await mediaWikiRequest(COMMONS_API, {
          action: "query",
          generator: "categorymembers",
          gcmtitle: `Category:${commonsCategory}`,
          gcmtype: "file",
          gcmlimit: 30,
          prop: "imageinfo",
          iiprop: "url|mime|size|mediatype",
          iiurlwidth: 900
        }, signal);
        collectPages(data.query?.pages);
      } catch (error) {
        if (error.name === "AbortError") throw error;
        console.warn("Categoria de logos:", error.message);
      }
    }

    return [...found.values()].sort((a, b) => b.score - a.score).slice(0, 6);
  }

  async function searchWikipediaPages(queryVariants, signal) {
    const pagesByEntity = new Map();
    const plans = [];
    WIKIPEDIA_APIS.forEach((api) => {
      queryVariants.slice(0, 2).forEach((query, index) => plans.push({ ...api, query, rank: index }));
    });

    const responses = await Promise.allSettled(plans.map(async (plan) => {
      const data = await mediaWikiRequest(plan.endpoint, {
        action: "query",
        generator: "search",
        gsrsearch: plan.query,
        gsrnamespace: 0,
        gsrlimit: 8,
        prop: "pageprops|pageimages|extracts|info",
        ppprop: "wikibase_item",
        piprop: "thumbnail|name",
        pithumbsize: 900,
        exintro: 1,
        explaintext: 1,
        inprop: "url",
        redirects: 1
      }, signal);
      return { plan, pages: Object.values(data.query?.pages || {}) };
    }));

    responses.forEach((response) => {
      if (response.status !== "fulfilled") return;
      const { plan, pages } = response.value;
      pages.forEach((page) => {
        const entityId = page.pageprops?.wikibase_item;
        if (!entityId) return;
        const current = pagesByEntity.get(entityId);
        const entry = {
          entityId,
          pageTitle: page.title || "",
          pageUrl: safeRemoteUrl(page.fullurl),
          pageImageUrl: safeRemoteUrl(page.thumbnail?.source),
          pageImageName: page.pageimage || "",
          extract: String(page.extract || "").trim(),
          language: plan.language,
          rank: plan.rank
        };
        if (!current || entry.rank < current.rank || (entry.language === "pt" && current.language !== "pt")) pagesByEntity.set(entityId, entry);
      });
    });
    return pagesByEntity;
  }

  function entityIdClaims(entity, property) {
    return claimValues(entity, property)
      .map((value) => (typeof value === "object" ? value.id : ""))
      .filter(Boolean);
  }

  function parseSearchEntity(entity, meta, logoMap) {
    const logoFile = claimValue(entity, "P154");
    const colorClaim = claimValue(entity, "P465");
    const website = meta?.hint?.website || claimValue(entity, "P856") || "";
    const logoInfo = logoFile ? logoMap.get(fileTitleKey(logoFile)) : null;
    const name = localizedValue(entity.labels, meta?.searchItem?.label || meta?.wikiPage?.pageTitle || entity.id);
    const aliases = uniqueText([
      ...localizedAliases(entity.aliases),
      ...(meta?.hint?.aliases || []),
      meta?.wikiPage?.pageTitle || ""
    ]).filter((alias) => normalizeSearchText(alias) !== normalizeSearchText(name));
    const description = localizedValue(
      entity.descriptions,
      meta?.wikiPage?.extract?.split(/(?<=[.!?])\s+/)[0] || meta?.searchItem?.description || meta?.hint?.description || "Instituição de ensino"
    );
    const wikipediaImageLooksLikeLogo = LOGO_WORDS.test(meta?.wikiPage?.pageImageName || "");
    const instanceIds = entityIdClaims(entity, "P31");
    const countryIds = entityIdClaims(entity, "P17");
    return {
      entityId: entity.id,
      name,
      shortName: name,
      aliases,
      description,
      website: typeof website === "string" ? safeRemoteUrl(website) : "",
      logoUrl: logoInfo?.url || "",
      logoTitle: logoInfo?.title || (logoFile ? `File:${logoFile}` : ""),
      wikidataLogoUrl: logoInfo?.url || "",
      wikidataLogoTitle: logoInfo?.title || "",
      wikipediaLogoUrl: wikipediaImageLooksLikeLogo ? meta?.wikiPage?.pageImageUrl || "" : "",
      wikipediaLogoTitle: wikipediaImageLooksLikeLogo ? meta?.wikiPage?.pageImageName || "" : "",
      wikipediaUrl: meta?.wikiPage?.pageUrl || "",
      commonsCategory: String(claimValue(entity, "P373") || "").trim(),
      sourceUrl: `https://www.wikidata.org/wiki/${entity.id}`,
      claimedColor: normalizeHex(colorClaim, meta?.hint?.claimedColor || ""),
      instanceIds,
      countryIds,
      searchRank: meta?.rank ?? 20,
      isEducation: EDUCATION_WORDS.test(`${name} ${description}`),
      brandData: null,
      brandPalette: [...(meta?.hint?.palette || [])]
    };
  }

  function candidateMatchesQuery(candidate, query) {
    const target = normalizeSearchText(query);
    return [candidate.name, ...(candidate.aliases || [])].some((value) => normalizeSearchText(value) === target);
  }

  function scoreUniversityCandidate(candidate, query) {
    const normalizedQuery = normalizeSearchText(query);
    const queryTokens = searchTokens(query);
    const names = uniqueText([candidate.name, ...(candidate.aliases || [])]);
    let bestNameScore = 0;
    names.forEach((name) => {
      const normalizedName = normalizeSearchText(name);
      const nameTokens = searchTokens(name);
      const matchedTokens = queryTokens.filter((token) => nameTokens.some((nameToken) => nameToken === token || nameToken.includes(token) || token.includes(nameToken))).length;
      const coverage = queryTokens.length ? matchedTokens / queryTokens.length : 0;
      let score = coverage * 90;
      if (normalizedName === normalizedQuery) score += 180;
      else if (normalizedName.startsWith(normalizedQuery) || normalizedQuery.startsWith(normalizedName)) score += 95;
      else if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) score += 70;
      bestNameScore = Math.max(bestNameScore, score);
    });

    let score = bestNameScore;
    if (candidate.isEducation) score += 65;
    if (candidate.countryIds?.includes("Q155")) score += 22;
    if (candidate.website) score += 18;
    if (candidate.logoUrl) score += 10;
    if (candidate.wikipediaUrl) score += 8;
    score += Math.max(0, 12 - Number(candidate.searchRank || 0));
    if (!candidate.isEducation && /\b(person|pessoa|cidade|município|municipio|álbum|album|filme|empresa)\b/i.test(candidate.description || "")) score -= 90;
    return score;
  }

  function normalizeWebsiteForLookup(value) {
    const safe = safeRemoteUrl(value);
    if (!safe) return "";
    try {
      const url = new URL(safe);
      if (url.protocol === "http:") url.protocol = "https:";
      url.hash = "";
      return url.href;
    } catch {
      return safe;
    }
  }

  function collectHexColors(value, output = []) {
    if (typeof value === "string") {
      const matches = value.match(/#[0-9a-f]{6}\b/gi) || [];
      matches.forEach((color) => {
        const normalized = normalizeHex(color, "");
        if (normalized && !output.includes(normalized)) output.push(normalized);
      });
      return output;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => collectHexColors(item, output));
      return output;
    }
    if (value && typeof value === "object") Object.values(value).forEach((item) => collectHexColors(item, output));
    return output;
  }

  async function fetchWebsiteBrand(website, signal) {
    const normalizedWebsite = normalizeWebsiteForLookup(website);
    if (!normalizedWebsite) return null;
    let cacheKey = normalizedWebsite;
    try { cacheKey = new URL(normalizedWebsite).hostname.replace(/^www\./, ""); } catch { /* mantém URL */ }
    if (BRAND_LOOKUP_CACHE.has(cacheKey)) return BRAND_LOOKUP_CACHE.get(cacheKey);

    const endpoint = new URL(MICROLINK_API);
    endpoint.searchParams.set("url", normalizedWebsite);
    endpoint.searchParams.set("palette", "true");
    endpoint.searchParams.set("meta", "true");
    const payload = await jsonRequest(endpoint, signal, 18000);
    if (payload?.status && payload.status !== "success") throw new Error(payload.message || "Não foi possível consultar o site oficial.");
    const data = payload?.data || {};
    const logo = data.logo || {};
    const image = data.image || {};
    const logoUrl = safeRemoteUrl(logo.url);
    const imageUrl = safeRemoteUrl(image.url);
    const imageLooksLikeLogo = LOGO_WORDS.test(imageUrl) || (
      Number(image.width) > 0 && Number(image.height) > 0 && Number(image.width) / Number(image.height) >= .35 && Number(image.width) / Number(image.height) <= 3.2
    );
    const palette = collectHexColors(logo.palette || data.palette || (imageLooksLikeLogo ? image.palette : null)).slice(0, 8);
    const brand = {
      website: normalizeWebsiteForLookup(data.url || normalizedWebsite),
      logoUrl: logoUrl || (imageLooksLikeLogo && LOGO_WORDS.test(imageUrl) ? imageUrl : ""),
      logoTitle: "Logo localizado no site oficial",
      palette,
      title: String(data.title || data.publisher || "").trim(),
      description: String(data.description || "").trim(),
      source: "Site oficial"
    };
    BRAND_LOOKUP_CACHE.set(cacheKey, brand);
    return brand;
  }

  function websiteFallbackLogos(website) {
    const normalizedWebsite = normalizeWebsiteForLookup(website);
    if (!normalizedWebsite) return [];
    try {
      const url = new URL(normalizedWebsite);
      const hostname = url.hostname.replace(/^www\./, "");
      return [
        {
          title: "Símbolo do site oficial",
          url: `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url.origin)}&sz=256`,
          source: "Site oficial",
          palette: []
        },
        {
          title: "Ícone alternativo do site oficial",
          url: `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`,
          source: "Site oficial",
          palette: []
        }
      ];
    } catch {
      return [];
    }
  }

  async function enrichCandidatesWithOfficialBrand(candidates, signal) {
    const targets = candidates.filter((candidate) => candidate.website).slice(0, 2);
    await Promise.allSettled(targets.map(async (candidate) => {
      try {
        const brand = await fetchWebsiteBrand(candidate.website, signal);
        if (!brand) return;
        candidate.brandData = brand;
        candidate.brandPalette = uniqueText([...(candidate.brandPalette || []), ...(brand.palette || [])]);
        candidate.website = brand.website || candidate.website;
        if (brand.logoUrl) {
          candidate.logoUrl = brand.logoUrl;
          candidate.logoTitle = brand.logoTitle;
        }
        if (!candidate.claimedColor && brand.palette?.[0]) candidate.claimedColor = brand.palette[0];
        if ((!candidate.description || candidate.description === "Instituição de ensino") && brand.description) candidate.description = brand.description;
      } catch (error) {
        if (error.name === "AbortError") throw error;
        console.warn(`Identidade do site oficial (${candidate.name}):`, error.message);
      }
    }));
    if (signal?.aborted) throw new DOMException("Busca cancelada", "AbortError");
    return candidates;
  }

  async function searchUniversityEntities(query, signal) {
    const variants = buildSearchVariants(query);
    const hint = institutionHint(query);
    const searchById = new Map();
    const plans = [
      ...["pt-br", "pt", "en"].map((language) => ({ query: variants[0], language, rank: 0 })),
      ...variants.slice(1, 5).map((variant, index) => ({ query: variant, language: "pt", rank: index + 1 }))
    ];

    const searchResponses = await Promise.allSettled(plans.map(async (plan) => {
      const searchData = await mediaWikiRequest(WIKIDATA_API, {
        action: "wbsearchentities",
        search: plan.query,
        language: plan.language,
        uselang: "pt-br",
        type: "item",
        limit: 12
      }, signal);
      return { plan, items: searchData.search || [] };
    }));

    searchResponses.forEach((response) => {
      if (response.status !== "fulfilled") return;
      const { plan, items } = response.value;
      items.forEach((item, position) => {
        const current = searchById.get(item.id);
        const rank = plan.rank * 10 + position;
        if (!current || rank < current.rank) searchById.set(item.id, { searchItem: item, rank, hint: null, wikiPage: null });
      });
    });

    const wikipediaPages = await searchWikipediaPages(variants, signal);
    wikipediaPages.forEach((wikiPage, entityId) => {
      const current = searchById.get(entityId) || { searchItem: null, rank: 18, hint: null, wikiPage: null };
      current.wikiPage = wikiPage;
      current.rank = Math.min(current.rank, 6 + wikiPage.rank);
      searchById.set(entityId, current);
    });

    if (hint) {
      const exactEntry = [...searchById.entries()].find(([, meta]) => {
        const names = [meta.searchItem?.label, meta.wikiPage?.pageTitle].filter(Boolean);
        return names.some((name) => {
          const normalizedName = normalizeSearchText(name);
          return hint.keys.some((key) => {
            const normalizedKey = normalizeSearchText(key);
            return normalizedName === normalizedKey || normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName);
          }) || normalizedName === normalizeSearchText(hint.canonicalName);
        });
      });
      if (exactEntry) exactEntry[1].hint = hint;
    }

    const selectedEntries = [...searchById.entries()].sort((a, b) => a[1].rank - b[1].rank).slice(0, 24);
    if (!selectedEntries.length) {
      if (!hint) return [];
      return [{
        entityId: `hint-${Date.now()}`,
        name: hint.canonicalName,
        shortName: hint.canonicalName,
        aliases: hint.aliases || [],
        description: hint.description,
        website: hint.website,
        logoUrl: "",
        logoTitle: "",
        wikidataLogoUrl: "",
        wikidataLogoTitle: "",
        wikipediaLogoUrl: "",
        wikipediaLogoTitle: "",
        commonsCategory: "",
        sourceUrl: "",
        claimedColor: hint.claimedColor,
        instanceIds: [],
        countryIds: ["Q155"],
        searchRank: 0,
        isEducation: true,
        brandData: null,
        brandPalette: [...(hint.palette || [])]
      }];
    }

    const ids = selectedEntries.map(([id]) => id).join("|");
    const entityData = await mediaWikiRequest(WIKIDATA_API, {
      action: "wbgetentities",
      ids,
      props: "labels|descriptions|aliases|claims|sitelinks",
      languages: "pt-br|pt|en"
    }, signal);
    const entities = entityData.entities || {};
    const logos = selectedEntries.map(([id]) => claimValue(entities[id], "P154")).filter(Boolean);
    const logoMap = await resolveCommonsFiles(logos, signal);

    let candidates = selectedEntries
      .map(([id, meta]) => parseSearchEntity(entities[id] || { id }, meta, logoMap))
      .filter((candidate) => candidate.name)
      .map((candidate) => ({ ...candidate, relevance: scoreUniversityCandidate(candidate, query) }))
      .filter((candidate) => candidate.relevance >= 45 || candidate.isEducation)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 12);

    if (hint && !candidates.some((candidate) => candidateMatchesQuery(candidate, hint.canonicalName))) {
      candidates.unshift({
        entityId: `hint-${Date.now()}`,
        name: hint.canonicalName,
        shortName: hint.canonicalName,
        aliases: hint.aliases || [],
        description: hint.description,
        website: hint.website,
        logoUrl: "",
        logoTitle: "",
        wikidataLogoUrl: "",
        wikidataLogoTitle: "",
        wikipediaLogoUrl: "",
        wikipediaLogoTitle: "",
        commonsCategory: "",
        sourceUrl: "",
        claimedColor: hint.claimedColor,
        instanceIds: [],
        countryIds: ["Q155"],
        searchRank: 0,
        isEducation: true,
        brandData: null,
        brandPalette: [...(hint.palette || [])],
        relevance: 400
      });
    }

    candidates = await enrichCandidatesWithOfficialBrand(candidates, signal);
    return candidates.sort((a, b) => scoreUniversityCandidate(b, query) - scoreUniversityCandidate(a, query)).slice(0, 12);
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
    const selectedLogo = logoChoice || (candidate.logoUrl ? { url: candidate.logoUrl, title: candidate.logoTitle, palette: candidate.brandPalette || [] } : null);
    const paletteHint = uniqueText([
      ...(selectedLogo?.palette || []),
      ...(candidate.brandPalette || [])
    ]).map((color) => normalizeHex(color, "")).filter(Boolean);
    const extracted = selectedLogo?.url ? await extractLogoColors(selectedLogo.url) : [];
    const colorOptions = uniqueText([...paletteHint, ...extracted]).map((color) => normalizeHex(color, "")).filter(Boolean);
    const saturatedColors = colorOptions.filter((color) => {
      const rgb = hexToRgb(color);
      if (!rgb) return false;
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return hsl.s >= .22 && hsl.l >= .12 && hsl.l <= .82;
    });
    const primary = candidate.claimedColor || saturatedColors[0] || colorOptions[0] || deterministicColor(candidate.name);
    const accent = [...saturatedColors, ...colorOptions].find((color) => color !== primary && Math.abs(relativeLuminance(color) - relativeLuminance(primary)) > .07) || colorOptions[1] || "";
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
        image.onerror = () => {
          media.replaceChildren();
          media.textContent = initials(item.name).slice(0, 2);
        };
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
      const hasExactResult = universitySearchResults.some((item) => candidateMatchesQuery(item, query));
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
        ? `${universitySearchResults.length} opção(ões), ordenadas pela correspondência do nome e pelo site oficial.`
        : "A instituição foi localizada. Confira a identidade visual antes de aplicar.";
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
    const gentlePreview = createGentleVisualTheme(university.colors);
    els.universityMiniPreview.style.setProperty("--preview-primary", gentlePreview.brandPrimary);
    els.universityMiniPreview.style.setProperty("--preview-accent", gentlePreview.brandSecondary);
    els.universityMiniPreview.style.setProperty("--preview-bg", gentlePreview.background);
    els.universityMiniPreview.style.setProperty("--preview-card", gentlePreview.cardStart);
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
    els.universitySearchStatus.innerHTML = '<span class="search-spinner" aria-hidden="true"></span> Consultando o site oficial e preparando a identidade visual…';
    els.universityModalApplyButton.disabled = true;
    try {
      const base = { ...candidate };
      let brandData = candidate.brandData || null;
      if (!brandData && candidate.website) {
        try { brandData = await fetchWebsiteBrand(candidate.website, universitySearchController?.signal); }
        catch (error) {
          if (error.name === "AbortError") throw error;
          console.warn("Site oficial:", error.message);
        }
      }
      if (brandData) {
        base.brandData = brandData;
        base.brandPalette = uniqueText([...(base.brandPalette || []), ...(brandData.palette || [])]);
        base.website = brandData.website || base.website;
        if ((!base.description || base.description === "Instituição de ensino") && brandData.description) base.description = brandData.description;
      }

      const logoChoices = [];
      const addLogoChoice = (choice) => {
        const url = safeRemoteUrl(choice?.url);
        if (!url || logoChoices.some((item) => item.url === url)) return;
        logoChoices.push({
          title: choice.title || "Opção de logo",
          url,
          source: choice.source || "Fonte pública",
          palette: (choice.palette || []).map((color) => normalizeHex(color, "")).filter(Boolean)
        });
      };

      if (brandData?.logoUrl) addLogoChoice({
        title: brandData.logoTitle || "Logo do site oficial",
        url: brandData.logoUrl,
        source: "Site oficial",
        palette: brandData.palette || []
      });
      if (candidate.wikidataLogoUrl) addLogoChoice({
        title: candidate.wikidataLogoTitle || "Logo institucional",
        url: candidate.wikidataLogoUrl,
        source: "Wikidata",
        palette: []
      });
      if (candidate.wikipediaLogoUrl) addLogoChoice({
        title: candidate.wikipediaLogoTitle || "Logo da página institucional",
        url: candidate.wikipediaLogoUrl,
        source: "Wikipedia",
        palette: []
      });
      if (candidate.logoUrl) addLogoChoice({
        title: candidate.logoTitle || "Logo institucional",
        url: candidate.logoUrl,
        source: candidate.brandData?.logoUrl === candidate.logoUrl ? "Site oficial" : "Fonte pública",
        palette: candidate.brandPalette || []
      });

      const extraChoices = await searchCommonsLogos(
        candidate.name,
        candidate.aliases || [],
        candidate.commonsCategory || "",
        universitySearchController?.signal
      );
      extraChoices.forEach(addLogoChoice);
      websiteFallbackLogos(base.website).forEach(addLogoChoice);

      const limitedChoices = logoChoices.slice(0, 7);
      const selectedLogo = limitedChoices[0] || null;
      const theme = await createUniversityTheme(base, selectedLogo);
      universityPreviewCandidate = { base, logoChoices: limitedChoices, selectedLogo, theme };
      if (brandData?.logoUrl) {
        els.universitySearchStatus.textContent = "Identidade localizada no site oficial. Confira o logo e as cores antes de aplicar.";
      } else if (limitedChoices.length) {
        els.universitySearchStatus.textContent = "Confira as opções de logo e a prévia antes de aplicar.";
      } else {
        els.universitySearchStatus.textContent = "Não foi encontrado um logo público confiável. Será usado um símbolo com as iniciais.";
      }
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
