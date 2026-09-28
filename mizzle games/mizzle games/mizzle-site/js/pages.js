/* =========================================================
   Mizzle — lógica específica de cada página
   ========================================================= */

const Pages = (() => {
  function qs(param) {
    return new URLSearchParams(window.location.search).get(param);
  }

  function mountCarousel(track, arrowsWrap) {
    const amount = 264; // largura do card + gap
    arrowsWrap.querySelector(".prev").onclick = () => track.scrollBy({ left: -amount * 2, behavior: "smooth" });
    arrowsWrap.querySelector(".next").onclick = () => track.scrollBy({ left: amount * 2, behavior: "smooth" });
  }

  function buildSection(id, titleText, games, altColor = false) {
    if (!games.length) return "";
    return `
      <div class="section" id="${id}">
        <h2 class="section-title${altColor ? " alt" : ""}">${titleText}</h2>
        <div class="carousel" data-carousel>
          <button class="carousel-arrow prev" aria-label="Anterior">‹</button>
          <div class="carousel-track">${games.map(UI.gameCard).join("")}</div>
          <button class="carousel-arrow next" aria-label="Próximo">›</button>
        </div>
      </div>
    `;
  }

  /* ---------------- Home ---------------- */
  function initHome() {
    UI.renderHeader({ showAgeNav: true });
    UI.renderFooter();
    const games = Store.getGames();
    const destaque = games.filter((g) => g.destaque);
    const porCategoria = (cat) => games.filter((g) => g.categoria === cat);

    const main = document.getElementById("home-sections");
    main.innerHTML = [
      buildSection("destaque", "Jogos em destaque", destaque.length ? destaque : games.slice(0, 4)),
      buildSection("maquiagem", "Jogos de maquiar", porCategoria("maquiagem")),
      buildSection("acao", "Jogos de ação", porCategoria("acao")),
      buildSection("cozinha", "Jogos de cozinha", porCategoria("cozinha")),
      buildSection("aventura", "Jogos de aventura", porCategoria("aventura")),
      buildSection("educativo", "Jogos educativos", porCategoria("educativo")),
    ].join("");

    main.querySelectorAll("[data-carousel]").forEach((wrap) => mountCarousel(wrap.querySelector(".carousel-track"), wrap));
    UI.renderConfetti(document.getElementById("home-sections"), 16);
  }

  /* ---------------- Catálogo por faixa etária / busca ---------------- */
  function initCatalogo() {
    const faixa = qs("faixa");
    const q = (qs("q") || "").toLowerCase().trim();
    UI.renderHeader({ activeAge: faixa, showAgeNav: true });
    UI.renderFooter();

    let games = Store.getGames();
    if (faixa) games = games.filter((g) => g.faixa === faixa);
    if (q) games = games.filter((g) => g.nome.toLowerCase().includes(q) || g.categoria.toLowerCase().includes(q));

    document.getElementById("catalogo-titulo").textContent = q
      ? `Resultados para "${qs("q")}"`
      : faixa
      ? `Jogos para ${UI.ageLabel(faixa)}`
      : "Todos os jogos";

    const categorias = [...new Set(games.map((g) => g.categoria))];
    const wrap = document.getElementById("catalogo-conteudo");

    if (!games.length) {
      wrap.innerHTML = `<div class="empty-state">Nenhum jogo encontrado por aqui. Que tal explorar outra categoria?</div>`;
      return;
    }

    wrap.innerHTML = categorias
      .map((cat) => buildSection("cat-" + cat, UI.categoryLabel(cat), games.filter((g) => g.categoria === cat), true))
      .join("");
    wrap.querySelectorAll("[data-carousel]").forEach((w) => mountCarousel(w.querySelector(".carousel-track"), w));
    UI.renderConfetti(wrap, 10);
  }

  /* ---------------- Página do jogo ---------------- */
  function initJogo() {
    UI.renderHeader({ showAgeNav: false });
    UI.renderFooter();
    const id = qs("id");
    const game = Store.getGameById(id);
    const wrap = document.getElementById("jogo-conteudo");
    if (!game) {
      wrap.innerHTML = `<div class="empty-state">Jogo não encontrado. <a class="link-muted" href="index.html">Voltar à loja</a></div>`;
      return;
    }
    document.title = game.nome + " — Mizzle";
    const cover = game.imagem ? `<img src="${game.imagem}" alt="Capa de ${game.nome}" style="width:100%;height:100%;object-fit:cover;border-radius:5px;" />` : (game.emoji || "🎮");
    wrap.innerHTML = `
      <div class="game-detail">
        <div class="detail-cover" style="background:${game.cor || "#eee"}">${cover}</div>
        <div class="detail-info">
          <h1>${game.nome}</h1>
          <div class="detail-tags">
            <span class="tag">${UI.categoryLabel(game.categoria)}</span>
            <span class="tag">${UI.ageLabel(game.faixa)}</span>
            <span class="tag">${game.desenvolvedor}</span>
          </div>
          <div class="detail-price">${UI.priceLabel(game.preco)}</div>
          <p class="detail-desc">${game.descricao}</p>
          <div class="detail-actions">
            <button class="btn-mini" type="button" style="padding:14px 26px;font-size:1rem;" onclick="Pages.addAndStay('${game.id}')">Adicionar ao carrinho</button>
            <button class="btn-mini" type="button" style="padding:14px 26px;font-size:1rem;background:var(--blue-dark)" onclick="Pages.buyNow('${game.id}')">Comprar agora</button>
          </div>
        </div>
      </div>
    `;
    UI.renderConfetti(wrap, 8);
  }

  function addAndStay(id) {
    Store.addToCart(id, 1);
    UI.showToast("Jogo adicionado ao carrinho!");
  }

  function buyNow(id) {
    Store.addToCart(id, 1);
    window.location.href = "carrinho.html";
  }

  /* ---------------- Carrinho ---------------- */
  function renderCart() {
    const itens = Store.getCartDetailed();
    const listEl = document.getElementById("cart-items");
    const summaryEl = document.getElementById("cart-summary-body");
    const checkoutBtn = document.getElementById("go-checkout");

    if (!itens.length) {
      listEl.innerHTML = `<div class="empty-state">Seu carrinho está vazio. <a class="link-muted" href="index.html">Ver jogos</a></div>`;
      summaryEl.innerHTML = `<div class="summary-row total"><span>Total</span><span>${UI.priceLabel(0)}</span></div>`;
      checkoutBtn.setAttribute("disabled", "disabled");
      return;
    }
    checkoutBtn.removeAttribute("disabled");

    listEl.innerHTML = itens
      .map(
        (i) => `
      <div class="cart-item">
        <div class="game-cover" style="background:${i.cor}">${i.imagem ? `<img src="${i.imagem}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">` : i.emoji}</div>
        <div class="cart-item-info">
          <div class="game-name">${i.nome}</div>
          <div class="game-meta">${UI.categoryLabel(i.categoria)} · ${UI.ageLabel(i.faixa)}</div>
          <div class="game-meta">
            Qtd:
            <button class="btn-mini" style="padding:2px 9px" onclick="Pages.changeQty('${i.id}', ${i.qtd - 1})">−</button>
            <strong style="margin:0 6px">${i.qtd}</strong>
            <button class="btn-mini" style="padding:2px 9px" onclick="Pages.changeQty('${i.id}', ${i.qtd + 1})">+</button>
          </div>
        </div>
        <div class="cart-item-price">${UI.priceLabel(i.subtotal)}</div>
        <button class="remove-btn" title="Remover" onclick="Pages.changeQty('${i.id}', 0)">✕</button>
      </div>`
      )
      .join("");

    const total = Store.getCartTotal();
    summaryEl.innerHTML = `
      ${itens.map((i) => `<div class="summary-row"><span>${i.nome} × ${i.qtd}</span><span>${UI.priceLabel(i.subtotal)}</span></div>`).join("")}
      <div class="summary-row total"><span>Total</span><span>${UI.priceLabel(total)}</span></div>
    `;
  }

  function changeQty(id, qtd) {
    Store.updateCartQty(id, qtd);
    renderCart();
  }

  function initCarrinho() {
    UI.renderHeader({ showAgeNav: false });
    UI.renderFooter();
    renderCart();
  }

  /* ---------------- Checkout ---------------- */
  function initCheckout() {
    UI.renderHeader({ showAgeNav: false });
    UI.renderFooter();

    const itens = Store.getCartDetailed();
    if (!itens.length) {
      window.location.href = "carrinho.html";
      return;
    }
    const total = Store.getCartTotal();
    document.getElementById("checkout-summary").innerHTML = `
      ${itens.map((i) => `<div class="summary-row"><span>${i.nome} × ${i.qtd}</span><span>${UI.priceLabel(i.subtotal)}</span></div>`).join("")}
      <div class="summary-row total"><span>Total</span><span>${UI.priceLabel(total)}</span></div>
    `;

    document.querySelectorAll(".pay-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".pay-tab").forEach((t) => t.classList.remove("active"));
        document.querySelectorAll(".pay-panel").forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById("panel-" + tab.dataset.pay).classList.add("active");
      });
    });

    document.getElementById("checkout-form").addEventListener("submit", (evt) => {
      evt.preventDefault();
      const form = evt.target;
      const dados = {
        nome: form.nome.value.trim(),
        email: form.email.value.trim(),
        telefone: form.telefone.value.trim(),
        cpf: form.cpf.value.trim(),
        pagamento: document.querySelector(".pay-tab.active").dataset.pay,
      };
      if (!dados.nome || !dados.email) {
        UI.showToast("Preencha nome e e-mail para continuar.");
        return;
      }
      const order = Store.createOrder(dados);
      window.location.href = "confirmacao.html?pedido=" + order.id;
    });
  }

  /* ---------------- Confirmação ---------------- */
  function initConfirmacao() {
    UI.renderHeader({ showAgeNav: false });
    UI.renderFooter();
    const id = qs("pedido");
    const order = Store.getOrder(id);
    const wrap = document.getElementById("confirm-wrap");
    if (!order) {
      wrap.innerHTML = `<div class="confirm-card"><p>Pedido não encontrado.</p><a class="link-muted" href="index.html">Voltar à loja</a></div>`;
      return;
    }
    wrap.innerHTML = `
      <div class="confirm-card">
        <div class="confirm-check">✓</div>
        <h1>Pedido realizado com sucesso!</h1>
        <p>Obrigado por comprar na Mizzle, ${order.comprador.nome.split(" ")[0]}! Seu pedido foi registrado e os jogos já estão disponíveis na sua conta.</p>
        <div class="confirm-order-id">Pedido nº ${order.id}</div>
        <p style="color:var(--text-light)">Total pago: <strong>${UI.priceLabel(order.total)}</strong></p>
        <button class="btn-primary" style="margin-top:16px" onclick="location.href='index.html'">Ir para o início</button>
      </div>
    `;
  }

  /* ---------------- Login / Cadastro ---------------- */
  function initLogin() {
    UI.renderHeader({ showAgeNav: false });
    UI.renderFooter();
    document.getElementById("login-form").addEventListener("submit", (evt) => {
      evt.preventDefault();
      const form = evt.target;
      const result = Store.login(form.identificador.value.trim(), form.senha.value);
      if (!result.ok) {
        UI.showToast(result.message);
        return;
      }
      UI.showToast("Login realizado com sucesso!");
      setTimeout(() => (window.location.href = "index.html"), 700);
    });
  }

  function initCadastro() {
    UI.renderHeader({ showAgeNav: false });
    UI.renderFooter();
    document.getElementById("cadastro-form").addEventListener("submit", (evt) => {
      evt.preventDefault();
      const form = evt.target;
      if (form.senha.value !== form.confirmarSenha.value) {
        UI.showToast("As senhas não coincidem.");
        return;
      }
      const result = Store.registerUser({
        usuario: form.usuario.value.trim(),
        email: form.email.value.trim(),
        senha: form.senha.value,
        nascimento: form.nascimento.value,
      });
      if (!result.ok) {
        UI.showToast(result.message);
        return;
      }
      UI.showToast("Conta criada! Faça login para continuar.");
      setTimeout(() => (window.location.href = "login.html"), 900);
    });
  }

  /* ---------------- Suporte ---------------- */
  function initSuporte() {
    UI.renderHeader({ showAgeNav: false });
    UI.renderFooter();
    document.getElementById("suporte-form").addEventListener("submit", (evt) => {
      evt.preventDefault();
      evt.target.reset();
      UI.showToast("Mensagem enviada! Nossa equipe responderá em breve.");
    });
  }

  /* ---------------- Admin ---------------- */
  function renderAdminList() {
    const listEl = document.getElementById("admin-list");
    if (!listEl) return;
    const games = Store.getGames();
    if (!games.length) {
      listEl.innerHTML = `<div class="empty-state">Nenhum jogo cadastrado ainda.</div>`;
      return;
    }
    listEl.innerHTML = games
      .slice()
      .reverse()
      .map(
        (g) => `
      <div class="admin-list-item">
        <div class="game-cover" style="background:${g.cor}">${g.imagem ? `<img src="${g.imagem}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">` : g.emoji}</div>
        <div class="grow">
          <strong>${g.nome}</strong>
          <small>${UI.categoryLabel(g.categoria)} · ${UI.ageLabel(g.faixa)} · ${UI.priceLabel(g.preco)}</small>
        </div>
        <button class="edit-btn" type="button" onclick="Pages.editGame('${g.id}')">Editar</button>
        <button class="del-btn" type="button" onclick="Pages.removeGame('${g.id}')">Excluir</button>
      </div>`
      )
      .join("");
  }

  function resetAdminForm() {
    const form = document.getElementById("game-form");
    form.reset();
    form.gameId.value = "";
    document.getElementById("upload-preview").innerHTML = `<span class="plus">+</span><span>Upload do jogo</span>`;
    document.getElementById("upload-preview").dataset.image = "";
    document.getElementById("form-title").textContent = "Adicionar jogo";
    document.getElementById("publish-btn").textContent = "Publicar";
  }

  function editGame(id) {
    const g = Store.getGameById(id);
    if (!g) return;
    const form = document.getElementById("game-form");
    form.gameId.value = g.id;
    form.nome.value = g.nome;
    form.categoria.value = g.categoria;
    form.faixa.value = g.faixa;
    form.descricao.value = g.descricao;
    form.desenvolvedor.value = g.desenvolvedor;
    form.preco.value = g.preco;
    const preview = document.getElementById("upload-preview");
    if (g.imagem) {
      preview.innerHTML = `<img src="${g.imagem}" alt="Capa atual" />`;
      preview.dataset.image = g.imagem;
    } else {
      preview.innerHTML = `<span class="plus">+</span><span>Upload do jogo</span>`;
      preview.dataset.image = "";
    }
    document.getElementById("form-title").textContent = "Editar jogo";
    document.getElementById("publish-btn").textContent = "Salvar alterações";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeGame(id) {
    if (!confirm("Excluir este jogo do catálogo?")) return;
    Store.deleteGame(id);
    renderAdminList();
    UI.showToast("Jogo excluído.");
  }

  function handleUploadChange(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const preview = document.getElementById("upload-preview");
      preview.innerHTML = `<img src="${reader.result}" alt="Prévia da capa" />`;
      preview.dataset.image = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function initAdmin() {
    UI.renderHeader({ showAgeNav: false });
    UI.renderFooter();

    const loginWrap = document.getElementById("admin-login-wrap");
    const panelWrap = document.getElementById("admin-panel-wrap");

    function showPanel() {
      loginWrap.style.display = "none";
      panelWrap.style.display = "block";
      renderAdminList();
    }

    if (Store.isAdmin()) showPanel();

    document.getElementById("admin-login-form").addEventListener("submit", (evt) => {
      evt.preventDefault();
      const senha = evt.target.senha.value;
      if (Store.adminLogin(senha)) {
        showPanel();
      } else {
        UI.showToast("Senha incorreta.");
      }
    });

    document.getElementById("admin-logout")?.addEventListener("click", () => {
      Store.adminLogout();
      location.reload();
    });

    document.getElementById("game-form").addEventListener("submit", (evt) => {
      evt.preventDefault();
      const form = evt.target;
      const id = form.gameId.value || Store.nextGameId();
      const preview = document.getElementById("upload-preview");
      const existing = form.gameId.value ? Store.getGameById(form.gameId.value) : null;
      const palette = ["#ffa3e8", "#feb8e9", "#c7b8fe", "#93b5ff", "#a5fdeb", "#ff9393", "#b3fbad", "#f6b599", "#b8e3fe", "#b6f6b6"];
      const game = {
        id,
        nome: form.nome.value.trim(),
        categoria: form.categoria.value,
        faixa: form.faixa.value,
        descricao: form.descricao.value.trim(),
        desenvolvedor: form.desenvolvedor.value.trim(),
        preco: parseFloat(form.preco.value) || 0,
        imagem: preview.dataset.image || null,
        cor: (existing && existing.cor) || palette[Math.floor(Math.random() * palette.length)],
        emoji: (existing && existing.emoji) || "🎮",
        destaque: existing ? existing.destaque : false,
      };
      if (!game.nome || !game.categoria || !game.faixa) {
        UI.showToast("Preencha nome, categoria e faixa etária.");
        return;
      }
      Store.saveGame(game);
      UI.showToast(form.gameId.value ? "Jogo atualizado!" : "Jogo publicado com sucesso!");
      resetAdminForm();
      renderAdminList();
    });

    document.getElementById("form-cancel").addEventListener("click", resetAdminForm);
  }

  return {
    initHome,
    initCatalogo,
    initJogo,
    addAndStay,
    buyNow,
    initCarrinho,
    changeQty,
    initCheckout,
    initConfirmacao,
    initLogin,
    initCadastro,
    initSuporte,
    initAdmin,
    editGame,
    removeGame,
    handleUploadChange,
  };
})();
