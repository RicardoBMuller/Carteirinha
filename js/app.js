(() => {
  "use strict";

  const DEFAULT_CARD = {
    studentName: "Aluno(a) Exemplo",
    course: "Neuropsicologia",
    validUntil: "12/2029",
    university: "Cruzeiro do Sul Virtual",
    imagePath: "",
    localImage: ""
  };

  const VIEW_TITLES = {
    courses: "Minha vida universitária",
    activities: "Prazos e atividades",
    card: "Carteirinha virtual",
    questions: "Central de dúvidas",
    profile: "Minha conta"
  };

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
    editButtons: [...document.querySelectorAll("[data-open-edit]")],
    editModal: document.getElementById("editModal"),
    closeEditModal: document.getElementById("closeEditModal"),
    cardForm: document.getElementById("cardForm"),
    studentNameInput: document.getElementById("studentNameInput"),
    courseInput: document.getElementById("courseInput"),
    validUntilInput: document.getElementById("validUntilInput"),
    universityInput: document.getElementById("universityInput"),
    cardImageInput: document.getElementById("cardImageInput"),
    removeImageButton: document.getElementById("removeImageButton"),
    uploadedCardImage: document.getElementById("uploadedCardImage"),
    studentCard: document.getElementById("studentCard"),
    cardStudentName: document.getElementById("cardStudentName"),
    cardCourseName: document.getElementById("cardCourseName"),
    cardValidUntil: document.getElementById("cardValidUntil"),
    cardUniversity: document.getElementById("cardUniversity"),
    studentInitial: document.getElementById("studentInitial"),
    courseNameLabel: document.getElementById("courseNameLabel"),
    courseUniversityLabel: document.getElementById("courseUniversityLabel"),
    profileUniversity: document.getElementById("profileUniversity"),
    navAvatar: document.getElementById("navAvatar"),
    profileAvatarLarge: document.getElementById("profileAvatarLarge"),
    profileName: document.getElementById("profileName"),
    profileEmail: document.getElementById("profileEmail"),
    storageMode: document.getElementById("storageMode"),
    logoutButton: document.getElementById("logoutButton"),
    toast: document.getElementById("toast")
  };

  let supabaseClient = null;
  let currentUser = null;
  let isDemo = false;
  let currentView = "courses";
  let cardData = { ...DEFAULT_CARD };
  let toastTimer = null;

  function hasSupabaseConfig() {
    const config = window.PORTAL_CONFIG || {};
    return Boolean(
      config.SUPABASE_URL &&
      config.SUPABASE_ANON_KEY &&
      !config.SUPABASE_URL.includes("COLE") &&
      !config.SUPABASE_ANON_KEY.includes("COLE")
    );
  }

  function localKey() {
    return `portal-academico:${isDemo ? "demo" : currentUser?.id || "guest"}`;
  }

  function initials(name) {
    return String(name || "Aluno")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "A";
  }

  function escapeCssUrl(url) {
    return String(url || "").replace(/["'()\\]/g, "");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      els.toast.hidden = true;
    }, 2900);
  }

  function setAvatar(element, avatarUrl, fallbackText) {
    if (!element) return;
    if (avatarUrl) {
      element.textContent = "";
      element.style.backgroundImage = `url("${escapeCssUrl(avatarUrl)}")`;
    } else {
      element.style.backgroundImage = "";
      element.textContent = fallbackText;
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
    els.storageMode.textContent = isDemo ? "Neste navegador" : "Supabase privado";
  }

  function renderCard() {
    const universityDisplay = cardData.university.replace(/\s+Virtual$/i, "").trim() || cardData.university;
    els.cardStudentName.textContent = cardData.studentName;
    els.cardCourseName.textContent = cardData.course;
    els.cardValidUntil.textContent = cardData.validUntil;
    els.cardUniversity.textContent = universityDisplay;
    els.studentInitial.textContent = initials(cardData.studentName).slice(0, 1);
    els.courseNameLabel.textContent = cardData.course;
    els.courseUniversityLabel.textContent = cardData.university;
    els.profileUniversity.textContent = cardData.university;

    const imageSource = cardData.imageUrl || cardData.localImage || "";
    if (imageSource) {
      els.uploadedCardImage.src = imageSource;
      els.uploadedCardImage.hidden = false;
      els.studentCard.classList.add("has-upload");
      els.removeImageButton.hidden = false;
    } else {
      els.uploadedCardImage.removeAttribute("src");
      els.uploadedCardImage.hidden = true;
      els.studentCard.classList.remove("has-upload");
      els.removeImageButton.hidden = true;
    }
  }

  function openEditModal() {
    els.studentNameInput.value = cardData.studentName;
    els.courseInput.value = cardData.course;
    els.validUntilInput.value = cardData.validUntil;
    els.universityInput.value = cardData.university;
    els.editModal.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => els.studentNameInput.focus(), 120);
  }

  function closeEditModal() {
    els.editModal.hidden = true;
    document.body.style.overflow = "";
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
      item.classList.toggle("active", item.dataset.viewTarget === viewName);
      item.setAttribute("aria-current", item.dataset.viewTarget === viewName ? "page" : "false");
    });

    els.headerSubtitle.textContent = VIEW_TITLES[viewName];
    els.backButton.hidden = viewName === "courses";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveLocal() {
    const localCopy = {
      studentName: cardData.studentName,
      course: cardData.course,
      validUntil: cardData.validUntil,
      university: cardData.university,
      imagePath: cardData.imagePath || "",
      localImage: cardData.localImage || ""
    };
    localStorage.setItem(localKey(), JSON.stringify(localCopy));
  }

  function loadLocal() {
    try {
      const value = JSON.parse(localStorage.getItem(localKey()) || "null");
      if (value && typeof value === "object") {
        cardData = { ...DEFAULT_CARD, ...value };
      } else {
        cardData = { ...DEFAULT_CARD };
      }
    } catch {
      cardData = { ...DEFAULT_CARD };
    }
  }

  async function loadRemote() {
    if (!supabaseClient || !currentUser || isDemo) return;

    const { data, error } = await supabaseClient
      .from("student_cards")
      .select("student_name, course_name, valid_until, university, image_path")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.warn("Não foi possível carregar os dados remotos:", error.message);
      showToast("Usando os dados salvos neste navegador.");
      return;
    }

    if (data) {
      cardData = {
        ...cardData,
        studentName: data.student_name || DEFAULT_CARD.studentName,
        course: data.course_name || DEFAULT_CARD.course,
        validUntil: data.valid_until || DEFAULT_CARD.validUntil,
        university: data.university || DEFAULT_CARD.university,
        imagePath: data.image_path || "",
        localImage: ""
      };

      if (cardData.imagePath) {
        const { data: signed, error: signError } = await supabaseClient.storage
          .from("student-cards")
          .createSignedUrl(cardData.imagePath, 60 * 60 * 24);

        if (!signError && signed?.signedUrl) {
          cardData.imageUrl = signed.signedUrl;
        }
      }
    } else {
      await saveRemote();
    }
  }

  async function saveRemote() {
    if (!supabaseClient || !currentUser || isDemo) return true;

    const payload = {
      user_id: currentUser.id,
      student_name: cardData.studentName,
      course_name: cardData.course,
      valid_until: cardData.validUntil,
      university: cardData.university,
      image_path: cardData.imagePath || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from("student_cards")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.error(error);
      showToast("Não foi possível sincronizar. Os dados foram mantidos localmente.");
      return false;
    }
    return true;
  }

  async function persistCard(message = "Alterações salvas.") {
    saveLocal();
    const synced = await saveRemote();
    renderCard();
    showToast(synced || isDemo ? message : "Dados salvos somente neste navegador.");
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
    const nameExtension = file.name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "webp"].includes(nameExtension)) {
      return nameExtension === "jpeg" ? "jpg" : nameExtension;
    }
    return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  }

  async function handleImageUpload(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Selecione uma imagem válida.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast("A imagem deve ter no máximo 8 MB.");
      return;
    }

    try {
      if (isDemo || !supabaseClient || !currentUser) {
        cardData.localImage = await fileToDataUrl(file);
        cardData.imagePath = "";
        cardData.imageUrl = "";
        await persistCard("Foto adicionada à carteirinha.");
        return;
      }

      showToast("Enviando imagem com segurança...");
      const extension = extensionFromFile(file);
      const path = `${currentUser.id}/card-background.${extension}`;
      const { error: uploadError } = await supabaseClient.storage
        .from("student-cards")
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

      if (uploadError) throw uploadError;

      const { data: signed, error: signError } = await supabaseClient.storage
        .from("student-cards")
        .createSignedUrl(path, 60 * 60 * 24);

      if (signError) throw signError;

      cardData.imagePath = path;
      cardData.imageUrl = signed?.signedUrl || "";
      cardData.localImage = "";
      await persistCard("Foto enviada e protegida na sua conta.");
    } catch (error) {
      console.error(error);
      showToast("Falha ao enviar a imagem. Confira a configuração do Storage.");
    } finally {
      els.cardImageInput.value = "";
    }
  }

  async function removeImage() {
    try {
      if (!isDemo && supabaseClient && currentUser && cardData.imagePath) {
        const { error } = await supabaseClient.storage
          .from("student-cards")
          .remove([cardData.imagePath]);
        if (error) throw error;
      }
      cardData.imagePath = "";
      cardData.imageUrl = "";
      cardData.localImage = "";
      await persistCard("Foto removida. O template original voltou a ser exibido.");
    } catch (error) {
      console.error(error);
      showToast("Não foi possível remover a imagem agora.");
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
      showToast("Preencha as chaves do Supabase em js/config.js.");
      return;
    }

    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { access_type: "offline", prompt: "consent" }
      }
    });

    if (error) showToast(`Falha no login: ${error.message}`);
  }

  async function logout() {
    if (!isDemo && supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    currentUser = null;
    isDemo = false;
    cardData = { ...DEFAULT_CARD };
    showAuth();
  }

  function bindEvents() {
    els.navItems.forEach((item) => item.addEventListener("click", () => navigate(item.dataset.viewTarget)));
    els.goButtons.forEach((item) => item.addEventListener("click", () => navigate(item.dataset.go)));
    els.editButtons.forEach((item) => item.addEventListener("click", openEditModal));
    els.backButton.addEventListener("click", () => navigate("courses"));
    els.closeEditModal.addEventListener("click", closeEditModal);
    els.editModal.addEventListener("click", (event) => {
      if (event.target === els.editModal) closeEditModal();
    });

    els.cardForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      cardData.studentName = els.studentNameInput.value.trim();
      cardData.course = els.courseInput.value.trim();
      cardData.validUntil = els.validUntilInput.value.trim();
      cardData.university = els.universityInput.value.trim();
      closeEditModal();
      await persistCard();
    });

    els.cardImageInput.addEventListener("change", () => handleImageUpload(els.cardImageInput.files?.[0]));
    els.removeImageButton.addEventListener("click", removeImage);
    els.googleLoginButton.addEventListener("click", signInWithGoogle);
    els.demoLoginButton.addEventListener("click", () => enterSession({ id: "demo", email: "modo@demonstracao.local", user_metadata: {} }, true));
    els.logoutButton.addEventListener("click", logout);
    els.notificationButton.addEventListener("click", () => showToast("Nenhuma nova notificação no momento."));

    document.querySelectorAll(".round-check").forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("checked");
        button.closest(".activity-item")?.classList.toggle("completed", button.classList.contains("checked"));
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.editModal.hidden) closeEditModal();
    });
  }


  function loadExternalScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Falha ao carregar biblioteca externa."));
      document.head.appendChild(script);
    });
  }

  async function initSupabase() {
    if (!hasSupabaseConfig()) {
      els.authHint.innerHTML = 'O login Google será ativado ao preencher o arquivo <code>js/config.js</code>.';
      return;
    }

    if (!window.supabase?.createClient) {
      try {
        await loadExternalScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
      } catch (error) {
        console.error(error);
        els.authHint.textContent = "Não foi possível carregar a biblioteca de autenticação.";
        return;
      }
    }

    const config = window.PORTAL_CONFIG;
    supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true }
    });
    els.authHint.textContent = "Login Google conectado ao Supabase.";

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
    els.appShell.hidden = true;
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
