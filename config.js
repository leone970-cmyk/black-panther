// Black Panther — configuração do site publicado.
// Preencha só a URL do projeto Supabase (Project Settings → Data API → Project URL).
// A chave pública o app busca sozinho na função coach-admin. Nunca coloque aqui a chave secreta (sb_secret_...) nem a service_role.
window.COACH_RX_CONFIG = {
  url: "https://yijsgmunsqlqnvbincsy.supabase.co",
  publicKey: "",  // pode ficar vazio
  integrationsEnabled: true   // conexão do Strava pelo servidor (função athlete-integrations)
};
