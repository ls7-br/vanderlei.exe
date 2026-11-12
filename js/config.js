/* =========================================================
   CONFIGURAÇÃO DO SITE: o único arquivo que você precisa mexer
   ========================================================= */
window.VAND_CONFIG = {
  // 1) URL do App da Web do Google Apps Script (termina em /exec). Passo a passo no README.md.
  //    Vazio = as respostas ficam só no navegador (localStorage).
  GOOGLE_SCRIPT_URL: "",

  // 2) Instagram do candidato
  INSTAGRAM_USER: "vand2017",
  INSTAGRAM_URL: "https://www.instagram.com/vand2017",

  // 3) Fotos. Cada foto existe em duas larguras na pasta /img: nome-480.webp e nome-900.webp.
  //    Informe só o "nome" (sem tamanho e sem extensão). Foto que não existir não quebra nada.

  // Foto que aparece desfocada no loading e é revelada no final, estilo trailer.
  ABERTURA_FOTO: "img/vand-jacuzzi",
  // Foto redonda do card do Instagram (arquivo único).
  AVATAR_FOTO: "img/vand-avatar.webp",

  // Fotos que se revezam na moldura dourada do topo. "icone" é um ícone da biblioteca Lucide.
  RETRATO: [
    { foto: "img/vand-carro", selo: "Motorista particular do seu coração", icone: "car", pos: "45% 30%" },
    { foto: "img/vand-jacuzzi", selo: "Modo sommelier de jacuzzi", icone: "wine", pos: "40% 30%" },
    { foto: "img/vand-alpinista", selo: "Modo aventureiro radical", icone: "mountain", pos: "50% 20%" },
    { foto: "img/vand-bombeiro", selo: "Plantão 24h no seu coração", icone: "siren", pos: "50% 20%" }
  ],

  // Polaroids da galeria "Ensaio sensual involuntário".
  FOTOS: [
    { foto: "img/vand-carro", legenda: "Terno, óculos escuros e teto solar. Não é motorista de aplicativo, mas aceita corrida até o seu coração." },
    { foto: "img/vand-jacuzzi", legenda: "Charuto, vinho e jacuzzi: o famoso 'tô de boa' versão premium." },
    { foto: "img/vand-alpinista", legenda: "Escalou a montanha só pra ter sinal e responder seu direct (mentira)." },
    { foto: "img/vand-bombeiro", legenda: "Chamou o 193? Chegou o 1-9-LINDO." }
  ],

  // Fotos SECRETAS: só aparecem depois do código secreto (o cofre do rodapé).
  // Quando a foto ainda não existir, o espaço mostra o texto de "em produção".
  SECRETAS: [
    {
      foto: "img/vand-bombeiro-sem-camisa",
      titulo: "Desbloqueado: Bombeiro Sheipado",
      legenda: "Ele não apaga incêndio. Ele começa. Recomendamos ter um extintor por perto antes de ampliar.",
      emBreve: ""
    },
    {
      foto: "img/vand-sr-burns",
      titulo: "Desbloqueado: Vanderlei e o Sr. Burns",
      legenda: "Prova científica de que ele tem senso de humor: o único homem que tira foto com o Sr. Burns e ainda sai como o mais charmoso. Excelente.",
      emBreve: "Em produção: o Sr. Burns ainda está negociando o cachê."
    }
  ],

  // 4) Vídeo do scroll: quadros extraídos do vídeo (ver README). Total de quadros em cada pasta.
  CINEMA: { pastaGrande: "img/frames/lg/", pastaPequena: "img/frames/sm/", quadros: 95 },

  // 5) Opcional: links de posts PÚBLICOS do Instagram para embed oficial.
  POSTS_INSTAGRAM: []
};
