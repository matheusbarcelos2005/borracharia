'use strict';

// ── Config fallback ──────────────────────────────────────────
const DEFAULT_APP_CONFIG = Object.freeze({
    storageKey: 'pneuPro-servicos-cart',
    customerStorageKey: 'pneuPro-customer',
    whatsappNumber: '5551999999999',
    whatsappGreeting: 'Olá PneuPro! Vim pelo site e gostaria de solicitar um orçamento.',
    contact: {
        phoneDisplay: '(51) 9 9999-9999',
        phoneHref: 'tel:+5551999999999',
        email: 'contato@pneupro.com.br',
        emailHref: 'mailto:contato@pneupro.com.br',
        addressHtml: 'Glorinha - RS',
        mapEmbedUrl: ''
    },
    socialLinks: { instagram: '#', facebook: '#', linkedin: '#', youtube: '#' }
});
const appConfig = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG : DEFAULT_APP_CONFIG;

// ── State ─────────────────────────────────────────────────────
let cart = [];
let currentCategory = 'Todos';
let searchQuery = '';

// ── Utils ─────────────────────────────────────────────────────
const normalize = str => str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9\s]/g,' ').trim();

function tokenize(str) {
    return normalize(str).split(/\s+/).filter(t => t.length >= 3);
}

function matchTokens(productTokens, queryTokens) {
    return queryTokens.every(qt =>
        productTokens.some(pt => pt.includes(qt) || qt.includes(pt))
    );
}

