const nav = document.querySelector(".nav-menu");
const toggle = document.querySelector(".nav-toggle");
const langToggle = document.querySelector(".lang-toggle");
const langBtns = document.querySelectorAll(".lang-btn");
const menuGrid = document.querySelector(".menu-grid");
const order = {};   // keeps track of everything selected, e.g. { revuelta: 2 }


toggle.onclick = function(){
    nav.classList.toggle("show-nav");
}

const navLink = document.querySelectorAll(".nav-link");
function linkAction(){
    const navMenu = document.querySelector(".nav-menu");
    navMenu.classList.remove("show-nav");
}
navLink.forEach(n => n.addEventListener("click", linkAction));

function scrollHeader(){
    const scrollHeader = document.getElementById("header");
    if(this.scrollY >= 200){
        scrollHeader.classList.add("scroll-header");
    }
    else{
        scrollHeader.classList.remove("scroll-header");
    }
}
window.addEventListener("scroll", scrollHeader);

function setLanguage(lang) {
  // move the highlight
    langToggle.dataset.active = lang;

  // update the buttons
    langBtns.forEach(btn => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive);
    });

  // tell browsers and screen readers which language is showing
    document.documentElement.lang = lang;

  // remember the choice
    try { localStorage.setItem("lang", lang); } catch (e) {}

    currentLang = lang;
    applyTranslations();
    if (typeof renderCart === "function") renderCart();   // refresh the drawer text
}

langBtns.forEach(btn =>
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang))
);

// on page load, use the saved choice (or your default)
document.addEventListener("click", (e) => {

  // + and − buttons: only change the number shown on the card
  const qtyBtn = e.target.closest(".qty-btn");
  if (qtyBtn) {
    const row = qtyBtn.closest(".size-row");          // null for cards without sizes
    const card = qtyBtn.closest(".menu-card");
    const qtyEl = (row || card).querySelector(".menu-card-qty");
    let qty = parseInt(qtyEl.textContent, 10) || 0;

    if (qtyBtn.dataset.action === "increase") qty += 1;
    if (qtyBtn.dataset.action === "decrease" && qty > 0) qty -= 1;

    qtyEl.textContent = qty;
    return;
  }

  // Add to Order button: move the card's numbers into the order
  const addBtn = e.target.closest(".add-btn");
  if (addBtn) {
    const card = addBtn.closest(".menu-card");
    const itemId = card.dataset.itemId;
    const rows = card.querySelectorAll(".size-row");
    const targets = rows.length ? [...rows] : [card];   // sized rows, or the card itself
    let added = 0;

    targets.forEach(target => {
      const qtyEl = target.querySelector(".menu-card-qty");
      const qty = parseInt(qtyEl.textContent, 10) || 0;
      if (qty === 0) return;

      const key = target.dataset.size ? `${itemId}:${target.dataset.size}` : itemId;
      order[key] = (order[key] || 0) + qty;
      qtyEl.textContent = 0;                            // reset the card
      added += qty;
    });

    if (added === 0) return;

    card.classList.add("selected");

    addBtn.textContent = t("added");
    addBtn.classList.add("added");
    setTimeout(() => {
      addBtn.textContent = t("add_to_order");
      addBtn.classList.remove("added");
    }, 1200);

    console.log(order);
    renderCart();
  }
});


const cartDrawer  = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const cartOpenBtn = document.getElementById("cart-open");
const cartCloseBtn = document.getElementById("cart-close");
const cartList    = document.getElementById("cart-items");
const cartEmpty   = document.getElementById("cart-empty");
const cartCount   = document.getElementById("cart-count");
const checkoutBtn = document.getElementById("checkout-btn");

const sizeNames = { s: "Small", m: "Medium", l: "Large" };

function openCart() {
  renderCart();
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("show");
  cartDrawer.setAttribute("aria-hidden", "false");
  cartOpenBtn.setAttribute("aria-expanded", "true");
  document.body.classList.add("no-scroll");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("show");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartOpenBtn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("no-scroll");
}
const cartTotalEl = document.getElementById("cart-total");

