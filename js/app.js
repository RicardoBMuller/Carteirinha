(() => {
  "use strict";

  const TABLE_NAME = "fcc_student_cards";
  const STORAGE_BUCKET = "fcc-student-card-photos";
  const DEFAULT_UNIVERSITY = "cruzeiro";
  const CROP_OUTPUT_SIZE = 900;
  const UNIVERSITIES = Object.freeze({
    cruzeiro: Object.freeze({
      name: "Cruzeiro do Sul Virtual",
      shortName: "Cruzeiro do Sul",
      logo: "assets/brands/cruzeiro.svg",
      themeColor: "#eef8ff",
      footer: "CRUZEIRO DO SUL · PÓS-EAD"
    }),
    unibf: Object.freeze({
      name: "UniBF",
      shortName: "UniBF",
      logo: "assets/brands/unibf.svg",
      themeColor: "#eef6f5",
      footer: "UNIBF · CENTRO UNIVERSITÁRIO"
    }),
    uninter: Object.freeze({
      name: "UNINTER",
      shortName: "UNINTER",
      logo: "assets/brands/uninter.svg",
      themeColor: "#f5f7fb",
      footer: "CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER"
    }),
    sumare: Object.freeze({
      name: "Sumaré EAD",
      shortName: "Sumaré",
      logo: "assets/brands/sumare.svg",
      themeColor: "#f1f5f7",
      footer: "CENTRO UNIVERSITÁRIO SUMARÉ · EAD"
    }),
    unicesumar: Object.freeze({
      name: "UniCesumar",
      shortName: "UniCesumar",
      logo: "assets/brands/unicesumar.svg",
      themeColor: "#f1f8fb",
      footer: "UNICESUMAR · EDUCAÇÃO A DISTÂNCIA"
    })
  });

  const DEFAULT_CARD = Object.freeze({
    studentName: "Aluno(a) Exemplo",
    course: "Neuropsicologia",
    registration: "00000000-0",
    validUntil: "12/2029",
    university: DEFAULT_UNIVERSITY,
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
    demoLoginButton: document.getElementById("demoLoginButton"),
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
    universitySelect: document.getElementById("universitySelect"),
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
    toast: document.getElementById("toast")
  };

  let supabaseClient = null;
  let currentUser = null;
  let isDemo = false;
  let currentView = "courses";
  let cardData = { ...DEFAULT_CARD };
  let toastTimer = null;
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
    return `portal-carteirinhas-v2:${isDemo ? "demo" : currentUser?.id || "guest"}`;
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

  function normalizeUniversity(value) {
    const candidate = String(value || "").trim();
    if (UNIVERSITIES[candidate]) return candidate;
    const byName = Object.entries(UNIVERSITIES).find(([, item]) => item.name.toLowerCase() === candidate.toLowerCase());
    return byName?.[0] || DEFAULT_UNIVERSITY;
  }

  function currentUniversity() {
    return UNIVERSITIES[normalizeUniversity(cardData.university)];
  }

  function applyUniversityTheme(universityKey, remember = true) {
    const key = normalizeUniversity(universityKey);
    const university = UNIVERSITIES[key];
    cardData.university = key;
    document.documentElement.dataset.university = key;
    if (els.themeColorMeta) els.themeColorMeta.content = university.themeColor;
    if (els.headerUniversityLogo) els.headerUniversityLogo.src = university.logo;
    if (els.authUniversityLogo) els.authUniversityLogo.src = university.logo;
    if (els.cardUniversityLogo) {
      els.cardUniversityLogo.src = university.logo;
      els.cardUniversityLogo.alt = university.name;
    }
    if (els.courseUniversityLabel) els.courseUniversityLabel.textContent = university.name;
    if (els.cardInstitutionLabel) els.cardInstitutionLabel.textContent = university.footer;
    document.title = `Portal Acadêmico · ${university.shortName}`;
    if (remember) localStorage.setItem("portal-carteirinhas:last-university", key);
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
    const displayName = isDemo
      ? "Modo demonstração"
      : metadata.full_name || metadata.name || currentUser?.email?.split("@")[0] || "Estudante";
    const email = isDemo ? "modo@demonstracao.local" : currentUser?.email || "";
    const avatarUrl = isDemo ? "" : metadata.avatar_url || metadata.picture || "";
    const fallback = initials(displayName);

    setAvatar(els.navAvatar, avatarUrl, fallback);
    setAvatar(els.profileAvatarLarge, avatarUrl, fallback);
    els.profileName.textContent = displayName;
    els.profileEmail.textContent = email;
    els.storageMode.textContent = isDemo ? "Neste navegador" : "Conta online";
    els.syncBadge.textContent = isDemo ? "Local" : "Sincronizado";
  }

  function fillProfileForm() {
    els.universitySelect.value = normalizeUniversity(cardData.university);
    els.studentNameInput.value = cardData.studentName;
    els.courseInput.value = cardData.course;
    els.registrationInput.value = cardData.registration;
    els.validUntilInput.value = cardData.validUntil;
  }

  function syncCardDataFromProfileForm() {
    const university = normalizeUniversity(els.universitySelect.value);
    const studentName = els.studentNameInput.value.trim();
    const course = els.courseInput.value.trim();
    const registration = els.registrationInput.value.trim();
    const validUntil = els.validUntilInput.value.trim();

    if (studentName) cardData.studentName = studentName;
    if (course) cardData.course = course;
    if (registration) cardData.registration = registration;
    if (validUntil) cardData.validUntil = validUntil;
    cardData.university = university;
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
        : { ...DEFAULT_CARD };
    } catch {
      cardData = { ...DEFAULT_CARD };
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

  async function loadRemote() {
    if (!supabaseClient || !currentUser || isDemo) return;

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select("student_name, course_name, registration_number, valid_until, university, photo_path")
      .eq("user_id", currentUser.id)
      .maybeSingle();

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
      university: normalizeUniversity(data.university),
      photoPath: data.photo_path || "",
      localPhoto: "",
      photoUrl: ""
    };

    if (cardData.photoPath) {
      cardData.photoUrl = await createPhotoSignedUrl(cardData.photoPath);
    }
  }

  async function saveRemote() {
    if (!supabaseClient || !currentUser || isDemo) return true;

    const payload = {
      user_id: currentUser.id,
      student_name: cardData.studentName,
      course_name: cardData.course,
      registration_number: cardData.registration,
      valid_until: cardData.validUntil,
      university: normalizeUniversity(cardData.university),
      photo_path: cardData.photoPath || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from(TABLE_NAME)
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.error(error);
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
    showToast(synced || isDemo ? successMessage : "Salvo somente neste navegador.");
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

    if (isDemo || !supabaseClient || !currentUser) {
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
      if (!isDemo && supabaseClient && currentUser && cardData.photoPath) {
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
    els.authScreen.hidden = false;
    els.appShell.hidden = true;
  }

  async function enterSession(user, demo = false) {
    currentUser = user;
    isDemo = demo;
    loadLocal();
    if (!demo) await loadRemote();
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
    if (!isDemo && supabaseClient) await supabaseClient.auth.signOut();
    currentUser = null;
    isDemo = false;
    const rememberedUniversity = normalizeUniversity(localStorage.getItem("portal-carteirinhas:last-university"));
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
    els.demoLoginButton.addEventListener("click", () => enterSession({ id: "demo", email: "modo@demonstracao.local", user_metadata: {} }, true));
    els.logoutButton.addEventListener("click", logout);
    els.universitySelect.addEventListener("change", () => {
      cardData.university = normalizeUniversity(els.universitySelect.value);
      applyUniversityTheme(cardData.university);
      showToast(`Identidade visual alterada para ${currentUniversity().name}. Salve para confirmar.`);
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
      if (event.key === "Escape" && !els.cropModal.hidden) closeCropModal();
    });

    els.validUntilInput.addEventListener("input", () => {
      els.validUntilInput.value = normalizeValidity(els.validUntilInput.value);
    });

    els.profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      cardData.university = normalizeUniversity(els.universitySelect.value);
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
    if (session?.user) await enterSession(session.user, false);

    supabaseClient.auth.onAuthStateChange((event, sessionData) => {
      if (event === "SIGNED_IN" && sessionData?.user && currentUser?.id !== sessionData.user.id) {
        enterSession(sessionData.user, false);
      }
      if (event === "SIGNED_OUT") showAuth();
    });
  }

  async function init() {
    const rememberedUniversity = normalizeUniversity(localStorage.getItem("portal-carteirinhas:last-university"));
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