function showToast(msg, type = '') {
    const tc = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast-item${type ? ' ' + type : ''}`;
    el.textContent = msg;
    tc.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// ── Cart ──────────────────────────────────────────────────────
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
    const total = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('#cartCount, #fabCartCount').forEach(el => {
        el.textContent = total;
        el.style.display = total > 0 ? '' : 'none';
    });
}

function addToCart(servico) {
    const existing = cart.find(i => i.id === servico.id);
    if (existing) { existing.qty++; }
    else { cart.push({ ...servico, qty: 1 }); }
    saveCart();
    showToast(`${servico.nome.slice(0,40)} adicionado ao orçamento!`, 'success');
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    saveCart();
    renderCart();
}

// ── Products ──────────────────────────────────────────────────
function getCategories() {
    const cats = [...new Set(produtos.map(p => p.categoria))].sort();
    return ['Todos', ...cats];
}

function filterProducts() {
    const tokens = tokenize(searchQuery);
    return produtos.filter(p => {
        const catMatch = currentCategory === 'Todos' || p.categoria === currentCategory;
        if (!catMatch) return false;
        if (!tokens.length) return true;
        const productTokens = tokenize(p.nome + ' ' + p.categoria);
        return matchTokens(productTokens, tokens);
    });
}

function renderCategories() {
    const pills = document.getElementById('catPills');
    if (!pills) return;
    pills.innerHTML = getCategories().map(cat => `
        <span class="cat-pill${cat === currentCategory ? ' active' : ''}" data-cat="${cat}">${cat}</span>
    `).join('');
    pills.querySelectorAll('.cat-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            currentCategory = pill.dataset.cat;
            renderCategories();
            renderProducts();
        });
    });
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    const resultsInfo = document.getElementById('resultsInfo');
    if (!grid) return;

    const filtered = filterProducts();

    if (!filtered.length) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        document.getElementById('noResultsTerm').textContent = searchQuery || currentCategory;
        if (resultsInfo) resultsInfo.textContent = '';
        return;
    }

    noResults.style.display = 'none';
    if (resultsInfo) resultsInfo.textContent = `${filtered.length} serviço${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;

    grid.innerHTML = filtered.map(p => `
        <div class="product-card${p.destaque ? ' destaque' : ''}" data-id="${p.id}">
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
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const p = produtos.find(x => x.id === +btn.dataset.id);
            if (p) {
                addToCart(p);
                btn.classList.add('added');
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Adicionado';
                setTimeout(() => {
                    btn.classList.remove('added');
                    btn.innerHTML = '<i class="fa-solid fa-plus"></i> Solicitar';
                }, 1500);
            }
        });
    });

    grid.querySelectorAll('.btn-wa-quick').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const p = produtos.find(x => x.id === +btn.dataset.id);
            if (p) quickWa(p);
        });
    });
}

function quickWa(servico) {
    const msg = `Olá PneuPro! Tenho interesse no serviço:\n\n*${servico.nome}* (${servico.categoria})\n\nGostaria de solicitar um orçamento.`;
    window.open(`https://wa.me/${appConfig.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── Cart Modal ────────────────────────────────────────────────
function renderCart() {
    const list = document.getElementById('cartItemsList');
    const totalEl = document.getElementById('budgetTotal');
    if (!list) return;

    if (!cart.length) {
        list.innerHTML = `<p class="text-center" style="color:var(--text-muted);padding:2rem 0;">
            <i class="fa-solid fa-cart-shopping d-block mb-2" style="font-size:2rem;color:var(--text-dim);"></i>
            Seu orçamento está vazio.<br>Adicione serviços do catálogo.
        </p>`;
        if (totalEl) totalEl.innerHTML = 'Total: <span>A consultar</span>';
        return;
    }

    list.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-img">
                <i class="${item.icone}"></i>
            </div>
            <div class="cart-item-name">${item.nome}<br><small style="color:var(--text-muted);font-size:0.75rem;">${item.categoria}</small></div>
            <div class="qty-control">
                <button class="qty-btn" data-action="minus" data-id="${item.id}">−</button>
                <span class="qty-num">${item.qty}</span>
                <button class="qty-btn" data-action="plus" data-id="${item.id}">+</button>
            </div>
            <div class="cart-item-price">Consulte-nos</div>
            <button class="cart-item-remove" data-id="${item.id}" title="Remover">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `).join('');

    if (totalEl) totalEl.innerHTML = `Total: <span>A consultar</span>`;

    list.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => changeQty(+btn.dataset.id, btn.dataset.action === 'plus' ? 1 : -1));
    });
    list.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(+btn.dataset.id));
    });
}

function buildWaMessage() {
    const name = (document.getElementById('customerName')?.value || '').trim();
    const company = (document.getElementById('customerCompany')?.value || '').trim();
    const obs = (document.getElementById('customerObs')?.value || '').trim();

    let msg = `${appConfig.whatsappGreeting}\n\n`;
    if (name) msg += `*Nome:* ${name}\n`;
    if (company) msg += `*Empresa:* ${company}\n`;
    msg += '\n*Serviços de interesse:*\n';
    cart.forEach(item => {
        msg += `• ${item.nome} (${item.categoria})${item.qty > 1 ? ` × ${item.qty}` : ''}\n`;
    });
    msg += `\n*Total de serviços:* ${cart.reduce((s, i) => s + i.qty, 0)} item(s)`;
    if (obs) msg += `\n\n*Observações:* ${obs}`;
    return msg;
}

// ── Particles ─────────────────────────────────────────────────
function initParticles() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
        const hero = canvas.closest('.hero-section') || canvas.parentElement;
        W = canvas.width = hero.offsetWidth || window.innerWidth;
        H = canvas.height = hero.offsetHeight || window.innerHeight;
    }

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.size = Math.random() * 1.5 + 0.3;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = -Math.random() * 0.6 - 0.2;
            this.opacity = Math.random() * 0.6 + 0.1;
            this.color = Math.random() > 0.6 ? '#E53935' : Math.random() > 0.5 ? '#FF8A80' : '#fff';
            this.life = 1;
            this.decay = Math.random() * 0.003 + 0.001;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life -= this.decay;
            this.opacity = this.life * 0.7;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.opacity);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 4;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < 80; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
            p.update();
            p.draw();
            if (p.life <= 0) p.reset();
        });
        requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize);
    animate();
}

// ── Navbar scroll ──────────────────────────────────────────────
function initNavbar() {
    const nav = document.getElementById('mainNavbar');
    const fabUp = document.getElementById('fabUp');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) { nav.classList.add('scrolled'); }
        else { nav.classList.remove('scrolled'); }
        if (window.scrollY > 300) { fabUp?.classList.add('visible'); }
        else { fabUp?.classList.remove('visible'); }
    });

    const sections = document.querySelectorAll('section[id], #home');
    const navLinks = document.querySelectorAll('.nav-link');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                navLinks.forEach(l => l.classList.remove('active'));
                const target = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
                if (target) target.classList.add('active');
            }
        });
    }, { rootMargin: '-50% 0px -50% 0px' });
    sections.forEach(s => observer.observe(s));
}

// ── Social links wiring ───────────────────────────────────────
function wireLinks() {
    const cfg = appConfig;
    const wa = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(cfg.whatsappGreeting)}`;

    const set = (id, href) => { const el = document.getElementById(id); if (el) el.href = href; };

    set('heroWaBtn', wa);
    set('waContactLink', wa);
    set('footerWaBtn', wa);
    set('footerWaLink', wa);

    set('instaLink', cfg.socialLinks.instagram || '#');
    set('footerInstaLink', cfg.socialLinks.instagram || '#');
    set('sideInsta', cfg.socialLinks.instagram || '#');

    set('fbLink', cfg.socialLinks.facebook || '#');
    set('footerFbLink', cfg.socialLinks.facebook || '#');
    set('sideFb', cfg.socialLinks.facebook || '#');

    set('liLink', cfg.socialLinks.linkedin || '#');
    set('footerLiLink', cfg.socialLinks.linkedin || '#');
    set('sideLi', cfg.socialLinks.linkedin || '#');

    if (cfg.contact) {
        set('phoneLinkContact', cfg.contact.phoneHref);
        set('emailLinkContact', cfg.contact.emailHref);
        set('footerPhone', cfg.contact.phoneHref);
        set('footerEmail', cfg.contact.emailHref);
        const addr = document.getElementById('addressContact');
        if (addr && cfg.contact.addressHtml) addr.innerHTML = cfg.contact.addressHtml;
        const mapIframe = document.getElementById('contactMapIframe');
        if (mapIframe && cfg.contact.mapEmbedUrl) mapIframe.src = cfg.contact.mapEmbedUrl;
    }
}

// ── Customer data persistence ─────────────────────────────────
function saveCustomer() {
    const data = {
        name: document.getElementById('customerName')?.value || '',
        company: document.getElementById('customerCompany')?.value || '',
        obs: document.getElementById('customerObs')?.value || '',
    };
    localStorage.setItem(appConfig.customerStorageKey, JSON.stringify(data));
}

function loadCustomer() {
    try {
        const saved = JSON.parse(localStorage.getItem(appConfig.customerStorageKey));
        if (!saved) return;
        const name = document.getElementById('customerName');
        const company = document.getElementById('customerCompany');
        const obs = document.getElementById('customerObs');
        if (name) name.value = saved.name || '';
        if (company) company.value = saved.company || '';
        if (obs) obs.value = saved.obs || '';
    } catch { /* ignore */ }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCategories();
    renderProducts();
    wireLinks();
    initNavbar();
    initParticles();

    const searchInput = document.getElementById('searchInput');
    searchInput?.addEventListener('input', () => {
        searchQuery = searchInput.value.trim();
        renderProducts();
    });

    ['customerName', 'customerCompany', 'customerObs'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', saveCustomer);
    });

    document.getElementById('budgetModal')?.addEventListener('show.bs.modal', () => {
        renderCart();
        loadCustomer();
    });

    document.getElementById('sendWaBtn')?.addEventListener('click', () => {
        if (!cart.length) { showToast('Adicione serviços ao orçamento primeiro.'); return; }
        const msg = buildWaMessage();
        window.open(`https://wa.me/${appConfig.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    });

    document.getElementById('clearCartBtn')?.addEventListener('click', () => {
        cart = [];
        saveCart();
        renderCart();
        showToast('Orçamento limpo.');
    });
});

window.clearSearch = function() {
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = '';
    searchQuery = '';
    currentCategory = 'Todos';
    renderCategories();
    renderProducts();
};
