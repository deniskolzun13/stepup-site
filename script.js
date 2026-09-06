/* =========================================================
   ШАГ — интернет-магазин кроссовок
   script.js — вся логика сайта (каталог, корзина, чекаут,
   админ-панель, модалки, тосты)

   Разделы файла:
   1. Конфигурация и данные по умолчанию
   2. Работа с localStorage (сохранение состояния)
   3. Утилиты (форматирование, экранирование, тост)
   4. Переключение экранов (views)
   5. Каталог: фильтрация / сортировка / рендер карточек
   6. Корзина: добавление, изменение, удаление, рендер
   7. Чекаут: сборка сводки заказа, отправка на e-mail
   8. Модальные окна и подтверждение действий
   9. Админ-панель: товары и заказы
   10. Обработчики событий (делегирование кликов/изменений/сабмитов)
   11. Инициализация страницы
========================================================= */

/* =========================================================
   1. КОНФИГУРАЦИЯ И ДАННЫЕ ПО УМОЛЧАНИЮ
   ⚙ adminEmail — e-mail, на который приходят заказы
   ⚙ adminPass  — пароль входа в админ-панель
========================================================= */
const CONFIG = {
    shopName: 'StepUp',
    adminEmail: 'fakhriddinabdurahimov8@gmail.com',
    adminPass: 'stepup2026',
};

const IMG = {
    p1:'https://image.qwenlm.ai/public_source/74625fe3-b517-4440-bab1-7e88dbedd8a8/19a2757aa-f5de-4282-a049-0073349e75d2.png',
    p2:'https://image.qwenlm.ai/public_source/74625fe3-b517-4440-bab1-7e88dbedd8a8/1bdc45631-3faa-4296-941d-29f1f8a9e21b.png',
    p3:'https://image.qwenlm.ai/public_source/74625fe3-b517-4440-bab1-7e88dbedd8a8/1ede2140c-e3f2-4616-8cd6-1547f84d4e75.png',
    p4:'https://image.qwenlm.ai/public_source/74625fe3-b517-4440-bab1-7e88dbedd8a8/1489ed450-b3f8-48de-9ca1-69c6edaebfcc.png',
    p5:'https://image.qwenlm.ai/public_source/74625fe3-b517-4440-bab1-7e88dbedd8a8/10348dea0-bf75-4836-93da-319ce4752674.png',
    p6:'https://image.qwenlm.ai/public_source/74625fe3-b517-4440-bab1-7e88dbedd8a8/1d6a2301a-684d-4c28-9ace-686bb8b85737.png',
};

const DEFAULT_PRODUCTS = [
    {id:'p1', name:'AirStep Nova White', price:7990, oldPrice:9990, tag:'new', active:true, img:IMG.p1,
        desc:'Лёгкие кроссовки из белой кожи с фирменными оранжевыми акцентами. Амортизирующая подошва для города и долгих прогулок.',
        sizes:[36,37,38,39,40,41,42,43,44]},
    {id:'p2', name:'UrbanMax Black', price:8490, oldPrice:null, tag:'hit', active:true, img:IMG.p2,
        desc:'Массивный раннер в чёрной коже с рефлективными вставками. Массивная подошва и премиальная посадка.',
        sizes:[39,40,41,42,43,44,45]},
    {id:'p3', name:'Court Legend High', price:9990, oldPrice:12490, tag:'sale', active:true, img:IMG.p3,
        desc:'Ретро-хайтопы в духе баскетбольной классики 90-х. Кожа, замша и культовый красно-белый колорвей.',
        sizes:[40,41,42,43,44,45]},
    {id:'p4', name:'TrailPeak Suede', price:10490, oldPrice:null, tag:'new', active:true, img:IMG.p4,
        desc:'Замшевые трейл-раннеры с цепкой резиновой подошвой. Держат любую погоду и покрытие.',
        sizes:[38,39,40,41,42,43,44]},
    {id:'p5', name:'CloudRun Aero', price:7490, oldPrice:null, tag:'hit', active:true, img:IMG.p5,
        desc:'Дышащий сетчатый верх и невесомая подошва — идеальны для бега и зала. Всего 220 г на ногу.',
        sizes:[36,37,38,39,40,41,42,43,44,45,46]},
    {id:'p6', name:'Street Lime Skate', price:6990, oldPrice:8490, tag:'sale', active:true, img:IMG.p6,
        desc:'Скейт-кроссовки с вулканизированной подошвой и усиленным мыском. Лаймовый замш для смелых.',
        sizes:[37,38,39,40,41,42,43]},
];

