'use strict';

const DEFAULT_APP_CONFIG = Object.freeze({
    storageKey: 'pneuPro-servicos-cart',
    customerStorageKey: 'pneuPro-customer',
    whatsappNumber: '5551999999999',
    whatsappGreeting: 'Olá PneuPro! Vim pelo site e gostaria de solicitar um orçamento.',
    contact: { phoneDisplay: '(51) 9 9999-9999', phoneHref: 'tel:+5551999999999', email: 'contato@pneupro.com.br', emailHref: 'mailto:contato@pneupro.com.br' },
    socialLinks: { instagram: '#', facebook: '#', linkedin: '#', youtube: '#' }
});
const appConfig = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG : DEFAULT_APP_CONFIG;

// ── State ────────────────────────────────────────────────────
let cart = [];
let currentCategory = 'Todos';
let searchQuery = '';
let sortMode = 'default';
let destaqueOnly = false;

// ── Utils ────────────────────────────────────────────────────
const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9\s]/g,' ').trim();
const tokenize = s => normalize(s).split(/\s+/).filter(Boolean);

function matchTokens(productTokens, queryTokens) {
    return queryTokens.every(qt =>
        productTokens.some(pt => pt.includes(qt) || qt.includes(pt))
    );
}

function showToast(msg, type = '') {
    const tc = document.getElementById('toast-container');
    if (!tc) return;
    const el = document.createElement('div');
    el.className = `toast-item${type ? ' '+type : ''}`;
    el.textContent = msg;
    tc.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// ── Cart ─────────────────────────────────────────────────────
function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(appConfig.storageKey));
        cart = Array.isArray(saved) ? saved : [];
    } catch { cart = []; }
    updateCartCount();
}
function saveCart() {
    localStorage.setItem(appConfig.storageKey, JSON.stringify(cart));
    updateCartCount();
}
function updateCartCount() {
    const total = cart.reduce((s,i) => s+i.qty, 0);
    document.querySelectorAll('#cartCount, #fabCartCount').forEach(el => {
        el.textContent = total;
        el.style.display = total > 0 ? '' : 'none';
    });
}
function addToCart(servico) {
    const ex = cart.find(i => i.id === servico.id);
    if (ex) { ex.qty++; } else { cart.push({...servico, qty:1}); }
    saveCart();
    showToast(`${servico.nome.slice(0,40)} adicionado!`, 'success');
}
function removeFromCart(id) { cart = cart.filter(i => i.id !== id); saveCart(); renderCart(); }
function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) { item.qty = Math.max(1, item.qty + delta); saveCart(); renderCart(); }
}

// ── Filter & sort ─────────────────────────────────────────────
function getCategories() {
    return [...new Set(produtos.map(p => p.categoria))].sort();
}

function filterProducts() {
    const tokens = tokenize(searchQuery);
    let result = produtos.filter(p => {
        const catOk = currentCategory === 'Todos' || p.categoria === currentCategory;
        if (!catOk) return false;
        if (destaqueOnly && !p.destaque) return false;
        if (!tokens.length) return true;
        return matchTokens(tokenize(p.nome + ' ' + p.categoria), tokens);
    });
    switch (sortMode) {
        case 'name-az': result.sort((a,b) => a.nome.localeCompare(b.nome)); break;
        case 'name-za': result.sort((a,b) => b.nome.localeCompare(a.nome)); break;
    }
    return result;
}

// ── Render sidebar ───────────────────────────────────────────
function renderSidebar() {
    const container = document.getElementById('sidebarCats');
    if (!container) return;
    const cats = getCategories();
    const countMap = {};
    produtos.forEach(p => { countMap[p.categoria] = (countMap[p.categoria]||0) + 1; });

    container.innerHTML = '';
    const totalEl = document.createElement('div');
    totalEl.className = `sidebar-cat-item${currentCategory === 'Todos' ? ' active' : ''}`;
    totalEl.dataset.cat = 'Todos';
    totalEl.innerHTML = `<span>Todos</span><span class="cat-count">${produtos.length}</span>`;
    container.appendChild(totalEl);

    cats.forEach(cat => {
        const el = document.createElement('div');
        el.className = `sidebar-cat-item${currentCategory === cat ? ' active' : ''}`;
        el.dataset.cat = cat;
        el.innerHTML = `<span>${cat}</span><span class="cat-count">${countMap[cat]||0}</span>`;
        container.appendChild(el);
    });

    container.querySelectorAll('.sidebar-cat-item').forEach(el => {
        el.addEventListener('click', () => {
            currentCategory = el.dataset.cat;
            renderSidebar();
            renderProducts();
            renderActiveFilters();
        });
    });

    const tc = document.getElementById('totalCategories');
    if (tc) tc.textContent = cats.length;
}

