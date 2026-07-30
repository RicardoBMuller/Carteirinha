/**
 * Este projeto reutiliza o config.js público do Portal FCC.
 * O index.html carrega primeiro:
 * https://ricardobmuller.github.io/Portal-FCC/config.js
 *
 * Assim, o Portal de Carteirinhas utiliza o MESMO Supabase e o MESMO
 * login Google já configurado no projeto calculadora-fcc.
 *
 * Fallback: para testar sem acesso ao Portal FCC, preencha os dois campos
 * abaixo com os mesmos valores do config.js que já funciona.
 */
(() => {
  "use strict";

  const shared = window.FCC_CONFIG || {};
  const fallback = {
    SUPABASE_URL: "https://fxkjikfurlvfftpncunp.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_tla6br_lPVuEPBgsMFEDCw_58Pp-7jA"
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