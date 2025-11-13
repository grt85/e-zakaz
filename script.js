
 // Маска для украинского номера
 
  const phoneInput = document.getElementById("phone");
  const phoneError = document.getElementById("phoneError");

 Inputmask({
  mask: "+3(999) 999-9999",
  placeholder: "_",
  showMaskOnHover: false,
  showMaskOnFocus: true,
  clearIncomplete: true
}).mask(document.getElementById("phone"));








// 🌙 Перемикання теми
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
}

// 🍔 Анімація бургер-іконки
function toggleSpin(el) {
  el.classList.toggle('paused');
}

// 📋 Модалка меню
function openMenuModal() {
  document.getElementById('menuModal').style.display = 'flex';
}

function closeMenuModal() {
  document.getElementById('menuModal').style.display = 'none';
}

// 🛒 Модалка кошика
function openCart() {
  document.getElementById('cartModal').style.display = 'flex';
}

function closeCart() {
  document.getElementById('cartModal').style.display = 'none';
}
/*modalka k,ot*/
function openReviewsModal() {
  document.getElementById('reviewsModal').style.display = 'flex';
}

function closeReviewsModal() {
  document.getElementById('reviewsModal').style.display = 'none';
}

function openContactsModal() {
  document.getElementById('contactsModal').style.display = 'flex';
}

function closeContactsModal() {
  document.getElementById('contactsModal').style.display = 'none';
}

// 🧃 Фільтрація меню
function filterMenu() {
  const value = document.getElementById('filter').value;
  const items = document.querySelectorAll('#menuItems .item');
  items.forEach(item => {
    item.style.display = value === 'all' || item.dataset.type === value ? 'block' : 'none';
  });
}

// 🛒 Кошик
let cart = [];

// ➕ Додавання товару до кошика
function addToCart(el) {
  const item = el.closest('.item') || el.closest('.dish');
  const name = item.querySelector('h3').textContent.trim();
  const priceText = item.querySelector('.price')?.textContent.trim() || item.querySelector('p').textContent.trim();
  const price = parseFloat(priceText.replace(/[^\d.]/g, ''));

  cart.push({ name, price });
  updateCart();
  showCartNotification();
}

function showCartNotification() {
  const note = document.getElementById('cartNotification');
  note.classList.add('show');
  setTimeout(() => {
    note.classList.remove('show');
  }, 2000); // показати на 2 секунди
}

// ❌ Видалення товару з кошика
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

// 🔄 Оновлення вмісту кошика
function updateCart() {
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  cartItems.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.name} — ₴${item.price}
      <button onclick="removeFromCart(${index})" style="margin-left:10px;color:red;">✖</button>
    `;
    cartItems.appendChild(li);
    total += item.price;
  });

  cartTotal.textContent = total;
}

// ✅ Обробка форми замовлення (навіть якщо додається пізніше)
document.addEventListener('DOMContentLoaded', () => {
  const deliverySelect = document.getElementById('delivery');
  const addressInput = document.getElementById('address');
  const liqpayContainer = document.getElementById('liqpayContainer');

  deliverySelect.addEventListener('change', () => {
    const isCourier = deliverySelect.value === 'courier';
    addressInput.style.display = isCourier ? 'block' : 'none';
    addressInput.required = isCourier;
    liqpayContainer.style.display = isCourier ? 'block' : 'none';
  });

  deliverySelect.dispatchEvent(new Event('change'));
});

async function initiateLiqPay() {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const description = `Оплата замовлення: ${cart.map(c => c.name).join(', ')}`;

  const res = await fetch('https://e-zakaz.onrender.com/api/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: total, description })
  });

  const { data, signature } = await res.json();

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://www.liqpay.ua/api/3/checkout';
  form.innerHTML = `
    <input type="hidden" name="data" value="${data}" />
    <input type="hidden" name="signature" value="${signature}" />
  `;
  document.body.appendChild(form);
  form.submit();
}

async function checkPaymentStatus(orderId) {
 const res = await fetch('https://e-zakaz.onrender.com/api/pay/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId })
  });

  const result = await res.json();
  console.log('Статус платежу:', result.status);
  alert(`Статус: ${result.status}`);
}

function attachOrderFormListener() {
  const form = document.getElementById('orderForm');
  if (form && !form.dataset.listenerAttached) {
    form.dataset.listenerAttached = 'true';
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const orderData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        delivery: document.getElementById('delivery').value,
        address: document.getElementById('address').value,
        cart: cart
      };

      try {
        const res = await fetch('https://e-zakaz.onrender.com/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        const result = await res.json();

        // ⏰ Перевірка часу
       const now = new Date();
const hour = now.getHours();
const day = now.getDay(); // 0 = неділя, 6 = субота

const isNight = hour < 8 || hour >= 23; // нічний час: до 8:00 або після 22:00
const isWeekend = day === 0 || day === 6; // вихідні: субота або неділя
console.log(`hour: ${hour}, day: ${day}, isNight: ${isNight}, isWeekend: ${isWeekend}`);

        if (isNight || isWeekend) {
          Swal.fire({
            title: 'Замовлення прийнято!',
            text: '🕒 Продавець зв’яжеться з вами у робочий час. Дякуємо за терпіння!',
            icon: 'info',
            confirmButtonText: 'OK'
          });
        } else {
          Swal.fire({
            title: 'Замовлення підтверджено!',
            html: '🛎️ Продавець зв’яжеться з вами протягом <b>15 хвилин</b>.<br><br>Залишилось: <span id="countdown">15:00</span>',
            icon: 'success',
            timer: 900000,
            timerProgressBar: true,
            didOpen: () => {
              const countdownEl = Swal.getHtmlContainer().querySelector('#countdown');
              let timeLeft = 15 * 60;
              const timerInterval = setInterval(() => {
                timeLeft--;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                if (timeLeft <= 0) clearInterval(timerInterval);
              }, 5000);
            },
            willClose: () => {
              Swal.fire({
                title: '⏰ Час очікування минув',
                text: 'Якщо продавець ще не зв’язався — можете зробити це самостійно.',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Зв’язатися зараз',
                cancelButtonText: 'Закрити'
              }).then((result) => {
                if (result.isConfirmed) {
                  window.location.href = '/contact'; // або mailto:email@example.com
                }
              });
            }
          });
        }

        cart = [];
        updateCart();
        closeCart();
      } catch (err) {
        Swal.fire({
          title: '❌ Помилка!',
          text: 'Помилка при надсиланні замовлення.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        console.error(err);
      }
    });
  }
}

const observer = new MutationObserver(attachOrderFormListener);
observer.observe(document.body, { childList: true, subtree: true });













const products = [
  {
    id: "promo1",
    name: "Бургер Класик",
    price: 150,
    promoPrice: 120,
    promoDeadline: "2025-11-13T23:59:59"
  },
  {
    id: "promo2",
    name: "Піца Маргарита",
    price: 150,
    promoPrice: 110,
    promoDeadline: "2025-11-13T23:59:59"
  },
  {
    id: "promo3",
    name: "Салат Цезар",
    price: 95,
    promoPrice: 50,
    promoDeadline: "2025-11-13T23:59:59"
  }
];



function addToCart(el) {
  const item = el.closest('.item') || el.closest('.dish');
  if (!item) return;

  const productId = item.getAttribute("data-id");
  let name = item.querySelector('h3')?.textContent.trim();
  let priceText =
    item.querySelector('.price')?.textContent.trim() ||
    item.querySelector('p')?.textContent.trim();
  let price = parseFloat(priceText.replace(/[^\d.]/g, ''));

  // Якщо товар є в products — використовуємо акційну логіку
  if (productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
      const now = new Date().getTime();
      const deadline = product.promoDeadline ? new Date(product.promoDeadline).getTime() : 0;
      const isPromoActive = deadline > now;
      price = isPromoActive && product.promoPrice ? product.promoPrice : product.price;
      name = product.name;
    }
  }

  if (!name || isNaN(price)) return;

  cart.push({ name, price });
  updateCart();
  showCartNotification(`${name} додано за ₴${price}`);
}

function updateCart() {
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  cartItems.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.name} — ₴${item.price}
      <button onclick="removeFromCart(${index})" style="margin-left:10px;color:red;">✖</button>
    `;
    cartItems.appendChild(li);
    total += item.price;
  });

  cartTotal.textContent = total;
}
const promoTimers = {};