// ── Render active filter chips ────────────────────────────────
function renderActiveFilters() {
    const container = document.getElementById('activeFilters');
    if (!container) return;
    container.innerHTML = '';
    if (currentCategory !== 'Todos') {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `<i class="fa-solid fa-tag"></i>${currentCategory}<button onclick="removeCatFilter()"><i class="fa-solid fa-xmark"></i></button>`;
        container.appendChild(chip);
    }
    if (searchQuery) {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i>"${searchQuery}"<button onclick="clearSearch()"><i class="fa-solid fa-xmark"></i></button>`;
        container.appendChild(chip);
    }
    if (destaqueOnly) {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `<i class="fa-solid fa-star"></i>Destaques<button onclick="clearDestaque()"><i class="fa-solid fa-xmark"></i></button>`;
        container.appendChild(chip);
    }
}

// ── Render products ──────────────────────────────────────────
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    const resultsInfo = document.getElementById('resultsInfo');
    if (!grid) return;

    const filtered = filterProducts();

    if (!filtered.length) {
        grid.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
        const term = document.getElementById('noResultsTerm');
        if (term) term.textContent = searchQuery || currentCategory;
        if (resultsInfo) resultsInfo.textContent = '';
        return;
    }

    if (noResults) noResults.style.display = 'none';
    if (resultsInfo) resultsInfo.textContent = `${filtered.length} serviço${filtered.length !== 1 ? 's' : ''}`;

    grid.innerHTML = filtered.map(p => `
        <div class="product-card${p.destaque ? ' destaque' : ''}">
            <div class="product-number" aria-label="Serviço ${p.numero} de ${produtos.length}">${p.numero}</div>
            <div class="product-img-wrap">
                <i class="${p.icone}"></i>
            </div>
            <div class="product-body">
                <div class="product-cat-tag">${p.categoria}</div>
                <div class="product-name">${p.nome}</div>
                <div class="product-price">Consulte-nos</div>
            </div>
            <div class="product-actions">
                <button class="btn-add-cart" data-id="${p.id}">
                    <i class="fa-solid fa-plus"></i> Solicitar
                </button>
                <button class="btn-wa-quick" data-id="${p.id}" title="Orçamento via WhatsApp">
                    <i class="fa-brands fa-whatsapp"></i>
                </button>
            </div>
        </div>
    `).join('');

    grid.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = produtos.find(x => x.id === +btn.dataset.id);
            if (!p) return;
            addToCart(p);
            btn.classList.add('added');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Adicionado';
            setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = '<i class="fa-solid fa-plus"></i> Solicitar'; }, 1500);
        });
    });

    grid.querySelectorAll('.btn-wa-quick').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = produtos.find(x => x.id === +btn.dataset.id);
            if (p) quickWa(p);
        });
    });
}

function quickWa(servico) {
    const msg = `Olá PneuPro! Tenho interesse no serviço:\n\n*${servico.nome}* (${servico.categoria})\n\nGostaria de solicitar um orçamento.`;
    window.open(`https://wa.me/${appConfig.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── Cart modal ────────────────────────────────────────────────
function renderCart() {
    const list = document.getElementById('cartItemsList');
    const totalEl = document.getElementById('budgetTotal');
    if (!list) return;
    if (!cart.length) {
        list.innerHTML = `<p class="text-center" style="color:var(--text-muted);padding:2rem 0;"><i class="fa-solid fa-cart-shopping d-block mb-2" style="font-size:2rem;color:var(--text-dim);"></i>Seu orçamento está vazio.<br>Adicione serviços do catálogo.</p>`;
        if (totalEl) totalEl.innerHTML = 'Total: <span>A consultar</span>';
        return;
    }
    list.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-img"><i class="${item.icone}"></i></div>
            <div class="cart-item-name">${item.nome}<br><small style="color:var(--text-muted);font-size:0.75rem;">${item.categoria}</small></div>
            <div class="qty-control">
                <button class="qty-btn" data-action="minus" data-id="${item.id}">−</button>
                <span class="qty-num">${item.qty}</span>
                <button class="qty-btn" data-action="plus" data-id="${item.id}">+</button>
            </div>
            <div class="cart-item-price">Consulte-nos</div>
            <button class="cart-item-remove" data-id="${item.id}"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
    if (totalEl) totalEl.innerHTML = `Total: <span>A consultar</span>`;
    list.querySelectorAll('.qty-btn').forEach(btn => btn.addEventListener('click', () => changeQty(+btn.dataset.id, btn.dataset.action === 'plus' ? 1 : -1)));
    list.querySelectorAll('.cart-item-remove').forEach(btn => btn.addEventListener('click', () => removeFromCart(+btn.dataset.id)));
}

function buildWaMessage() {
    const name = (document.getElementById('customerName')?.value||'').trim();
    const company = (document.getElementById('customerCompany')?.value||'').trim();
    const obs = (document.getElementById('customerObs')?.value||'').trim();
    let msg = `${appConfig.whatsappGreeting}\n\n`;
    if (name) msg += `*Nome:* ${name}\n`;
    if (company) msg += `*Empresa:* ${company}\n`;
    msg += '\n*Serviços de interesse:*\n';
    cart.forEach(i => { msg += `• ${i.nome} (${i.categoria})${i.qty > 1 ? ` × ${i.qty}` : ''}\n`; });
    msg += `\n*Total de itens:* ${cart.reduce((s,i) => s + i.qty, 0)}`;
    if (obs) msg += `\n\n*Observações:* ${obs}`;
    return msg;
}

// ── Render drawer categories ─────────────────────────────────
function renderDrawerCats() {
    const container = document.getElementById('drawerCats');
    if (!container) return;
    const cats = getCategories();
    const countMap = {};
    produtos.forEach(p => { countMap[p.categoria] = (countMap[p.categoria]||0)+1; });

    container.innerHTML = ['Todos', ...cats].map(cat => `
        <div class="drawer-cat-item${currentCategory === cat ? ' active' : ''}" data-cat="${cat}">
            <span>${cat}</span>
            <span class="cat-count">${cat === 'Todos' ? produtos.length : (countMap[cat]||0)}</span>
        </div>
    `).join('');

    container.querySelectorAll('.drawer-cat-item').forEach(el => {
        el.addEventListener('click', () => {
            currentCategory = el.dataset.cat;
            container.querySelectorAll('.drawer-cat-item').forEach(x => x.classList.remove('active'));
            el.classList.add('active');
        });
    });
}

// ── Update filter badge count ────────────────────────────────
function updateFilterBadge() {
    const badge = document.getElementById('filterBadge');
    if (!badge) return;
    let count = 0;
    if (currentCategory !== 'Todos') count++;
    if (searchQuery) count++;
    if (destaqueOnly) count++;
    if (sortMode !== 'default') count++;
    badge.textContent = count || '';
    badge.classList.toggle('visible', count > 0);
    const btn = document.getElementById('btnFiltros');
    btn?.classList.toggle('active', count > 0);
}

// ── Wire social/WA links ──────────────────────────────────────
function wireLinks() {
    const wa = `https://wa.me/${appConfig.whatsappNumber}?text=${encodeURIComponent(appConfig.whatsappGreeting)}`;
    ['footerWa'].forEach(id => { const el=document.getElementById(id); if(el) el.href=wa; });
}

// ── Global helpers ─────────────────────────────────────────────
window.removeCatFilter  = () => { currentCategory = 'Todos'; renderSidebar(); renderProducts(); renderActiveFilters(); };
window.clearSearch      = () => { const inp=document.getElementById('searchInput'); if(inp) inp.value=''; searchQuery=''; const cc=document.getElementById('searchClear'); if(cc) cc.classList.remove('visible'); renderProducts(); renderActiveFilters(); };
window.clearDestaque    = () => { destaqueOnly=false; const cb=document.getElementById('destaqueFilter'); if(cb) cb.checked=false; renderProducts(); renderActiveFilters(); };
window.clearAllFilters  = () => { window.removeCatFilter(); window.clearSearch(); window.clearDestaque(); };

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderSidebar();
    renderProducts();
    wireLinks();

    const tc = document.getElementById('totalProducts');
    if (tc) tc.textContent = produtos.length;

    const nav = document.getElementById('mainNavbar');
    window.addEventListener('scroll', () => nav?.classList.toggle('scrolled', window.scrollY > 60));

    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    searchInput?.addEventListener('input', () => {
        searchQuery = searchInput.value.trim();
        searchClear?.classList.toggle('visible', searchQuery.length > 0);
        renderProducts();
        renderActiveFilters();
        updateFilterBadge();
    });
    searchClear?.addEventListener('click', () => window.clearSearch());

    const mobileSearch = document.getElementById('mobileSearchInput');
    mobileSearch?.addEventListener('input', () => {
        searchQuery = mobileSearch.value.trim();
        renderProducts();
        renderActiveFilters();
        updateFilterBadge();
    });

    document.getElementById('sortSelect')?.addEventListener('change', e => {
        sortMode = e.target.value;
        renderProducts();
    });

    document.getElementById('destaqueFilter')?.addEventListener('change', e => {
        destaqueOnly = e.target.checked;
        renderProducts();
        renderActiveFilters();
        updateFilterBadge();
    });

    const drawer        = document.getElementById('filterDrawer');
    const overlay       = document.getElementById('drawerOverlay');
    const btnFiltros    = document.getElementById('btnFiltros');
    const drawerClose   = document.getElementById('drawerClose');
    const drawerApply   = document.getElementById('drawerApply');
    const drawerClear   = document.getElementById('drawerClear');

    function openDrawer() {
        renderDrawerCats();
        drawer?.classList.add('open');
        overlay?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        drawer?.classList.remove('open');
        overlay?.classList.remove('open');
        document.body.style.overflow = '';
    }

    btnFiltros?.addEventListener('click', openDrawer);
    drawerClose?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', closeDrawer);
    drawerApply?.addEventListener('click', () => { renderProducts(); renderActiveFilters(); updateFilterBadge(); closeDrawer(); });
    drawerClear?.addEventListener('click', () => {
        currentCategory = 'Todos'; sortMode = 'default'; destaqueOnly = false;
        const ms = document.getElementById('mobileSearchInput'); if (ms) ms.value = '';
        searchQuery = '';
        if (document.getElementById('drawerDestaque')) document.getElementById('drawerDestaque').checked = false;
        document.querySelectorAll('.sort-pill').forEach(p => p.classList.toggle('active', p.dataset.sort === 'default'));
        renderDrawerCats();
        renderProducts(); renderActiveFilters(); updateFilterBadge();
    });

    document.getElementById('drawerSort')?.querySelectorAll('.sort-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.sort-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            sortMode = pill.dataset.sort;
        });
    });

    document.getElementById('drawerDestaque')?.addEventListener('change', e => { destaqueOnly = e.target.checked; });

    document.getElementById('viewGrid')?.addEventListener('click', () => {
        document.body.classList.remove('list-view');
        document.getElementById('viewGrid')?.classList.add('active');
        document.getElementById('viewList')?.classList.remove('active');
    });
    document.getElementById('viewList')?.addEventListener('click', () => {
        document.body.classList.add('list-view');
        document.getElementById('viewList')?.classList.add('active');
        document.getElementById('viewGrid')?.classList.remove('active');
    });

    document.getElementById('budgetModal')?.addEventListener('show.bs.modal', renderCart);
    document.getElementById('sendWaBtn')?.addEventListener('click', () => {
        if (!cart.length) { showToast('Adicione serviços primeiro.'); return; }
        window.open(`https://wa.me/${appConfig.whatsappNumber}?text=${encodeURIComponent(buildWaMessage())}`, '_blank');
    });
    document.getElementById('clearCartBtn')?.addEventListener('click', () => {
        cart = []; saveCart(); renderCart(); showToast('Orçamento limpo.');
    });
});
