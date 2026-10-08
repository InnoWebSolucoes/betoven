/* Marcação online: serviços → profissional → hora → confirmar e pagar.
   Demonstração: tudo corre no browser, nenhum dado é enviado nem cobrado. */
(function () {
  'use strict';

  const D = window.BTV, F = window.BTVfmt;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const el = $('#booking');
  if (!el) return;
  const bodyEl = $('.bk-body', el), main = $('.bk-main', el), aside = $('.bk-aside', el);
  const mbar = $('.bk-mbar', el), crumbs = $('.bk-crumbs', el), proc = $('.bk-proc', el);

  const STEPS = ['Serviços', 'Profissional', 'Hora', 'Confirmar'];
  const DEPOSIT = 0.3;
  const PROMOS = { BEETHOVEN10: 0.10 };
  const DAYS_AHEAD = 70;
  const ADDON_OK = ['balayage', 'manutencao', 'boticario', 'coloracao', 'intensivo', 'alinhamento'];
  const MAX_DAY = Math.max(...Object.values(D.hours).filter(Boolean).map(h => h[1] - h[0]));
  const CC = [['+351', 'PT'], ['+55', 'BR'], ['+34', 'ES'], ['+33', 'FR'], ['+44', 'UK'], ['+45', 'DK'], ['+1', 'US']];
  const svc = Object.fromEntries(D.services.map(s => [s.id, s]));

  const icon = n => `<svg class="ico" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur2 = v => F.eur(v, 2);
  const eurAuto = v => F.eur(v, v % 1 ? 2 : 0);
  const stars = `<svg aria-hidden="true"><use href="#i-star"/></svg>`.repeat(5);

  /* ---------- datas ---------- */
  const dayKey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmtLong = d => new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  const fmtMonth = d => { const s = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(d); return s[0].toUpperCase() + s.slice(1); };
  const fmtWk = d => new Intl.DateTimeFormat('pt-PT', { weekday: 'short' }).format(d).replace('.', '');
  function dayList() {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS_AHEAD }, (_, i) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + i));
  }
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // null = fechado · [] = sem vagas · [min, …] = inícios livres
  function slotsFor(d) {
    const h = D.hours[d.getDay()];
    if (!h) return null;
    const r = rng(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate());
    if (r() < 0.1) return [];
    const { dur } = totals();
    const now = new Date();
    const isToday = dayKey(d) === dayKey(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const out = [];
    for (let m = h[0]; m + Math.max(dur, 15) <= h[1]; m += 15) {
      if (r() < 0.42) continue;
      if (isToday && m < nowMin + 90) continue;
      out.push(m);
    }
    return out;
  }
  function nextAvailable(from) {
    return dayList().find(d => d > from && (slotsFor(d) || []).length);
  }

  /* ---------- estado ---------- */
  let S, lastFocus, timers = [], mbTimer = null;
  function reset(pre) {
    S = { step: 0, cat: 'destaque', sel: [], pro: null, date: null, time: null, plan: 'deposit', method: 'card', promo: null, form: { cc: '+351' }, done: null };
    if (pre && svc[pre]) {
      S.sel = [pre];
      S.cat = svc[pre].featured ? 'destaque' : svc[pre].cat;
    }
  }
  function totals() {
    const items = S.sel.map(id => svc[id]);
    const dur = items.reduce((a, s) => a + s.dur, 0);
    const sub = items.reduce((a, s) => a + s.price, 0);
    const disc = S.promo ? Math.round(sub * (PROMOS[S.promo] || 0.10) * 100) / 100 : 0;
    const total = Math.round((sub - disc) * 100) / 100;
    const dep = Math.round(total * DEPOSIT * 100) / 100;
    const now = S.plan === 'deposit' ? dep : total;
    return { items, dur, sub, disc, total, dep, now, later: Math.round((total - now) * 100) / 100, from: items.some(s => s.from) };
  }
  const addonInvalid = () => S.sel.includes('corteextra') && !S.sel.some(id => ADDON_OK.includes(id));

  /* ---------- passo 1 · serviços ---------- */
  function vServices() {
    return `<h1 class="bk-h" id="bk-title" tabindex="-1">Serviços</h1>
      <div class="bk-chips" role="tablist" aria-label="Categorias">${D.categories.map(c =>
        `<button class="bk-chip${c.id === S.cat ? ' is-active' : ''}" role="tab" aria-selected="${c.id === S.cat}" data-cat="${c.id}">${c.label}</button>`).join('')}</div>
      <div class="bk-list">${listFor(S.cat)}</div>
      <div data-warn>${warnHTML()}</div>`;
  }
  function listFor(cat) {
    return D.services.filter(s => cat === 'destaque' ? s.featured : s.cat === cat).map((s, i) => svcCard(s, i)).join('');
  }
  function svcCard(s, i) {
    const on = S.sel.includes(s.id);
    return `<button class="bk-svc${on ? ' is-on' : ''}" data-svc="${s.id}" aria-pressed="${on}" style="--i:${i}">
      <span>
        <span class="bk-svc__name">${s.name}${s.id === 'balayage' ? '<span class="bk-svc__badge">Mais pedido</span>' : ''}</span>
        <span class="bk-svc__dur">${F.dur(s.dur)}</span>
        <span class="bk-svc__desc">${s.short}</span>
        <span class="bk-svc__price">${s.from ? '<small>desde </small>' : ''}${eurAuto(s.price)}</span>
      </span>
      <span class="bk-svc__add">${icon(on ? 'check' : 'plus')}</span>
    </button>`;
  }
  function warnHTML() {
    return addonInvalid()
      ? `<div class="bk-note">${icon('info')}<span>O Corte Extra é feito em conjunto com outro serviço, como Balayage, Manutenção ou Coloração.</span></div>`
      : '';
  }
  function toggleService(id, btn) {
    const i = S.sel.indexOf(id);
    if (i > -1) S.sel.splice(i, 1); else S.sel.push(id);
    S.time = null;
    const on = i === -1;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on);
    $('.bk-svc__add', btn).innerHTML = icon(on ? 'check' : 'plus');
    const w = $('[data-warn]', main);
    if (w) w.innerHTML = warnHTML();
    renderSummary();
  }

  /* ---------- passo 2 · profissional ---------- */
  function vPros() {
    return `<h1 class="bk-h" id="bk-title" tabindex="-1">Selecionar profissional</h1>
      <div class="bk-pros">
        <button class="bk-pro${S.pro === 'any' ? ' is-on' : ''}" data-pro="any" style="--i:0">
          <span class="bk-pro__av">${icon('users')}</span><b>Qualquer profissional</b><small>Para a máxima disponibilidade</small>
        </button>
        <button class="bk-pro${S.pro === 'beethoven' ? ' is-on' : ''}" data-pro="beethoven" style="--i:1">
          <span class="bk-pro__av"><img src="/beethoven/assets/img/beethoven-avatar.webp" alt=""></span><b>Beethoven</b><small>Balayage Artist &amp; Visagista</small>
          <span class="bk-pro__rate">${icon('star')}5,0</span>
        </button>
      </div>`;
  }

  /* ---------- passo 3 · hora ---------- */
  function vTime() {
    const days = dayList();
    if (!S.date) S.date = days.find(d => (slotsFor(d) || []).length) || days[0];
    return `<h1 class="bk-h" id="bk-title" tabindex="-1">Selecionar hora</h1>
      <div class="bk-month"><b data-month>${fmtMonth(S.date)}</b><div>
        <button class="bk-round" data-shift="-1" aria-label="Dias anteriores">${icon('chev-l')}</button>
        <button class="bk-round" data-shift="1" aria-label="Dias seguintes">${icon('chev-r')}</button>
      </div></div>
      <div class="bk-days">${days.map(dayBtn).join('')}</div>
      <div data-slots>${vSlots()}</div>`;
  }
  function dayBtn(d) {
    const sl = slotsFor(d), closed = sl === null, full = !!sl && !sl.length;
    const on = dayKey(d) === dayKey(S.date);
    const label = fmtLong(d) + (closed ? ', fechado' : full ? ', sem vagas' : '');
    return `<button class="bk-day${on ? ' is-on' : ''}${full ? ' is-full' : ''}" data-day="${dayKey(d)}" aria-label="${label}" aria-pressed="${on}"${closed ? ' disabled' : ''}>
      <span class="bk-day__n">${d.getDate()}</span><small>${fmtWk(d)}</small></button>`;
  }
  function empty(title, text, action) {
    return `<div class="bk-empty">${icon('cal')}<b>${title}</b><p>${text}</p>${action || ''}</div>`;
  }
  function vSlots() {
    const { dur } = totals();
    if (dur > MAX_DAY) {
      return empty('Duração demasiado longa', 'Os serviços escolhidos ultrapassam um dia de atelier. Retire um serviço ou fale connosco pelo WhatsApp.',
        `<a class="btn btn--dark" href="${D.business.whatsapp}" target="_blank" rel="noopener">${icon('wa')}Falar no WhatsApp</a>`);
    }
    const sl = slotsFor(S.date) || [];
    if (!sl.length) {
      const nx = nextAvailable(S.date);
      return empty('Totalmente reservado', `Não há horários livres para ${fmtLong(S.date)}.`,
        nx ? `<button class="btn btn--dark" data-goto="${dayKey(nx)}">Próxima data: ${fmtLong(nx)}</button>` : '');
    }
    const groups = [['Manhã', m => m < 720], ['Tarde', m => m >= 720 && m < 1080], ['Fim do dia', m => m >= 1080]]
      .map(([label, test]) => [label, sl.filter(test)]).filter(g => g[1].length);
    let n = 0;
    return groups.map(([label, items]) => `<p class="bk-period">${label}</p><div class="bk-times">${items.map(m =>
      `<button class="bk-time${S.time === m ? ' is-on' : ''}" data-time="${m}" aria-pressed="${S.time === m}" style="--i:${n++}">${F.hhmm(m)}<small>até ${F.hhmm(m + dur)}</small></button>`).join('')}</div>`).join('');
  }
  function selectDay(k) {
    S.date = parseKey(k);
    S.time = null;
    $$('.bk-day', main).forEach(b => { const on = b.dataset.day === k; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
    $('[data-slots]', main).innerHTML = vSlots();
    $('[data-month]', main).textContent = fmtMonth(S.date);
    centerDay();
    renderSummary();
  }
  function centerDay() {
    const strip = $('.bk-days', main), d = $('.bk-day.is-on', main);
    if (strip && d) strip.scrollLeft = d.offsetLeft - strip.clientWidth / 2 + d.clientWidth / 2;
  }

  /* ---------- passo 4 · confirmar e pagar ---------- */
  function field(k, label, type, ac, ph, full) {
    return `<div class="bk-field${full ? ' full' : ''}" data-fw="${k}"><label for="bk-${k}">${label}</label>
      <input id="bk-${k}" class="bk-input" data-f="${k}" type="${type}" autocomplete="${ac}" placeholder="${ph}" value="${esc(S.form[k])}"></div>`;
  }
  function vConfirm() {
    const t = totals(), f = S.form;
    return `<h1 class="bk-h" id="bk-title" tabindex="-1">Rever e confirmar</h1>
    <form class="bk-form" novalidate onsubmit="return false">
      <section class="bk-card">
        <h3>${icon('user')}Os seus dados</h3>
        <div class="bk-grid">
          ${field('first', 'Nome', 'text', 'given-name', 'Ex.: Joana')}
          ${field('last', 'Apelido', 'text', 'family-name', 'Ex.: Silva')}
          <div class="bk-field full" data-fw="phone"><label for="bk-phone">Telemóvel</label>
            <div class="bk-phone">
              <select class="bk-input bk-select" data-f="cc" aria-label="Indicativo do país">${CC.map(([c, n]) => `<option value="${c}"${f.cc === c ? ' selected' : ''}>${n} ${c}</option>`).join('')}</select>
              <input id="bk-phone" class="bk-input" data-f="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="912 345 678" value="${esc(f.phone)}">
            </div></div>
          ${field('email', 'Email', 'email', 'email', 'nome@email.com', true)}
          <div class="bk-field full"><label for="bk-notes">Pedidos especiais <span style="color:var(--b-mute);font-weight:500">(opcional)</span></label>
            <textarea id="bk-notes" class="bk-input" data-f="notes" placeholder="Ex.: pintei o cabelo de preto há 6 meses; tenho o couro cabeludo sensível…">${esc(f.notes)}</textarea></div>
        </div>
      </section>

      <section class="bk-card">
        <h3>${icon('wallet')}Pagamento<span class="bk-lock">${icon('lock')}Seguro</span></h3>
        <div class="bk-plans" role="radiogroup" aria-label="Quanto pagar agora">
          <label class="bk-plan"><input type="radio" name="plan" value="deposit"${S.plan === 'deposit' ? ' checked' : ''}><span class="bk-radio"></span>
            <span class="bk-plan__txt"><b>Pagar sinal agora<span class="bk-plan__tag">Recomendado</span></b><small>30% garante a vaga · o restante paga no atelier</small></span>
            <span class="bk-plan__amt" data-amt="deposit">${eur2(t.dep)}</span></label>
          <label class="bk-plan"><input type="radio" name="plan" value="full"${S.plan === 'full' ? ' checked' : ''}><span class="bk-radio"></span>
            <span class="bk-plan__txt"><b>Pagar o valor total</b><small>Fica tudo tratado antes da visita</small></span>
            <span class="bk-plan__amt" data-amt="full">${eur2(t.total)}</span></label>
        </div>

        <p class="bk-sh" style="font-size:16px;margin:24px 0 12px">Método de pagamento</p>
        <div class="bk-methods" role="tablist" aria-label="Método de pagamento">
          <button type="button" class="bk-method${S.method === 'card' ? ' is-on' : ''}" data-method="card" role="tab" aria-selected="${S.method === 'card'}">${icon('card')}Cartão</button>
          <button type="button" class="bk-method${S.method === 'mbway' ? ' is-on' : ''}" data-method="mbway" role="tab" aria-selected="${S.method === 'mbway'}"><span class="bk-mbw">MB WAY</span>MB WAY</button>
          <button type="button" class="bk-method${S.method === 'wallet' ? ' is-on' : ''}" data-method="wallet" role="tab" aria-selected="${S.method === 'wallet'}">${icon('mobile')}Apple / Google Pay</button>
        </div>

        <div class="bk-pane${S.method === 'card' ? ' is-on' : ''}" data-pane="card">
          <div class="bk-cardwrap"><div class="bk-cc" data-brand="">
            <div class="bk-cc__face">
              <span class="bk-cc__logo">beethoven<svg aria-hidden="true"><use href="#i-ast"/></svg></span>
              <span class="bk-cc__brand" data-cc="brand"></span>
              <span class="bk-cc__chip"></span>
              <span class="bk-cc__num" data-cc="num">•••• •••• •••• ••••</span>
              <div class="bk-cc__row"><div><small>Titular</small><span data-cc="name">Nome Apelido</span></div><div><small>Validade</small><span data-cc="exp">MM/AA</span></div></div>
            </div>
            <div class="bk-cc__face bk-cc__back">
              <div class="bk-cc__strip"></div>
              <div class="bk-cc__cvc" data-cc="cvc">•••</div>
              <p>Os dados do cartão são encriptados e nunca ficam guardados no atelier.</p>
            </div>
          </div></div>
          <div class="bk-grid">
            <div class="bk-field full" data-fw="cardnum"><label for="bk-cardnum">Número do cartão</label>
              <div class="bk-input-ico"><input id="bk-cardnum" class="bk-input" data-c="cardnum" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456"><span data-cc="brand2"></span></div></div>
            <div class="bk-field" data-fw="exp"><label for="bk-exp">Validade</label>
              <input id="bk-exp" class="bk-input" data-c="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA"></div>
            <div class="bk-field" data-fw="cvc"><label for="bk-cvc">CVC</label>
              <input id="bk-cvc" class="bk-input" data-c="cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="123"></div>
            <div class="bk-field full" data-fw="ccname"><label for="bk-ccname">Nome no cartão</label>
              <input id="bk-ccname" class="bk-input" data-c="ccname" autocomplete="cc-name" placeholder="Como aparece no cartão"></div>
          </div>
          <button type="button" class="bk-test" data-test>${icon('spark')}Preencher com dados de teste</button>
        </div>

        <div class="bk-pane${S.method === 'mbway' ? ' is-on' : ''}" data-pane="mbway">
          <div class="bk-field" data-fw="mbway"><label for="bk-mbway">Número MB WAY</label>
            <div class="bk-phone"><span class="bk-prefix">+351</span>
              <input id="bk-mbway" class="bk-input" data-c="mbway" type="tel" inputmode="numeric" placeholder="912 345 678" value="${esc(f.cc === '+351' ? f.phone : '')}"></div></div>
          <div class="bk-note">${icon('info')}<span>Vai receber uma notificação na app MB WAY para aceitar o pagamento. Tem 4 minutos para confirmar.</span></div>
        </div>

        <div class="bk-pane${S.method === 'wallet' ? ' is-on' : ''}" data-pane="wallet">
          <button type="button" class="bk-wallet-btn" data-next>${icon('wallet')}Pagar com Apple Pay ou Google Pay</button>
          <div class="bk-note">${icon('info')}<span>Confirme o pagamento com Face ID, Touch ID ou impressão digital no seu dispositivo.</span></div>
        </div>

        <p class="bk-secure">${icon('lock')}Pagamento encriptado · Modo de demonstração: não é feita nenhuma cobrança real.</p>
      </section>

      <section class="bk-card">
        <h3>${icon('tag')}Código promocional</h3>
        <div class="bk-promo">
          <input class="bk-input" data-f="promo" placeholder="Ex.: BEETHOVEN10" aria-label="Código promocional" value="${esc(S.promo || f.promo)}">
          <button type="button" class="btn btn--ghost" data-promo>Aplicar</button>
        </div>
        <div class="bk-promo-ok${S.promo ? ' is-on' : ''}" data-promo-ok>${icon('check')}<span>Código ${esc(S.promo || '')} aplicado · −10%</span></div>
      </section>

      <section class="bk-card">
        <h3>${icon('info')}Política de cancelamento</h3>
        <p class="bk-policy">Pode cancelar ou reagendar <b>sem custos até 24 horas antes</b>. Depois disso, ou em caso de falta, o sinal não é reembolsado. O valor final pode variar com o comprimento e a densidade do cabelo.</p>
        <label class="bk-check" data-fw="terms"><input type="checkbox" data-f="terms"${f.terms ? ' checked' : ''}><span class="bk-box">${icon('check')}</span><span>Li e aceito a política de cancelamento e os termos de marcação.</span></label>
        <label class="bk-check" style="margin-top:12px"><input type="checkbox" data-f="news"${f.news ? ' checked' : ''}><span class="bk-box">${icon('check')}</span><span>Quero receber lembretes de manutenção e novidades do atelier.</span></label>
      </section>
    </form>`;
  }

  const brandOf = n => /^3[47]/.test(n) ? 'amex' : /^4/.test(n) ? 'visa' : /^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/.test(n) ? 'mastercard' : '';
  const brandHTML = b => b === 'visa' ? '<span class="bk-brand bk-brand--visa">VISA</span>'
    : b === 'mastercard' ? '<span class="bk-brand bk-brand--mastercard"><i></i><i></i></span>'
    : b === 'amex' ? '<span class="bk-brand bk-brand--amex">AMEX</span>' : '';
  const brandName = b => ({ visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex' }[b] || 'Cartão');
  const cval = k => { const i = $(`[data-c="${k}"]`, main); return i ? i.value : ''; };

  function formatCard(input) {
    const raw = input.value.replace(/\D/g, '');
    const b = brandOf(raw);
    const digits = raw.slice(0, b === 'amex' ? 15 : 16);
    input.value = b === 'amex'
      ? [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10)].filter(Boolean).join(' ')
      : digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    const cc = $('.bk-cc', main);
    cc.dataset.brand = b;
    $('[data-cc="brand"]', main).innerHTML = brandHTML(b);
    $('[data-cc="brand2"]', main).innerHTML = brandHTML(b);
    const mask = b === 'amex' ? '•••• •••••• •••••' : '•••• •••• •••• ••••';
    let out = '', di = 0;
    for (const ch of mask) out += ch === '•' ? (digits[di++] || '•') : ch;
    $('[data-cc="num"]', main).textContent = out;
  }
  function formatExp(input, e) {
    let v = input.value.replace(/\D/g, '').slice(0, 4);
    if (v.length === 1 && +v > 1) v = '0' + v;
    const deleting = e && e.inputType && e.inputType.startsWith('delete');
    input.value = v.length >= 3 || (v.length === 2 && !deleting) ? v.slice(0, 2) + '/' + v.slice(2) : v;
    $('[data-cc="exp"]', main).textContent = input.value || 'MM/AA';
  }

  function updateAmounts() {
    const t = totals();
    const dep = $('[data-amt="deposit"]', main), full = $('[data-amt="full"]', main);
    if (dep) dep.textContent = eur2(t.dep);
    if (full) full.textContent = eur2(t.total);
  }

  function fillTest() {
    const set = (sel, v) => { const i = $(sel, main); if (i && !i.value) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } };
    set('[data-f="first"]', 'Joana');
    set('[data-f="last"]', 'Silva');
    set('[data-f="phone"]', '912 345 678');
    set('[data-f="email"]', 'joana.silva@email.pt');
    const card = $('[data-c="cardnum"]', main);
    card.value = '4242424242424242'; card.dispatchEvent(new Event('input', { bubbles: true }));
    const exp = $('[data-c="exp"]', main);
    exp.value = '1229'; exp.dispatchEvent(new Event('input', { bubbles: true }));
    const cvc = $('[data-c="cvc"]', main);
    cvc.value = '123'; cvc.dispatchEvent(new Event('input', { bubbles: true }));
    const nm = $('[data-c="ccname"]', main);
    nm.value = `${S.form.first || 'Joana'} ${S.form.last || 'Silva'}`; nm.dispatchEvent(new Event('input', { bubbles: true }));
    const terms = $('[data-f="terms"]', main);
    if (!terms.checked) { terms.checked = true; terms.dispatchEvent(new Event('input', { bubbles: true })); }
  }

  function applyPromo() {
    const code = (S.form.promo || '').trim().toUpperCase();
    if (!code) return;
    S.promo = code;
    const box = $('[data-promo-ok]', main);
    box.classList.add('is-on');
    $('span', box).textContent = `Código ${code} aplicado · −${Math.round((PROMOS[code] || 0.10) * 100)}%`;
    updateAmounts();
    renderSummary();
  }

  /* ---------- pagamento (simulado) ---------- */
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  function clearTimers() { timers.forEach(clearTimeout); timers = []; clearInterval(mbTimer); }
  function showProc(html) { proc.innerHTML = html; proc.classList.add('is-on'); proc.setAttribute('aria-hidden', 'false'); }
  function hideProc() { proc.classList.remove('is-on'); proc.setAttribute('aria-hidden', 'true'); }
  const setMsg = m => { const p = $('[data-pmsg]', proc); if (p) p.textContent = m; };

  function pay() {
    const t = totals();
    let methodLabel = 'Apple Pay / Google Pay';
    if (S.method === 'card') {
      const n = cval('cardnum').replace(/\D/g, '');
      methodLabel = `${brandName(brandOf(n) || 'visa')} •••• ${n.length >= 4 ? n.slice(-4) : '4242'}`;
    } else if (S.method === 'mbway') {
      const mb = cval('mbway').replace(/\D/g, '');
      methodLabel = `MB WAY · ••• ••• ${mb.length >= 3 ? mb.slice(-3) : '•••'}`;
    }

    const finish = () => {
      S.done = Object.assign({}, t, {
        ref: 'BTV-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
        first: (S.form.first || '').trim(), email: (S.form.email || '').trim(), methodLabel, promo: S.promo,
        date: S.date, time: S.time,
      });
      hideProc();
      S.step = 4;
      render();
    };

    if (S.method === 'mbway') {
      const TOTAL = 240;
      let left = TOTAL;
      const num = cval('mbway').replace(/\D/g, '');
      showProc(`<div class="bk-proc__box bk-mbway" role="alertdialog" aria-label="Confirmar MB WAY">
        <span class="bk-mbw" style="height:28px;font-size:13px;padding:0 10px">MB WAY</span>
        <div class="bk-mbway__ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54"/><circle cx="60" cy="60" r="54" data-ring/></svg><span data-left>4:00</span></div>
        <b>Confirme na app MB WAY</b>
        <p data-pmsg>Enviámos um pedido de ${eur2(t.now)} para ${num.length >= 6 ? `+351 ${num.slice(0, 3)} ••• ${num.slice(-3)}` : 'o seu telemóvel'}. Abra a app e aceite o pagamento.</p>
        <button type="button" class="btn btn--ghost" data-cancel-pay>Cancelar</button>
      </div>`);
      const ring = $('[data-ring]', proc), lbl = $('[data-left]', proc);
      mbTimer = setInterval(() => {
        left--;
        lbl.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
        ring.style.strokeDashoffset = 339 * (1 - left / TOTAL);
      }, 1000);
      later(() => { clearInterval(mbTimer); setMsg('Pagamento aceite. A confirmar a sua marcação…'); }, 5200);
      later(finish, 6400);
      return;
    }

    const msgs = S.method === 'card'
      ? ['A validar o cartão…', 'A autenticar com o banco (3-D Secure)…', 'A confirmar a sua marcação…']
      : ['A aguardar confirmação no dispositivo…', 'A autorizar o pagamento…', 'A confirmar a sua marcação…'];
    showProc(`<div class="bk-proc__box" role="alertdialog" aria-label="A processar pagamento"><div class="bk-spin"></div><b>A processar o pagamento</b><p data-pmsg>${msgs[0]}</p></div>`);
    later(() => setMsg(msgs[1]), 1000);
    later(() => setMsg(msgs[2]), 2100);
    later(finish, 3100);
  }

  /* ---------- sucesso ---------- */
  function whenHTML(date, time, dur, withAddress) {
    return `<div class="bk-when">
      <div>${icon('cal')}<span>${fmtLong(date)}</span></div>
      <div>${icon('clock')}<span>${F.hhmm(time)} às ${F.hhmm(time + dur)} (${F.dur(dur)})</span></div>
      <div>${icon('user')}<span>Com Beethoven</span></div>
      ${withAddress ? `<div>${icon('pin')}<span>${D.business.street}, ${D.business.city}</span></div>` : ''}
    </div>`;
  }
  function linesHTML(items, disc, promo) {
    return `<div class="bk-lines">${items.map(s => `<div class="bk-line"><span><b>${s.name}</b><small>${F.dur(s.dur)} · com Beethoven</small></span><span>${s.from ? '<small>desde </small>' : ''}${eurAuto(s.price)}</span></div>`).join('')}
      ${disc ? `<div class="bk-line bk-line--disc"><span>Desconto ${esc(promo)}</span><span>−${eur2(disc)}</span></div>` : ''}</div>`;
  }
  function vDone() {
    const b = S.done;
    const bursts = Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2, r = 80 + (i % 3) * 26;
      return `<svg class="bk-burst" style="--x:${(Math.cos(a) * r).toFixed(1)}px;--y:${(Math.sin(a) * r).toFixed(1)}px" aria-hidden="true"><use href="#i-ast"/></svg>`;
    }).join('');
    return `<div class="bk-done">
      <div class="bk-done__check">${bursts}<svg class="bk-done__svg" viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="50"/><path d="M33 53l13 13 26-28"/></svg></div>
      <h2 id="bk-title" tabindex="-1">Marcação confirmada!</h2>
      <p>${b.first ? `Obrigado, ${esc(b.first)}. ` : 'Obrigado! '}Enviámos os detalhes e o recibo ${b.email ? `para <b>${esc(b.email)}</b>` : 'por email'}.</p>
      <div class="bk-receipt">
        <div class="bk-receipt__head"><span>Referência <b>${b.ref}</b></span><span class="bk-receipt__ok">${icon('check')}Pago</span></div>
        <div class="bk-receipt__body">
          ${whenHTML(b.date, b.time, b.dur, true)}
          ${linesHTML(b.items, b.disc, b.promo)}
          <div class="bk-receipt__pay">
            <div><span>Pago agora</span><span>${eur2(b.now)}</span></div>
            <div><span>Método</span><span>${esc(b.methodLabel)}</span></div>
            <div><span>A pagar no atelier</span><span>${b.from && b.later ? 'desde ' : ''}${eur2(b.later)}</span></div>
          </div>
        </div>
      </div>
      <div class="bk-done__actions">
        <button class="btn btn--dark" data-ics>${icon('cal')}Adicionar ao calendário</button>
        <a class="btn btn--ghost" href="${D.business.mapsUrl}" target="_blank" rel="noopener">${icon('pin')}Como chegar</a>
        <button class="btn btn--ghost" data-done-close>Voltar ao site</button>
      </div>
    </div>`;
  }
  function downloadICS() {
    const b = S.done;
    const st = new Date(b.date); st.setHours(0, b.time, 0, 0);
    const en = new Date(st.getTime() + b.dur * 60000);
    const f = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsEsc = s => s.replace(/[,;\\]/g, m => '\\' + m);
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LABOR B Beethoven Atelier//Marcacoes//PT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', `UID:${b.ref}@beethoven-atelier`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(st)}`, `DTEND:${f(en)}`,
      `SUMMARY:${icsEsc(b.items.map(s => s.name).join(' + '))} · Beethoven`,
      `LOCATION:${icsEsc(D.business.street + ', ' + D.business.city)}`,
      `DESCRIPTION:${icsEsc(`Marcação ${b.ref}. Pago: ${eur2(b.now)}. A pagar no atelier: ${eur2(b.later)}.`)}`,
      'BEGIN:VALARM', 'TRIGGER:-PT24H', 'ACTION:DISPLAY', 'DESCRIPTION:Amanhã tem marcação no atelier do Beethoven', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `marcacao-${b.ref}.ics` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  /* ---------- resumo ---------- */
  function ctaState() {
    const t = totals();
    switch (S.step) {
      case 0: return { label: 'Continuar', short: 'Continuar', off: !t.items.length };
      case 1: return { label: 'Continuar', short: 'Continuar', off: !S.pro };
      case 2: return { label: 'Continuar', short: 'Continuar', off: S.time == null };
      case 3: return { label: `Confirmar e pagar ${eur2(t.now)}`, short: `Pagar ${eur2(t.now)}`, off: false };
      default: return { label: '', short: '', off: true };
    }
  }
  function vSummary() {
    const t = totals(), st = ctaState();
    const when = S.date && S.time != null
      ? whenHTML(S.date, S.time, t.dur, false)
      : S.pro ? `<div class="bk-when"><div>${icon('user')}<span>Com Beethoven</span></div></div>` : '';
    const lines = t.items.length ? linesHTML(t.items, t.disc, S.promo) : `<p class="bk-sum-empty">Ainda não escolheu nenhum serviço.</p>`;
    const total = t.items.length
      ? `<div class="bk-total"><span>Total</span><span>${t.from ? '<small style="font-weight:500;color:var(--b-mute);font-size:13px">desde </small>' : ''}${eurAuto(t.total)}</span></div>` : '';
    const paynow = S.step === 3 && t.items.length
      ? `<div class="bk-paynow"><div><span>A pagar agora</span><span>${eur2(t.now)}</span></div><div><span>No atelier, no dia</span><span>${eur2(t.later)}</span></div></div>` : '';
    return `<div class="bk-sum">
      <div class="bk-biz"><img src="/beethoven/assets/img/beethoven-wide.webp" alt="">
        <span><b>Beethoven · LABOR B Atelier</b><span class="bk-stars">5,0 ${stars}<small style="display:inline;color:var(--b-mute);font-weight:500">(10)</small></span><small>${D.business.street}, Porto</small></span></div>
      ${when}${lines}${total}${paynow}
      <button class="btn btn--dark btn--lg" data-next${st.off ? ' disabled' : ''}>${st.label}</button>
    </div>`;
  }
  function vMbar() {
    const t = totals(), st = ctaState(), n = t.items.length;
    return `<button class="bk-mbar__sum" data-sheet aria-label="Ver resumo da marcação">
        <b>${n ? (t.from ? 'desde ' : '') + eurAuto(t.total) : 'Sem serviços'}</b>
        <small>${n} serviço${n === 1 ? '' : 's'}${n ? ' · ' + F.dur(t.dur) : ''}${icon('chev-d')}</small>
      </button>
      <button class="btn btn--dark" data-next${st.off ? ' disabled' : ''}>${st.short}</button>`;
  }
  function renderSummary() {
    aside.innerHTML = S.step === 4 ? '' : vSummary();
    mbar.innerHTML = S.step === 4 ? '' : vMbar();
  }
  function vCrumbs() {
    return STEPS.map((n, i) => `${i ? icon('chev-r') : ''}<button class="${i === S.step ? 'is-active' : ''}${i < S.step ? ' is-done' : ''}" data-crumb="${i}"${i < S.step ? '' : ' disabled'}${i === S.step ? ' aria-current="step"' : ''}>${n}</button>`).join('')
      + `<span class="bk-crumb-step">· ${S.step + 1} de ${STEPS.length}</span>`;
  }

  /* ---------- render ---------- */
  function render(dir) {
    el.classList.toggle('bk-done-mode', S.step === 4);
    el.classList.remove('is-sheet');
    crumbs.innerHTML = S.step === 4 ? '<button class="is-active" disabled>Marcação confirmada</button>' : vCrumbs();
    $('.bk-back', el).style.visibility = S.step === 4 ? 'hidden' : '';
    main.innerHTML = [vServices, vPros, vTime, vConfirm, vDone][S.step]();
    main.classList.remove('is-enter', 'is-back');
    void main.offsetWidth;
    main.classList.add('is-enter');
    if (dir < 0) main.classList.add('is-back');
    renderSummary();
    bodyEl.scrollTop = 0;
    if (S.step === 2) requestAnimationFrame(centerDay);
    const h = $('#bk-title', main);
    if (h && el.classList.contains('is-open')) h.focus({ preventScroll: true });
  }
  function go(i) {
    const dir = i >= S.step ? 1 : -1;
    S.step = i;
    render(dir);
  }
  function next() {
    const st = ctaState();
    if (S.step === 3) return pay();
    if (st.off) return;
    go(S.step + 1);
  }
  function back() {
    if (S.step === 0) close();
    else if (S.step < 4) go(S.step - 1);
  }

  /* ---------- abrir / fechar ---------- */
  function open(pre) {
    reset(pre);
    lastFocus = document.activeElement;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('is-locked');
    if (window.__lenis) window.__lenis.stop();
    render(1);
  }
  function close() {
    clearTimers();
    hideProc();
    el.classList.remove('is-open', 'is-sheet');
    el.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('is-locked');
    if (window.__lenis) window.__lenis.start();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    if (S && S.done && window.BTVtoast) window.BTVtoast(`${S.done.first ? `Até breve, ${S.done.first}! ` : ''}Marcação ${S.done.ref} confirmada ✱`);
  }

  /* ---------- eventos ---------- */
  el.addEventListener('click', e => {
    const t = e.target.closest('button, a');
    if (!t || !el.contains(t)) {
      if (el.classList.contains('is-sheet') && !e.target.closest('.bk-aside')) el.classList.remove('is-sheet');
      return;
    }
    const ds = t.dataset;
    if (t.classList.contains('bk-close')) return close();
    if (t.classList.contains('bk-back')) return back();
    if ('next' in ds) return next();
    if ('crumb' in ds) return go(+ds.crumb);
    if ('sheet' in ds) return el.classList.toggle('is-sheet');
    if (ds.cat) {
      S.cat = ds.cat;
      $$('.bk-chip', main).forEach(c => { const on = c.dataset.cat === S.cat; c.classList.toggle('is-active', on); c.setAttribute('aria-selected', on); });
      $('.bk-list', main).innerHTML = listFor(S.cat);
      return;
    }
    if (ds.svc) return toggleService(ds.svc, t);
    if (ds.pro) {
      S.pro = ds.pro;
      $$('.bk-pro', main).forEach(p => p.classList.toggle('is-on', p === t));
      renderSummary();
      later(() => go(2), 320);
      return;
    }
    if (ds.day) return selectDay(ds.day);
    if (ds.goto) return selectDay(ds.goto);
    if (ds.shift) {
      const strip = $('.bk-days', main);
      strip.scrollBy({ left: +ds.shift * strip.clientWidth * 0.85, behavior: 'smooth' });
      return;
    }
    if (ds.time) {
      S.time = +ds.time;
      $$('.bk-time', main).forEach(b => { const on = b === t; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
      renderSummary();
      return;
    }
    if (ds.method) {
      S.method = ds.method;
      $$('.bk-method', main).forEach(b => { const on = b.dataset.method === S.method; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
      $$('.bk-pane', main).forEach(p => p.classList.toggle('is-on', p.dataset.pane === S.method));
      const mb = $('[data-c="mbway"]', main);
      if (S.method === 'mbway' && mb && !mb.value && S.form.cc === '+351') mb.value = S.form.phone || '';
      return;
    }
    if ('promo' in ds) return applyPromo();
    if ('test' in ds) return fillTest();
    if ('cancelPay' in ds) { clearTimers(); hideProc(); if (window.BTVtoast) window.BTVtoast('Pagamento cancelado.'); return; }
    if ('ics' in ds) return downloadICS();
    if ('doneClose' in ds) return close();
  });

  el.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.f) {
      S.form[t.dataset.f] = t.type === 'checkbox' ? t.checked : t.value;
      return;
    }
    switch (t.dataset.c) {
      case 'cardnum': formatCard(t); break;
      case 'exp': formatExp(t, e); break;
      case 'cvc': t.value = t.value.replace(/\D/g, '').slice(0, 4); $('[data-cc="cvc"]', main).textContent = t.value ? t.value.replace(/./g, '•') : '•••'; break;
      case 'ccname': $('[data-cc="name"]', main).textContent = t.value.trim() || 'Nome Apelido'; break;
      case 'mbway': t.value = t.value.replace(/[^\d ]/g, '').slice(0, 11); break;
    }
  });
  el.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.f) S.form[t.dataset.f] = t.type === 'checkbox' ? t.checked : t.value;
    if (t.name === 'plan') { S.plan = t.value; renderSummary(); }
  });
  el.addEventListener('focusin', e => { if (e.target.dataset.c === 'cvc') $('.bk-cc', main).classList.add('is-flip'); });
  el.addEventListener('focusout', e => { if (e.target.dataset.c === 'cvc') $('.bk-cc', main).classList.remove('is-flip'); });
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('[data-f="promo"]')) { e.preventDefault(); applyPromo(); }
    if (e.key === 'Escape' && !proc.classList.contains('is-on')) {
      if (el.classList.contains('is-sheet')) el.classList.remove('is-sheet'); else close();
    }
    if (e.key === 'Tab') {
      const scope = proc.classList.contains('is-on') ? proc : el;
      const f = $$('button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]', scope).filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // mês acompanha o scroll da faixa de dias
  el.addEventListener('scroll', e => {
    if (!e.target.classList || !e.target.classList.contains('bk-days')) return;
    const strip = e.target;
    const first = $$('.bk-day', strip).find(b => b.offsetLeft + b.clientWidth > strip.scrollLeft);
    if (first) $('[data-month]', main).textContent = fmtMonth(parseKey(first.dataset.day));
  }, true);

  window.BTVbooking = { open, close };
})();