function startPromoCountdown(timerId, deadline, dishSelector) {
  const timer = document.getElementById(timerId);
  const dish = document.querySelector(dishSelector);
  if (!timer || !dish) return;

  const oldPrice = dish.querySelector(".old-price");
  const discountPrice = dish.querySelector(".discount-price");
  const promoLabel = dish.querySelector(".promo-label");

  function updateTimer() {
    const now = new Date().getTime();
    const distance = new Date(deadline).getTime() - now;

    if (distance <= 0) {
      timer.innerHTML = "⏳ Акція завершена!";

      if (!dish.querySelector(".promo-ended-alert")) {
        const alertBox = document.createElement("div");
        alertBox.className = "promo-ended-alert";
        alertBox.textContent = "Акція завершилась. Ціна повернулась до стандартної.";
        alertBox.style.cssText = `
          background: #ff3c3c;
          color: white;
          padding: 1rem;
          margin-top: 1rem;
          border-radius: 5px;
          text-align: center;
        `;
        dish.appendChild(alertBox);
      }

      if (oldPrice && discountPrice) {
        oldPrice.style.display = "inline";
        discountPrice.textContent = oldPrice.textContent;
      }

      if (promoLabel) promoLabel.style.display = "none";

      setTimeout(() => {
        timer.style.display = "none";
      }, 5000);

      clearInterval(promoTimers[timerId]);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    timer.innerHTML = `Залишилось: ${days}д ${hours}г ${minutes}хв ${seconds}с`;
  }

  updateTimer();
  promoTimers[timerId] = setInterval(updateTimer, 1000);
}


document.addEventListener("DOMContentLoaded", function () {
  products.forEach(product => {
    const timerId = `${product.id}-timer`;
    const dishSelector = `#${product.id}`;
    startPromoCountdown(timerId, product.promoDeadline, dishSelector);
  });
});








function updateWorkingStatus() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const workingHours = {
  1: { start: 8, end: 22 },
  2: { start: 8, end: 22 },
  3: { start: 8, end: 22 },
  4: { start: 8, end: 22 },
  5: { start: 8, end: 22 },
  6: null,
  0: null
};

  const today = workingHours[day];
  const isOpen = today && hour >= today.start && hour < today.end;

  const indicator = document.getElementById('open-indicator');
  indicator.textContent = isOpen ? 'Зараз відкрито' : 'Зараз закрито';
  indicator.classList.toggle('closed', !isOpen);
}

function setupScheduleToggle() {
  const button = document.getElementById('toggle-schedule');
  const list = document.getElementById('schedule-list');

  button.addEventListener('click', () => {
    list.classList.toggle('visible');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateWorkingStatus();
  setupScheduleToggle();

});


