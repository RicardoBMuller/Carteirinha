/**
 * Configuração de acesso compartilhada.
 * O arquivo externo é carregado pelo index.html e o bloco de fallback
 * abaixo pode ser preenchido somente para testes locais.
 */
(() => {
  "use strict";

  const shared = window.FCC_CONFIG || {};
  const fallback = {
    SUPABASE_URL: "",
    SUPABASE_PUBLISHABLE_KEY: ""
  };

  window.PORTAL_CONFIG = Object.freeze({
    SUPABASE_URL: shared.SUPABASE_URL || fallback.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY:
      shared.SUPABASE_PUBLISHABLE_KEY ||
      shared.SUPABASE_ANON_KEY ||
      fallback.SUPABASE_PUBLISHABLE_KEY,
    USING_SHARED_FCC_CONFIG: Boolean(shared.SUPABASE_URL)
  });
})();