function getPrice(key) {
  const [itemId, size] = key.split(":");
  const card = document.querySelector(`.menu-card[data-item-id="${itemId}"]`);
  if (!card) return 0;
  const el = size ? card.querySelector(`.size-row[data-size="${size}"]`) : card;
  return parseFloat(el && el.dataset.price) || 0;
}

const money = n => `$${n.toFixed(2)}`;

function renderCart() {
  cartList.innerHTML = "";
  const keys = Object.keys(order);
  let total = 0;        // item count (badge)
  let subtotal = 0;     // dollars  <-- new

  keys.forEach(key => {
    const [itemId, size] = key.split(":");
    const card = document.querySelector(`.menu-card[data-item-id="${itemId}"]`);
    const name = card ? card.querySelector(".menu-card-name").textContent : itemId;
    const linePrice = getPrice(key) * order[key];   // <-- new
    total += order[key];
    subtotal += linePrice;                          // <-- new

    const li = document.createElement("li");
    li.className = "cart-item";
        li.innerHTML = `
      <div class="cart-item-info">
        <p class="cart-item-name"></p>
        ${size ? `<span class="cart-item-size">${t("size_" + size)}</span>` : ""}
        <div class="cart-item-price">${money(linePrice)}</div>
      </div>
      <div class="cart-qty">
        <button type="button" data-key="${key}" data-cart-action="decrease" aria-label="Remove one">−</button>
        <span>${order[key]}</span>
        <button type="button" data-key="${key}" data-cart-action="increase" aria-label="Add one">+</button>
      </div>
      <button type="button" class="cart-remove" data-key="${key}" data-cart-action="remove" aria-label="Remove from order">&times;</button>
    `;
    li.querySelector(".cart-item-name").textContent = name;
    cartList.appendChild(li);
  });

  cartEmpty.hidden = keys.length > 0;
  checkoutBtn.disabled = keys.length === 0;
  cartCount.textContent = total;
  cartCount.hidden = total === 0;
  cartTotalEl.textContent = money(subtotal);       // <-- new
}

// open / close
cartOpenBtn.addEventListener("click", openCart);
cartCloseBtn.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

// + / − / remove inside the drawer
cartList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cart-action]");
  if (!btn) return;

  const key = btn.dataset.key;
  const action = btn.dataset.cartAction;

  if (action === "increase") order[key] = (order[key] || 0) + 1;
  if (action === "decrease") order[key] = (order[key] || 0) - 1;
  if (action === "remove" || order[key] <= 0) delete order[key];

  // un-highlight the menu card if none of its sizes are left in the order
  const itemId = key.split(":")[0];
  const stillInOrder = Object.keys(order).some(k => k.split(":")[0] === itemId);
  if (!stillInOrder) {
    const card = document.querySelector(`.menu-card[data-item-id="${itemId}"]`);
    if (card) card.classList.remove("selected");
  }

  renderCart();
});

renderCart();   // sets the badge on page load

