(() => {
  "use strict";

  const TABLE_NAME = "fcc_student_cards";
  const STORAGE_BUCKET = "fcc-student-card-photos";
  const UNIVERSITY = "Cruzeiro do Sul Virtual";

  const DEFAULT_CARD = Object.freeze({
    studentName: "Aluno(a) Exemplo",
    course: "Neuropsicologia",
    registration: "00000000-0",
    validUntil: "12/2029",
    university: UNIVERSITY,
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
    cardStudentName: document.getElementById("cardStudentName"),
    cardCourseName: document.getElementById("cardCourseName"),
    cardRegistration: document.getElementById("cardRegistration"),
    cardValidUntil: document.getElementById("cardValidUntil"),
    cardDocumentNumber: document.getElementById("cardDocumentNumber"),
    studentPhoto: document.getElementById("studentPhoto"),
    studentInitial: document.getElementById("studentInitial"),
    profileForm: document.getElementById("profileForm"),
    studentNameInput: document.getElementById("studentNameInput"),
    courseInput: document.getElementById("courseInput"),
    registrationInput: document.getElementById("registrationInput"),
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
    toast: document.getElementById("toast")
  };

  let supabaseClient = null;
  let currentUser = null;
  let isDemo = false;
  let currentView = "courses";
  let cardData = { ...DEFAULT_CARD };
  let toastTimer = null;

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
    els.storageMode.textContent = isDemo ? "Neste navegador" : "Supabase calculadora-fcc";
    els.syncBadge.textContent = isDemo ? "Local" : "Sincronizado";
  }

  function fillProfileForm() {
    els.studentNameInput.value = cardData.studentName;
    els.courseInput.value = cardData.course;
    els.registrationInput.value = cardData.registration;
    els.validUntilInput.value = cardData.validUntil;
  }

  function renderCard() {
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
      university: UNIVERSITY,
      photoPath: cardData.photoPath || "",
      localPhoto: cardData.localPhoto || ""
    }));
  }

  function loadLocal() {
    try {
      const saved = JSON.parse(localStorage.getItem(localKey()) || "null");
      cardData = saved && typeof saved === "object"
        ? { ...DEFAULT_CARD, ...saved, university: UNIVERSITY, photoUrl: "" }
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
      showToast("Execute o SQL do ZIP no mesmo Supabase do Portal FCC.");
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
      university: UNIVERSITY,
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
      university: UNIVERSITY,
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
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.readAsDataURL(file);
    });
  }

  function extensionFromFile(file) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "webp"].includes(ext)) return ext === "jpeg" ? "jpg" : ext;
    if (file.type === "image/png") return "png";
    if (file.type === "image/webp") return "webp";
    return "jpg";
  }

  async function handlePhotoUpload(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Selecione uma foto válida.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("A foto deve ter no máximo 5 MB.");
      return;
    }

    try {
      if (isDemo || !supabaseClient || !currentUser) {
        cardData.localPhoto = await fileToDataUrl(file);
        cardData.photoPath = "";
        cardData.photoUrl = "";
        await persistCard("Foto adicionada à carteirinha.");
        return;
      }

      showToast("Enviando a foto…");
      const path = `${currentUser.id}/student-photo.${extensionFromFile(file)}`;
      const { error: uploadError } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600"
        });

      if (uploadError) throw uploadError;

      cardData.photoPath = path;
      cardData.photoUrl = await createPhotoSignedUrl(path);
      cardData.localPhoto = "";
      await persistCard("Foto atualizada com segurança.");
    } catch (error) {
      console.error(error);
      showToast("Falha ao enviar. Execute o SQL e confira o Storage.");
    } finally {
      els.studentPhotoInput.value = "";
    }
  }

  async function removePhoto() {
    try {
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
      showToast("Não foi possível ler a configuração do Portal FCC.");
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
    cardData = { ...DEFAULT_CARD };
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
    els.studentPhotoInput.addEventListener("change", () => handlePhotoUpload(els.studentPhotoInput.files?.[0]));
    els.removePhotoButton.addEventListener("click", removePhoto);

    els.validUntilInput.addEventListener("input", () => {
      els.validUntilInput.value = normalizeValidity(els.validUntilInput.value);
    });

    els.profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      cardData.studentName = els.studentNameInput.value.trim();
      cardData.course = els.courseInput.value.trim();
      cardData.registration = els.registrationInput.value.trim();
      cardData.validUntil = els.validUntilInput.value.trim();
      cardData.university = UNIVERSITY;
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
      script.onerror = () => reject(new Error("Falha ao carregar a biblioteca Supabase."));
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
      ? "Conectado ao mesmo Supabase do Portal FCC."
      : "Conectado pela configuração local de fallback.";

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