/* =========================================================
   2. РАБОТА С localStorage
========================================================= */
const LS = {p:'shag_products_v1', c:'shag_cart_v1', o:'shag_orders_v1'};

function load(key, fb){
    try{ const v = JSON.parse(localStorage.getItem(key)); return v ?? fb; }
    catch(e){ return fb; }
}
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

let products = load(LS.p, null) || JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
let cart     = load(LS.c, []);
let orders   = load(LS.o, []);
save(LS.p, products);

let ui = { filter:'all', search:'', sort:'default', adminTab:'products', editId:null };
let confirmCb = null;

/* =========================================================
   3. УТИЛИТЫ
========================================================= */
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('ru-RU') + ' смн';
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

let toastTimer;
function toast(msg, ok){
    $('toastText').textContent = msg;
    $('toast').classList.toggle('ok', !!ok);
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> $('toast').classList.remove('show'), 2800);
}

/* =========================================================
   4. ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ (VIEWS)
========================================================= */
function show(view){
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    $('view-'+view).classList.add('active');
    window.scrollTo({top:0, behavior:'instant'});
}

/* =========================================================
   5. КАТАЛОГ: фильтрация / сортировка / рендер
========================================================= */
function filteredProducts(){
    let list = products.filter(p=>p.active);
    if(ui.filter==='new')  list = list.filter(p=>p.tag==='new');
    if(ui.filter==='hit')  list = list.filter(p=>p.tag==='hit');
    if(ui.filter==='sale') list = list.filter(p=>p.tag==='sale');
    if(ui.search){
        const q = ui.search.toLowerCase();
        list = list.filter(p=> (p.name+' '+p.desc).toLowerCase().includes(q));
    }
    if(ui.sort==='price-asc')  list = [...list].sort((a,b)=>a.price-b.price);
    if(ui.sort==='price-desc') list = [...list].sort((a,b)=>b.price-a.price);
    if(ui.sort==='name')       list = [...list].sort((a,b)=>a.name.localeCompare(b.name,'ru'));
    return list;
}
function tagBadge(p){
    if(p.tag==='new')  return '<span class="badge new">Новинка</span>';
    if(p.tag==='hit')  return '<span class="badge hit">Хит</span>';
    if(p.tag==='sale') return '<span class="badge sale">Скидка</span>';
    return '';
}
function renderCatalog(){
    const list = filteredProducts();
    if(!list.length){
        $('catalogGrid').innerHTML = '<div class="no-results">😕 Ничего не найдено. Попробуйте изменить запрос или фильтр.</div>';
        return;
    }
    $('catalogGrid').innerHTML = list.map(p=>`
    <article class="card" data-card="${p.id}">
      <div class="card-img">${tagBadge(p)}<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" width="400" height="400"></div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <p class="card-desc">${esc(p.desc)}</p>
        <span class="size-label">Размер (EU)</span>
        <div class="sizes" data-sizes="${p.id}">
          ${p.sizes.map(s=>`<button class="size-chip" data-action="size-pick" data-id="${p.id}" data-size="${s}">${s}</button>`).join('')}
        </div>
        <div class="card-foot">
          <div class="price"><b>${fmt(p.price)}</b>${p.oldPrice?`<s>${fmt(p.oldPrice)}</s>`:''}</div>
          <button class="add-btn" data-action="add-cart" data-id="${p.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2 3h3l2.7 12.4A2 2 0 0 0 9.7 17h9.7a2 2 0 0 0 2-1.6L23 7H6"/></svg>
            В корзину
          </button>
        </div>
      </div>
    </article>`).join('');
}

/* =========================================================
   6. КОРЗИНА: добавление / изменение / удаление / рендер
========================================================= */
const cartKey = (id,size)=> id+'_'+size;
function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }
function cartTotal(){ return cart.reduce((s,i)=>{ const p=products.find(x=>x.id===i.id); return s+(p?p.price*i.qty:0); },0); }

