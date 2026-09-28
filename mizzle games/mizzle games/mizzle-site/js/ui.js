/* =========================================================
   Mizzle — componentes de interface reutilizáveis
   ========================================================= */

const UI = (() => {
  const CONFETTI_COLORS = ["#ff9393", "#c7b8fe", "#b3fbad", "#93b5ff", "#feb8e9", "#b8e3fe", "#ffa3e8", "#a5fdeb", "#b6f6b6", "#f6b599"];

  function renderHeader({ activeAge = null, showAgeNav = true } = {}) {
    const host = document.getElementById("site-header");
    if (!host) return;

    const ages = [
      { value: "3-5", label: "Jogos 3–5" },
      { value: "6-8", label: "Jogos 6–8" },
      { value: "9-12", label: "Jogos 9–12" },
    ];

    // Verifica a sessão unificada (mizzle_user ou Store.getSession)
    const storedUser = localStorage.getItem('mizzle_user') || localStorage.getItem('usuario_logado');
    const session = storedUser ? JSON.parse(storedUser) : (typeof Store !== 'undefined' && Store.getSession ? Store.getSession() : null);

    const userAvatar = localStorage.getItem('userAvatar');
    
    // Define a imagem do perfil (preenchendo 100% do botão)
    const avatarImgHtml = userAvatar 
      ? `<img src="${userAvatar}" alt="Perfil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;">`
      : `<img src="imagens mizzle/pessoa.png" alt="Perfil" style="width: 24px; height: 24px; vertical-align: middle;">`;

    host.innerHTML = `
      <div class="header-top">
        <a class="logo" href="index.html" aria-label="Início">
          <img src="imagens mizzle/logomizzle.png" alt="Logo da Loja" style="height: 130px;">
        </a>
        <button class="btn-support" type="button" onclick="location.href='suporte.html'">SUPORTE</button>
        <form class="search-form" role="search" onsubmit="return UI.handleSearch(event)">
          <input type="search" name="q" placeholder="Pesquisar..." aria-label="Pesquisar jogos" />
          <button type="submit" aria-label="Buscar">
            <img src="imagens mizzle/lupa.png" alt="Buscar" style="width: 18px; height: 18px; vertical-align: middle;">
          </button>
        </form>
        <div class="header-actions">
          <button class="icon-btn" type="button" title="Carrinho" onclick="location.href='carrinho.html'">
            <img src="imagens mizzle/carrinho-de-compras.png" alt="Carrinho" style="width: 24px; height: 24px; vertical-align: middle;">
            <span class="cart-badge" data-cart-badge>0</span>
          </button>
          <button class="icon-btn" type="button" style="padding: 0; overflow: hidden;" title="${session ? "Minha conta" : "Entrar"}" onclick="location.href='${session ? "conta.html" : "login.html"}'">
            ${avatarImgHtml}
          </button>
        </div>
      </div>
      ${
        showAgeNav
          ? `<nav class="sub-nav">
              <div class="nav-links-left">
                ${ages
                  .map(
                    (a) =>
                      `<a href="catalogo.html?faixa=${a.value}" class="${activeAge === a.value ? "active" : ""}">${a.label}</a>`
                  )
                  .join("")}
              </div>
              <div class="nav-links-right">
                <a href="biblioteca.html" class="nav-library-link">Minha Biblioteca</a>
              </div>
            </nav>`
          : ""
      }
    `;

    if (typeof Store !== 'undefined' && Store.updateCartBadge) {
      Store.updateCartBadge();
    }
  }

  function renderFooter() {
    const host = document.getElementById("site-footer");
    if (!host) return;
    host.innerHTML = `
      <p>© ${new Date().getFullYear()} Mizzle — jogos divertidos e seguros para crianças. ·
      <a href="suporte.html">Fale com o suporte</a> ·
      <a href="admin.html">Área administrativa</a></p>
    `;
  }

  function renderConfetti(container, count = 14) {
    if (!container) return;
    const layer = document.createElement("div");
    layer.className = "confetti-layer";
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      const size = 20 + Math.random() * 28;
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const shape = i % 3 === 0 ? "50%" : "4px";
      el.style.cssText = `
        width:${size}px;height:${size}px;
        left:${Math.random() * 100}%; top:${Math.random() * 100}%;
        background:${color}; border-radius:${shape};
        transform:rotate(${Math.random() * 360}deg);
      `;
      layer.appendChild(el);
    }
    container.style.position = container.style.position || "relative";
    container.prepend(layer);
  }

  function ageLabel(faixa) {
    return { "3-5": "3 a 5 anos", "6-8": "6 a 8 anos", "9-12": "9 a 12 anos" }[faixa] || faixa;
  }

  function categoryLabel(cat) {
    return (
      {
        maquiagem: "Maquiagem",
        acao: "Ação",
        cozinha: "Cozinha",
        aventura: "Aventura",
        educativo: "Educativo",
        "quebra-cabeca": "Quebra-cabeça",
      }[cat] || cat
    );
  }

  function priceLabel(v) {
    return "R$ " + Number(v).toFixed(2).replace(".", ",");
  }

  function gameCard(game) {
    const cover = game.imagem
      ? `<img src="${game.imagem}" alt="Capa de ${game.nome}" />`
      : `${game.emoji || "🎮"}`;
    return `
      <a class="game-card" href="jogo.html?id=${game.id}">
        <div class="game-cover" style="background:${game.cor || "#eee"}">${cover}</div>
        <div class="game-info">
          <div class="game-name">${game.nome}</div>
          <div class="game-meta">${categoryLabel(game.categoria)} · ${ageLabel(game.faixa)}</div>
          <div class="game-price-row">
            <span class="game-price">${priceLabel(game.preco)}</span>
            <button class="btn-mini" type="button" onclick="event.preventDefault(); UI.quickAdd('${game.id}', this)">+ Carrinho</button>
          </div>
        </div>
        <div class="price-bar"></div>
      </a>
    `;
  }

  function quickAdd(gameId, btn) {
    if (typeof Store !== 'undefined' && Store.addToCart) {
      Store.addToCart(gameId, 1);
    }
    showToast("Jogo adicionado ao carrinho!");
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "Adicionado ✓";
      setTimeout(() => (btn.textContent = original), 1200);
    }
  }

  function handleSearch(evt) {
    evt.preventDefault();
    const q = evt.target.q.value.trim();
    window.location.href = "catalogo.html" + (q ? "?q=" + encodeURIComponent(q) : "");
    return false;
  }

  let toastTimer = null;
  function showToast(msg) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  return {
    renderHeader,
    renderFooter,
    renderConfetti,
    gameCard,
    quickAdd,
    handleSearch,
    showToast,
    ageLabel,
    categoryLabel,
    priceLabel,
  };
})();