const translations = {
  en: {
    nav_home: "Home",
    nav_about: "About",
    nav_menu: "Menu",
    nav_reviews: "Reviews",
    nav_contact: "Contact",
    hero_since: "Stateside since 1996",
    hero_tagline: "Salvadoran food with a modern twist",
    hero_button: "View Our Menu",
    location: "Where to Find Us",
    location_info: "Our spot changes throughout the week. Here's our current schedule.", 
    location_tu: "Tuesday", 
    location_we: "Wednesday",
    location_fr: "Friday", 
    location_sa: "Saturday",
    location_su1: "Sunday",
    location_su2: "Sunday", 
    about_title: "Our Story",
    about_story: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Sapiente ab laboriosam quod beatae vero, in deleniti sequi architecto expedita mollitia voluptates distinctio quis ea accusantium doloribus qui eveniet veniam consectetur, labore ipsam? Autem, sed officiis beatae ut minima aspernatur, adipisci architecto nobis soluta aperiam dignissimos, debitis enim deleniti modi sapiente?",
    going_up: "Wanna go back up?",
    add_to_order: "Add to Order",
    added: "Added ✓",
    cart_title: "Your Order",
    cart_empty: "Your order is empty.",
    cart_place: "Place Order",
    cart_open: "View your order",
    size_s: "Small",
    size_m: "Medium",
    size_l: "Large",
    nav_catering: "Catering",
    cat_title: "Catering",
    cat_intro: "Planning a party, birthday, or office lunch? Tell us about your event and we'll get back to you to confirm.",
    cat_name: "Full name",
    cat_phone: "Phone",
    cat_email: "Email (optional)",
    cat_date: "Event date",
    cat_time: "Event time",
    cat_guests: "Number of guests",
    cat_type: "Event type",
    cat_type_choose: "Choose one",
    cat_type_birthday: "Birthday",
    cat_type_office: "Office / Work",
    cat_type_wedding: "Wedding",
    cat_type_other: "Other",
    cat_service: "Pickup or delivery?",
    cat_pickup: "Pickup",
    cat_delivery: "Delivery / On-site",
    cat_address: "Event address",
    cat_notes: "Any special requests? Allergies or special requests",
    cat_submit: "Request Catering",
    cat_success: "Thank you! We got your request and will contact you soon to confirm.",
    cat_error_required: "Please fill in the highlighted fields.",
    cat_error_send: "Something went wrong. Please try again or call us.",
    cart_total: "Total",
    menu_title: "Menu",
    menu_pupusas: "Pupusas",
    menu_aguas: "Aguas Frescas",
    today_label: "Today",
    next_label: "Next up",
    location_mo: "Monday",
    location_th: "Thursday",
    closed: "Closed",
    closed_label: "Closed today",
    rev_title: "What Our Customers Say",
    rev_intro: "Real words from the people who keep coming back.",
  },
  es: {
    nav_home: "Inicio",
    nav_about: "Nosotros",
    nav_menu: "Menú",
    nav_reviews: "Testimonios",
    nav_contact: "Contacto",
    hero_since: "En Estados Unidos desde 1996",
    hero_tagline: "Comida salvadoreña con un toque moderno",
    hero_button: "Ver nuestro menu",
    location: "Dónde encontrarnos",
    location_info: "Nuestra ubicación cambia durante la semana. Aquí está nuestro horario.", 
    location_tu: "Martes", 
    location_we: "Miercoles",
    location_fr: "Viernes", 
    location_sa: "Sabado",
    location_su1: "Domingo",
    location_su2: "Domingo", 
    about_title: "Nuestra Historia",
    about_story: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Sapiente ab laboriosam quod beatae vero, in deleniti sequi architecto expedita mollitia voluptates distinctio quis ea accusantium doloribus qui eveniet veniam consectetur, labore ipsam? Autem, sed officiis beatae ut minima aspernatur, adipisci architecto nobis soluta aperiam dignissimos, debitis enim deleniti modi sapiente?",
    going_up: "Quires volver arriba?",
    add_to_order: "Agregar al pedido",
    added: "Agregado ✓",
    cart_title: "Tu pedido",
    cart_empty: "Tu pedido está vacío.",
    cart_place: "Hacer pedido",
    cart_open: "Ver tu pedido",
    size_s: "Pequeño",
    size_m: "Mediano",
    size_l: "Grande",
    nav_catering: "Catering",
    cat_title: "Catering",
    cat_intro: "¿Planeas una fiesta, cumpleaños o almuerzo de oficina? Cuéntanos sobre tu evento y te contactaremos para confirmar.",
    cat_name: "Nombre completo",
    cat_phone: "Teléfono",
    cat_email: "Correo electrónico (opcional)",
    cat_date: "Fecha del evento",
    cat_time: "Hora del evento",
    cat_guests: "Número de invitados",
    cat_type: "Tipo de evento",
    cat_type_choose: "Elige uno",
    cat_type_birthday: "Cumpleaños",
    cat_type_office: "Oficina / Trabajo",
    cat_type_wedding: "Boda",
    cat_type_other: "Otro",
    cat_service: "¿Recoger o entrega?",
    cat_pickup: "Recoger",
    cat_delivery: "Entrega / En el lugar",
    cat_address: "Dirección del evento",
    cat_notes: "¿Tienes un pedido especial? Alergias o peticiones especiales",
    cat_submit: "Solicitar catering",
    cat_success: "¡Gracias! Recibimos tu solicitud y te contactaremos pronto para confirmar.",
    cat_error_required: "Por favor llena los campos marcados.",
    cat_error_send: "Algo salió mal. Intenta de nuevo o llámanos.",
    cart_total: "Total",
    menu_title: "Menú",
    menu_pupusas: "Pupusas",
    menu_aguas: "Aguas Frescas",
    today_label: "Hoy",
    next_label: "Proximo",
    location_mo: "Lunes",
    location_th: "Jueves",
    closed: "Cerrado",
    closed_label: "Cerrado hoy",
    rev_title: "Lo que dicen nuestros clientes",
    rev_intro: "Palabras reales de quienes siempre regresan."
  }
};