function updateBadge(){
    const el = $('cartCount');
    el.textContent = cartCount();
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    $('drawerCount').textContent = cartCount() ? `(${cartCount()})` : '';
}
function addToCart(id, size){
    const key = cartKey(id,size);
    const ex = cart.find(i=>i.key===key);
    if(ex) ex.qty++; else cart.push({key, id, size, qty:1});
    save(LS.c, cart); updateBadge(); renderCart();
}
function renderCart(){
    const body = $('cartBody');
    if(!cart.length){
        body.innerHTML = `<div class="cart-empty"><div class="big">👟</div><p>Корзина пуста</p><span style="font-size:13px">Добавьте пару из каталога</span></div>`;
        $('cartFoot').style.display = 'none';
        return;
    }
    $('cartFoot').style.display = 'block';
    body.innerHTML = cart.map(item=>{
        const p = products.find(x=>x.id===item.id);
        if(!p) return '';
        return `
    <div class="cart-item">
      <img src="${esc(p.img)}" alt="${esc(p.name)}">
      <div>
        <div class="ci-name">${esc(p.name)}</div>
        <div class="ci-meta">${fmt(p.price)} / пара</div>
        <div class="ci-size">Размер:
          <select data-action="cart-size" data-key="${item.key}">
            ${p.sizes.map(s=>`<option value="${s}" ${s===item.size?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="qty" style="margin-top:8px">
          <button data-action="qty" data-d="-1" data-key="${item.key}" aria-label="Меньше">−</button>
          <b>${item.qty}</b>
          <button data-action="qty" data-d="1" data-key="${item.key}" aria-label="Больше">+</button>
        </div>
      </div>
      <div class="ci-right">
        <button class="del-btn" data-action="cart-del" data-key="${item.key}" aria-label="Удалить">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
        <span class="ci-price">${fmt(p.price*item.qty)}</span>
      </div>
    </div>`;
    }).join('');
    $('cartTotal').textContent = fmt(cartTotal());
}
function openCart(){ renderCart(); $('cartDrawer').classList.add('open'); $('overlay').classList.add('open'); document.body.style.overflow='hidden'; }
function closeCart(){ $('cartDrawer').classList.remove('open'); $('overlay').classList.remove('open'); document.body.style.overflow=''; }

/* =========================================================
   7. ЧЕКАУТ: сводка заказа, валидация, отправка на e-mail
========================================================= */
function goCheckout(){
    if(!cart.length){ toast('Корзина пуста — добавьте товары'); return; }
    closeCart();
    $('checkoutSummary').innerHTML = cart.map(item=>{
        const p = products.find(x=>x.id===item.id); if(!p) return '';
        return `<div class="sum-item"><img src="${esc(p.img)}" alt=""><div><b>${esc(p.name)}</b><small>Размер ${item.size} × ${item.qty} шт.</small></div><div style="margin-left:auto;font-weight:800">${fmt(p.price*item.qty)}</div></div>`;
    }).join('') + `<div class="sum-total"><span>Итого к оплате:</span><b>${fmt(cartTotal())}</b></div>
  <p style="font-size:12.5px;color:var(--muted);margin-top:12px">💳 Оплата при получении</p>`;
    show('checkout');
}

async function sendOrderEmail(order){
    try{
        const lines = order.items.map(i=>`${i.name} | размер ${i.size} | ${i.qty} шт. | ${fmt(i.price*i.qty)}`).join('\n');
        const payload = {
            _subject:`🛒 Новый заказ ${order.id} — ${CONFIG.shopName}`,
            _template:'table',
            'Номер заказа': order.id,
            'Дата': new Date(order.date).toLocaleString('ru-RU'),
            'Имя': order.customer.name,
            'Телефон': order.customer.phone,
            'Город': order.customer.city,
            'Адрес доставки': order.customer.address,
            'Комментарий': order.customer.comment || '—',
            'Состав заказа (товар / размер / кол-во / сумма)': lines,
            'ИТОГО': fmt(order.total)
        };
        const r = await fetch('https://formsubmit.co/ajax/'+CONFIG.adminEmail, {
            method:'POST',
            headers:{'Content-Type':'application/json','Accept':'application/json'},
            body: JSON.stringify(payload)
        });
        return r.ok;
    }catch(e){ return false; }
}

function submitOrder(){
    const req = [['fName','Имя'],['fPhone','Телефон'],['fCity','Город'],['fAddress','Адрес']];
    let bad = null;
    req.forEach(([id])=>{ $(id).classList.remove('f-err'); });
    for(const [id] of req){
        const v = $(id).value.trim();
        if(!v || (id==='fPhone' && v.replace(/\D/g,'').length < 10)){ $(id).classList.add('f-err'); bad = bad || id; }
    }
    if(bad){ $(bad).focus(); toast('Заполните обязательные поля корректно'); return; }

    const order = {
        id: 'SH-' + Date.now().toString(36).toUpperCase(),
        date: Date.now(),
        status: 'new',
        customer: {
            name: $('fName').value.trim(), phone: $('fPhone').value.trim(),
            city: $('fCity').value.trim(), address: $('fAddress').value.trim(),
            comment: $('fComment').value.trim()
        },
        items: cart.map(item=>{
            const p = products.find(x=>x.id===item.id);
            return {id:item.id, name:p?p.name:'Товар', size:item.size, qty:item.qty, price:p?p.price:0};
        }),
        total: cartTotal()
    };
    orders.unshift(order); save(LS.o, orders);
    cart = []; save(LS.c, cart); updateBadge(); renderCart();
    $('checkoutForm').reset();
    $('successId').textContent = order.id;
    show('success');
    sendOrderEmail(order).then(ok=>{
        $('successText').textContent = ok
            ? 'Спасибо! Письмо с составом заказа отправлено на e-mail магазина. Мы свяжемся с вами в ближайшее время.'
            : 'Спасибо! Заказ сохранён в админ-панели. Чтобы письма приходили на почту — укажите ваш e-mail в CONFIG (верх скрипта, сервис FormSubmit).';
        toast(ok ? 'Письмо с заказом отправлено на e-mail' : 'Заказ сохранён в админ-панели', ok);
    });
}

/* =========================================================
   8. МОДАЛЬНЫЕ ОКНА / ПОДТВЕРЖДЕНИЕ ДЕЙСТВИЙ
========================================================= */
function openModal(html){ $('modalContent').innerHTML = html; $('modal').classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(){ $('modal').classList.remove('open'); document.body.style.overflow=''; }
function askConfirm(msg, cb){
    confirmCb = cb;
    openModal(`<h3>Подтверждение</h3><p style="margin-bottom:22px;color:var(--ink2)">${msg}</p>
  <div style="display:flex;gap:10px;justify-content:flex-end">
    <button class="btn btn-line" style="padding:11px 20px;font-size:14px" data-action="modal-close">Отмена</button>
    <button class="btn" style="padding:11px 20px;font-size:14px;background:#e03131;color:#fff" data-action="confirm-ok">Удалить</button>
  </div>`);
}

/* =========================================================
   9. АДМИН-ПАНЕЛЬ: вход, товары, заказы
========================================================= */
const isAdmin = ()=> sessionStorage.getItem('shag_admin')==='1';

function adminOpen(){
    if(isAdmin()){ renderAdmin(); show('admin'); return; }
    openModal(`<h3>Вход для администратора</h3>
    <form id="loginForm">
      <div class="f-row"><label>Пароль</label><input type="password" id="loginPass" placeholder="Введите пароль" autofocus></div>
      <button class="btn btn-dark" style="width:100%" type="submit">Войти</button>
    </form>`);
    setTimeout(()=>{ const i=$('loginPass'); i && i.focus(); }, 100);
}

const STATUS = {new:'Новый', progress:'В работе', done:'Выполнен', cancel:'Отменён'};

function renderAdmin(){
    const revenue = orders.filter(o=>o.status!=='cancel').reduce((s,o)=>s+o.total,0);
    $('adminStats').innerHTML = `
    <div class="stat"><b>${products.length}</b><span>Товаров</span></div>
    <div class="stat"><b>${products.filter(p=>p.active).length}</b><span>На сайте</span></div>
    <div class="stat acc"><b>${orders.length}</b><span>Заказов</span></div>
    <div class="stat"><b>${fmt(revenue)}</b><span>Выручка</span></div>`;
    $('ordersTabCount').textContent = orders.length ? `(${orders.length})` : '';
    renderAdminProducts(); renderAdminOrders();
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on', t.dataset.tab===ui.adminTab));
    $('adminProducts').classList.toggle('hidden', ui.adminTab!=='products');
    $('adminOrders').classList.toggle('hidden', ui.adminTab!=='orders');
}

function renderAdminProducts(){
    $('adminProducts').innerHTML = `<div class="a-table">` + (products.map(p=>`
    <div class="a-row">
      <img src="${esc(p.img)}" alt="">
      <div><div class="a-name">${esc(p.name)}</div><div class="a-sub">Размеры: ${p.sizes.join(', ') || '—'}</div></div>
      <div class="a-price">${fmt(p.price)}${p.oldPrice?`<div class="a-sub"><s>${fmt(p.oldPrice)}</s></div>`:''}</div>
      <div><span class="pill ${p.active?'on':'off'}">${p.active?'На сайте':'Скрыт'}</span></div>
      <div class="a-actions">
        <button class="mini-btn" data-action="prod-toggle" data-id="${p.id}">${p.active?'Скрыть':'Показать'}</button>
        <button class="mini-btn" data-action="prod-edit" data-id="${p.id}">Изменить</button>
        <button class="mini-btn danger" data-action="prod-del" data-id="${p.id}">Удалить</button>
      </div>
    </div>`).join('') || '<div class="no-results">Нет товаров</div>') + `</div>`;
}

function renderAdminOrders(){
    if(!orders.length){ $('adminOrders').innerHTML = '<div class="panel" style="text-align:center;color:var(--muted)">Заказов пока нет </div>'; return; }
    $('adminOrders').innerHTML = orders.map(o=>`
    <div class="order-card">
      <div class="order-head">
        <div><b>${o.id}</b><small>${new Date(o.date).toLocaleString('ru-RU')}</small></div>
        <span class="pill st-${o.status}">${STATUS[o.status]}</span>
      </div>
      <div class="order-body">
        <div><h5>Покупатель</h5><p><b>${esc(o.customer.name)}</b><br>📞 ${esc(o.customer.phone)}</p></div>
        <div><h5>Доставка</h5><p>г. ${esc(o.customer.city)}, ${esc(o.customer.address)}${o.customer.comment?`<br>💬 ${esc(o.customer.comment)}`:''}</p></div>
        <div class="order-items"><h5>Состав заказа</h5><ul>
          ${o.items.map(i=>`<li>${esc(i.name)} — размер ${i.size}, ${i.qty} шт. — <b>${fmt(i.price*i.qty)}</b></li>`).join('')}
        </ul></div>
      </div>
      <div class="order-foot">
        <b style="font-family:var(--font-d)">Итого: ${fmt(o.total)}</b>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <select class="sel" data-action="order-status" data-id="${o.id}">
            ${Object.keys(STATUS).map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${STATUS[s]}</option>`).join('')}
          </select>
          <button class="mini-btn danger" data-action="order-del" data-id="${o.id}">Удалить</button>
        </div>
      </div>
    </div>`).join('');
}

function productForm(p){
    const isNew = !p;
    p = p || {name:'', price:'', oldPrice:'', desc:'', img:'', sizes:[40,41,42,43], tag:'', active:true};
    openModal(`<h3>${isNew?'Новый товар':'Редактирование товара'}</h3>
  <form id="productForm">
    <img class="img-preview" id="imgPreview" src="${esc(p.img)||'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><rect width=%22400%22 height=%22300%22 fill=%22%23eee%22/></svg>'}">
    <div class="f-2">
      <div class="f-row"><label>Ссылка на фото</label><input id="pfImg" value="${esc(p.img)}" placeholder="https://…"></div>
      <div class="f-row"><label>Или загрузить файл</label><input type="file" id="pfFile" accept="image/*" style="border:none;padding:8px 0"></div>
    </div>
    <div class="f-row"><label>Название *</label><input id="pfName" value="${esc(p.name)}" placeholder="AirStep Nova"></div>
    <div class="f-2">
      <div class="f-row"><label>Цена, cмн *</label><input id="pfPrice" type="number" min="0" value="${p.price||''}" placeholder="7990"></div>
      <div class="f-row"><label>Старая цена, cмн</label><input id="pfOld" type="number" min="0" value="${p.oldPrice||''}" placeholder="9990"></div>
    </div>
    <div class="f-row"><label>Плашка на карточке товара</label>
      <select id="pfTag" class="sel" style="width:100%">
        <option value="" ${!p.tag?'selected':''}>Без плашки</option>
        <option value="new" ${p.tag==='new'?'selected':''}>Новинка</option>
        <option value="hit" ${p.tag==='hit'?'selected':''}>Хит продаж</option>
        <option value="sale" ${p.tag==='sale'?'selected':''}>Скидка</option>
      </select>
    </div>
    <div class="f-row"><label>Описание</label><textarea id="pfDesc" style="width:100%;border:2px solid var(--line);border-radius:12px;padding:12px 14px;min-height:76px;font-weight:600">${esc(p.desc)}</textarea></div>
    <div class="f-row"><label>Размеры в наличии (EU)</label>
      <div class="size-checks">
        ${[36,37,38,39,40,41,42,43,44,45,46].map(s=>`<label><input type="checkbox" name="pfSize" value="${s}" ${p.sizes.includes(s)?'checked':''}><span>${s}</span></label>`).join('')}
      </div>
    </div>
    <div class="f-row"><label class="switch"><input type="checkbox" id="pfActive" ${p.active?'checked':''}><i></i>Показывать на сайте</label></div>
    <button class="btn btn-acc" style="width:100%" type="submit">${isNew?'Добавить товар':'Сохранить'}</button>
  </form>`);
    $('pfImg').addEventListener('input', e=>{ if(e.target.value) $('imgPreview').src = e.target.value; });
    $('pfFile').addEventListener('change', e=>{
        const f = e.target.files[0]; if(!f) return;
        const rd = new FileReader();
        rd.onload = ()=>{ $('imgPreview').src = rd.result; $('pfImg').value = rd.result; };
        rd.readAsDataURL(f);
    });
}

function saveProduct(){
    const name = $('pfName').value.trim();
    const price = parseInt($('pfPrice').value,10);
    if(!name || !price){ toast('Укажите название и цену'); return; }
    const sizes = [...document.querySelectorAll('input[name="pfSize"]:checked')].map(i=>+i.value).sort((a,b)=>a-b);
    const data = {
        name, price,
        oldPrice: parseInt($('pfOld').value,10) || null,
        tag: $('pfTag').value,
        desc: $('pfDesc').value.trim(),
        img: $('pfImg').value.trim(),
        sizes, active: $('pfActive').checked
    };
    if(!data.img){ toast('Добавьте фото товара'); return; }
    if(ui.editId){
        const idx = products.findIndex(p=>p.id===ui.editId);
        if(idx>-1) products[idx] = {...products[idx], ...data};
        toast('Товар обновлён', true);
    }else{
        products.push({id:'p'+Date.now().toString(36), ...data});
        toast('Товар добавлен в каталог', true);
    }
    save(LS.p, products); closeModal(); renderCatalog(); renderAdmin();
}

/* =========================================================
   10. ОБРАБОТЧИКИ СОБЫТИЙ (делегирование через data-action)
========================================================= */
document.addEventListener('click', e=>{
    const el = e.target.closest('[data-action]');
    if(!el) return;
    const a = el.dataset.action;
    const id = el.dataset.id;

    if(a==='go-home'){ show('home'); window.scrollTo({top:0,behavior:'smooth'}); }
    if(a==='scroll-to'){
        if(!$('view-home').classList.contains('active')) show('home');
        setTimeout(()=>{ const t=$(el.dataset.target); t && t.scrollIntoView({behavior:'smooth', block:'start'}); }, 60);
    }
    if(a==='open-cart') openCart();
    if(a==='close-cart') closeCart();
    if(a==='size-pick'){
        document.querySelectorAll(`[data-sizes="${id}"] .size-chip`).forEach(c=>c.classList.toggle('on', c===el));
    }
    if(a==='add-cart'){
        const card = el.closest('[data-card]');
        const picked = card && card.querySelector('.size-chip.on');
        if(!picked){
            const sz = card.querySelector('.sizes'); sz.classList.remove('shake'); void sz.offsetWidth; sz.classList.add('shake');
            toast('Сначала выберите размер'); return;
        }
        addToCart(id, +picked.dataset.size);
        toast('Добавлено в корзину: размер ' + picked.dataset.size, true);
    }
    if(a==='qty'){
        const item = cart.find(i=>i.key===el.dataset.key); if(!item) return;
        item.qty += +el.dataset.d;
        if(item.qty<1) item.qty=1;
        save(LS.c, cart); updateBadge(); renderCart();
    }
    if(a==='cart-del'){
        cart = cart.filter(i=>i.key!==el.dataset.key);
        save(LS.c, cart); updateBadge(); renderCart(); toast('Товар удалён из корзины');
    }
    if(a==='go-checkout') goCheckout();
    if(a==='modal-close') closeModal();
    if(a==='confirm-ok'){ closeModal(); confirmCb && confirmCb(); confirmCb=null; }

    /* --- админ-панель --- */
    if(a==='admin-open') adminOpen();
    if(a==='admin-logout'){ sessionStorage.removeItem('shag_admin'); show('home'); toast('Вы вышли из админ-панели'); }
    if(a==='admin-tab'){ ui.adminTab = el.dataset.tab; renderAdmin(); }
    if(a==='prod-new'){ ui.editId=null; productForm(null); }
    if(a==='prod-edit'){ ui.editId=id; productForm(products.find(p=>p.id===id)); }
    if(a==='prod-toggle'){
        const p = products.find(x=>x.id===id); if(p){ p.active=!p.active; save(LS.p,products); renderCatalog(); renderAdmin(); toast(p.active?'Товар опубликован':'Товар скрыт', p.active); }
    }
    if(a==='prod-del'){
        askConfirm('Удалить товар без возможности восстановления?', ()=>{
            products = products.filter(p=>p.id!==id);
            cart = cart.filter(i=>i.id!==id);
            save(LS.p,products); save(LS.c,cart); updateBadge(); renderCatalog(); renderAdmin(); renderCart(); toast('Товар удалён');
        });
    }
    if(a==='order-del'){
        askConfirm('Удалить заказ '+id+'?', ()=>{
            orders = orders.filter(o=>o.id!==id); save(LS.o,orders); renderAdmin(); toast('Заказ удалён');
        });
    }
});

document.addEventListener('change', e=>{
    const el = e.target.closest('[data-action]'); if(!el) return;
    if(el.dataset.action==='cart-size'){
        const item = cart.find(i=>i.key===el.dataset.key); if(!item) return;
        const newSize = +el.value;
        const other = cart.find(i=>i.id===item.id && i.size===newSize);
        if(other && other!==item){ other.qty += item.qty; cart = cart.filter(i=>i!==item); }
        else { item.size = newSize; item.key = cartKey(item.id,newSize); }
        save(LS.c,cart); renderCart();
    }
    if(el.dataset.action==='order-status'){
        const o = orders.find(x=>x.id===el.dataset.id);
        if(o){ o.status = el.value; save(LS.o,orders); renderAdmin(); toast('Статус заказа: '+STATUS[o.status], true); }
    }
});

document.addEventListener('submit', e=>{
    if(e.target.id==='checkoutForm'){ e.preventDefault(); submitOrder(); }
    if(e.target.id==='loginForm'){
        e.preventDefault();
        if($('loginPass').value === CONFIG.adminPass){
            sessionStorage.setItem('shag_admin','1'); closeModal(); renderAdmin(); show('admin'); toast('Добро пожаловать в админ-панель', true);
        } else toast('Неверный пароль');
    }
    if(e.target.id==='productForm'){ e.preventDefault(); saveProduct(); }
});

/* =========================================================
   11. ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ
========================================================= */
function initSearchAndFilters(){
    $('searchInput').addEventListener('input', e=>{ ui.search = e.target.value.trim(); renderCatalog(); });
    $('sortSelect').addEventListener('change', e=>{ ui.sort = e.target.value; renderCatalog(); });
    $('filterChips').addEventListener('click', e=>{
        const c = e.target.closest('.chip'); if(!c) return;
        ui.filter = c.dataset.filter;
        document.querySelectorAll('#filterChips .chip').forEach(x=>x.classList.toggle('on', x===c));
        renderCatalog();
    });
}

function initMarquee(){
    const mqItems = 'Бесплатная доставка ✦ Только премиальное качество ✦ доставка от 1 дня ✦ Новые модели каждый месяц ✦ ';
    $('marqueeTrack').innerHTML = Array(6).fill(`<span>${mqItems}</span>`).join('');
}

function init(){
    initSearchAndFilters();
    initMarquee();
    if(location.hash==='#admin'){ adminOpen(); }
    renderCatalog();
    renderCart();
    updateBadge();
}

init();