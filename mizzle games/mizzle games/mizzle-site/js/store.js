/* =========================================================
   Mizzle — camada de dados (localStorage)
   Responsável por: catálogo de jogos, carrinho, autenticação
   e pedidos. Nenhuma dependência externa.
   ========================================================= */

const Store = (() => {
  const KEYS = {
    games: "mizzle_games",
    cart: "mizzle_cart",
    users: "mizzle_users",
    session: "mizzle_session",
    orders: "mizzle_orders",
  };

  const ADMIN_PASSWORD = "mizzle123"; // apenas para fins de demonstração

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn("Falha ao ler", key, e);
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* ---------------- Jogos ---------------- */

  async function seedGamesIfNeeded() {
    if (localStorage.getItem(KEYS.games)) return;
    let seed = [];
    try {
      const res = await fetch("data/games.json");
      if (res.ok) seed = await res.json();
    } catch (e) {
      // fetch bloqueado (ex: aberto via arquivo local) — usa dados embutidos
      seed = window.MIZZLE_FALLBACK_GAMES || [];
    }
    write(KEYS.games, seed);
  }

  function getGames() {
    return read(KEYS.games, []);
  }

  function getGameById(id) {
    return getGames().find((g) => g.id === id) || null;
  }

  function saveGame(game) {
    const games = getGames();
    const idx = games.findIndex((g) => g.id === game.id);
    if (idx >= 0) games[idx] = game;
    else games.push(game);
    write(KEYS.games, games);
  }

  function deleteGame(id) {
    write(KEYS.games, getGames().filter((g) => g.id !== id));
  }

  function nextGameId() {
    const games = getGames();
    let n = games.length + 1;
    let id = "g" + String(n).padStart(3, "0");
    while (games.some((g) => g.id === id)) {
      n += 1;
      id = "g" + String(n).padStart(3, "0");
    }
    return id;
  }

  /* ---------------- Carrinho ---------------- */

  function getCart() {
    return read(KEYS.cart, []); // [{ id, qtd }]
  }

  function saveCart(cart) {
    write(KEYS.cart, cart);
    updateCartBadge();
  }

  function addToCart(gameId, qtd = 1) {
    const cart = getCart();
    const item = cart.find((i) => i.id === gameId);
    if (item) item.qtd += qtd;
    else cart.push({ id: gameId, qtd });
    saveCart(cart);
  }

  function updateCartQty(gameId, qtd) {
    let cart = getCart();
    if (qtd <= 0) {
      cart = cart.filter((i) => i.id !== gameId);
    } else {
      const item = cart.find((i) => i.id === gameId);
      if (item) item.qtd = qtd;
    }
    saveCart(cart);
  }

  function removeFromCart(gameId) {
    saveCart(getCart().filter((i) => i.id !== gameId));
  }

  function clearCart() {
    saveCart([]);
  }

  function getCartDetailed() {
    const games = getGames();
    return getCart()
      .map((item) => {
        const game = games.find((g) => g.id === item.id);
        if (!game) return null;
        return { ...game, qtd: item.qtd, subtotal: +(game.preco * item.qtd).toFixed(2) };
      })
      .filter(Boolean);
  }

  function getCartTotal() {
    return +getCartDetailed().reduce((sum, i) => sum + i.subtotal, 0).toFixed(2);
  }

  function getCartCount() {
    return getCart().reduce((sum, i) => sum + i.qtd, 0);
  }

  function updateCartBadge() {
    document.querySelectorAll("[data-cart-badge]").forEach((el) => {
      const count = getCartCount();
      el.textContent = count;
      el.style.display = count > 0 ? "flex" : "none";
    });
  }

  /* ---------------- Autenticação ---------------- */

  function getUsers() {
    return read(KEYS.users, []);
  }

  function registerUser(user) {
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
      return { ok: false, message: "Este e-mail já está cadastrado." };
    }
    users.push(user);
    write(KEYS.users, users);
    return { ok: true };
  }

  function login(identifier, senha) {
    const users = getUsers();
    const user = users.find(
      (u) => (u.email.toLowerCase() === identifier.toLowerCase() || u.usuario.toLowerCase() === identifier.toLowerCase()) && u.senha === senha
    );
    if (!user) return { ok: false, message: "Usuário ou senha inválidos." };
    write(KEYS.session, { usuario: user.usuario, email: user.email });
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem(KEYS.session);
  }

  function getSession() {
    return read(KEYS.session, null);
  }

  /* ---------------- Admin ---------------- */

  function isAdmin() {
    return sessionStorage.getItem("mizzle_admin") === "1";
  }

  function adminLogin(password) {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("mizzle_admin", "1");
      return true;
    }
    return false;
  }

  function adminLogout() {
    sessionStorage.removeItem("mizzle_admin");
  }

  /* ---------------- Pedidos ---------------- */

  function createOrder(dados) {
    const orders = read(KEYS.orders, []);
    const id = "MZ" + Date.now().toString().slice(-8);
    const order = {
      id,
      itens: getCartDetailed(),
      total: getCartTotal(),
      comprador: dados,
      data: new Date().toISOString(),
    };
    orders.push(order);
    write(KEYS.orders, orders);
    clearCart();
    return order;
  }

  function getOrder(id) {
    return read(KEYS.orders, []).find((o) => o.id === id) || null;
  }

  return {
    seedGamesIfNeeded,
    getGames,
    getGameById,
    saveGame,
    deleteGame,
    nextGameId,
    getCart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    getCartDetailed,
    getCartTotal,
    getCartCount,
    updateCartBadge,
    getUsers,
    registerUser,
    login,
    logout,
    getSession,
    isAdmin,
    adminLogin,
    adminLogout,
    createOrder,
    getOrder,
  };
})();