let currentLang = "en";

// look up a key; falls back to English, then to the key itself
function t(key) {
  return (translations[currentLang] && translations[currentLang][key])
      || translations.en[key]
      || key;
}
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-alt]").forEach(el => {
    el.setAttribute("alt", t(el.dataset.i18nAlt));
  });
  highlightToday();
}

const catForm    = document.getElementById("catering-form");
const catDate    = document.getElementById("cat-date");
const catService = document.getElementById("cat-service");
const catAddrWrap = document.getElementById("cat-address-wrap");
const catAddr    = document.getElementById("cat-address");
const catStatus  = document.getElementById("cat-status");

// earliest date customers can pick (3 days out; change to fit her schedule)
const LEAD_DAYS = 3;
const earliest = new Date();
earliest.setDate(earliest.getDate() + LEAD_DAYS);
catDate.min = earliest.toISOString().split("T")[0];

// show the address field only for delivery
catService.addEventListener("change", () => {
  const delivery = catService.value === "delivery";
  catAddrWrap.hidden = !delivery;
  catAddr.required = delivery;
});

catForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  catStatus.className = "form-status";
  catStatus.textContent = "";

  // simple validation
  let valid = true;
  catForm.querySelectorAll("[required]").forEach(field => {
    const bad = !field.value.trim();
    field.classList.toggle("invalid", bad);
    if (bad) valid = false;
  });
  if (!valid) {
    catStatus.textContent = t("cat_error_required");
    catStatus.classList.add("err");
    return;
  }

  const btn = catForm.querySelector(".catering-btn");
  btn.disabled = true;

  try {
    const res = await fetch(catForm.action, {
      method: "POST",
      body: new FormData(catForm),
      headers: { Accept: "application/json" }
    });
    if (!res.ok) throw new Error("Request failed");

    catForm.reset();
    catAddrWrap.hidden = true;
    catStatus.textContent = t("cat_success");
    catStatus.classList.add("ok");
  } catch (err) {
    catStatus.textContent = t("cat_error_send");
    catStatus.classList.add("err");
  } finally {
    btn.disabled = false;
  }
});
// today's weekday in Los Angeles, so a visitor in another time zone still sees her real schedule
function getTodayLA() {
    const name = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: "America/Los_Angeles"
    }).format(new Date());
    return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[name];
}

function highlightToday() {
    const today = getTodayLA();
    const rows = document.querySelectorAll(".schedule-item[data-day]");

    rows.forEach(r => {
        r.classList.remove("today", "next");
        delete r.dataset.todayLabel;
    });

    // today's rows (one on most days, two on Sunday)
    rows.forEach(r => {
        if (Number(r.dataset.day) !== today) return;
        const closed = r.classList.contains("schedule-item--closed");
        r.classList.add("today");
        r.dataset.todayLabel = t(closed ? "closed_label" : "today_label");
    });

    // if she's closed today, also tag the next day she's out
    const closedToday = [...rows].some(r =>
        Number(r.dataset.day) === today && r.classList.contains("schedule-item--closed"));
    if (!closedToday) return;

    const openRows = [...rows].filter(r => !r.classList.contains("schedule-item--closed"));
    const away = r => (Number(r.dataset.day) - today + 7) % 7;
    const soonest = Math.min(...openRows.map(away));

    openRows.filter(r => away(r) === soonest).forEach(r => {
        r.classList.add("next");
        r.dataset.todayLabel = t("next_label");
    });
}
let saved = "en";
try { saved = localStorage.getItem("lang") || "en"; } catch (e) {}
setLanguage(saved);