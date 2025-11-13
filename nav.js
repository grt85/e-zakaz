




 let startX, startY;

document.getElementById('menuModal').addEventListener('touchstart', function(e) {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
}, { passive: true });

document.getElementById('menuModal').addEventListener('touchend', function(e) {
  let endX = e.changedTouches[0].clientX;
  let endY = e.changedTouches[0].clientY;

  let diffX = endX - startX;
  let diffY = endY - startY;

  // Якщо свайп вниз або вліво — закриваємо меню
  if (Math.abs(diffY) > 50 && diffY > 0 || Math.abs(diffX) > 50 && diffX < 0) {
    closeMenuModal();
  }
});


function openImageModal(src) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  modalImg.src = src;
  modal.style.display = 'flex';
}

function closeImageModal() {
  document.getElementById('imageModal').style.display = 'none';
}





const adSlides = [
  {
    image: "images/Classic Cheese Burge.png",
    link: "https://example.com/burger",
    caption: "Соковитий бургер зі знижкою"
  },
  {
    image: "images/Pizza - Wikipedia.png",
    link: "https://example.com/pizza",
    caption: "Піца дня — лише ₴110"
  },
  {
    image: "images/cozy Ukrainian food .png",
    link: "images/cozy Ukrainian food .png",
    caption: ""
  }
];

let adIndex = 0;
let adInterval = setInterval(changeAdImage, 10000);

function changeAdImage() {
  adIndex = (adIndex + 1) % adSlides.length;
  document.getElementById("adSlide").src = adSlides[adIndex].image;
  document.getElementById("adLink").href = adSlides[adIndex].link;

  const caption = document.getElementById("adCaption");
  caption.classList.remove("show"); // прибираємо клас для перезапуску анімації
  void caption.offsetWidth; // перезапуск анімації (техніка reflow)
  caption.textContent = adSlides[adIndex].caption;
  caption.classList.add("show");
}

function stopAdSlider() {
  clearInterval(adInterval);
}

function startAdSlider() {
  stopAdSlider();
  adInterval = setInterval(changeAdImage, 10000);
}





document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("reviewForm");

  if (!form) {
    console.error("Форма reviewForm не знайдена.");
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = form.email.value.trim();
    const comment = form.comment.value.trim();
    const rating = form.rating.value;
    const website = form.website.value;

    if (website) {
      alert("Підозра на спам.");
      return;
    }

    if (!email || !comment || !rating) {
      alert("Будь ласка, заповніть всі поля.");
      return;
    }

    if (comment.length < 10) {
      alert("Коментар має містити щонайменше 10 символів.");
      return;
    }

    fetch("http://localhost:3000/submit-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, comment, rating, website})
      

    })
      .then(response => {
        if (!response.ok) throw new Error("Помилка при надсиланні");
        return response.text();
      })
      .then(data => {
       Swal.fire({
  title: 'Дякуємо!',
  text: 'Відгук успішно надіслано! 🍔',
  icon: 'success',
  confirmButtonText: 'OK'
});
        closeReviewsModal();
        form.reset();
      })
      .catch(error => {
        console.error("Помилка:", error);
        alert("Не вдалося надіслати відгук. Спробуйте пізніше.");
      });
  });
});







  

  const modal = document.getElementById("messengerModal");
  const btn = document.getElementById("messengerBtn");
  const title = document.getElementById("modalTitle");
  const langSelect = document.getElementById("languageSelect");
  const sendBtn = document.getElementById("sendMessageBtn");
  const status = document.getElementById("sendStatus");

  const translations = {
    ua: {
      title: "Оберіть месенджер",
      button: "📲 Зв’язатися з нами",
      placeholder: "Ваше повідомлення...",
      send: "📨 Надіслати",
      sent: "✅ Повідомлення надіслано!"
    },
    en: {
      title: "Choose a messenger",
      button: "📲 Contact us",
      placeholder: "Your message...",
      send: "📨 Send",
      sent: "✅ Message sent!"
    },
    pl: {
      title: "Wybierz komunikator",
      button: "📲 Skontaktuj się z nami",
      placeholder: "Twoja wiadomość...",
      send: "📨 Wyślij",
      sent: "✅ Wiadomość wysłana!"
    },
    de: {
      title: "Messenger auswählen",
      button: "📲 Kontaktieren Sie uns",
      placeholder: "Ihre Nachricht...",
      send: "📨 Senden",
      sent: "✅ Nachricht gesendet!"
    }
  };

  btn.addEventListener("click", () => {
    modal.style.display = "block";
  });

  function closeMessenger() {
    modal.style.display = "none";
  }

  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  langSelect.addEventListener("change", function () {
    const lang = langSelect.value;
    const t = translations[lang];
    title.textContent = t.title;
    btn.textContent = t.button;
    document.getElementById("userMessage").placeholder = t.placeholder;
    sendBtn.textContent = t.send;
    status.textContent = t.sent;
  });

  window.addEventListener("DOMContentLoaded", () => {
    const browserLang = navigator.language.slice(0, 2);
    const supported = ["ua", "en", "pl", "de"];
    const lang = supported.includes(browserLang) ? browserLang : "en";
    langSelect.value = lang;
    langSelect.dispatchEvent(new Event("change"));
  });

  sendBtn.addEventListener("click", () => {
    const message = document.getElementById("userMessage").value.trim();
    const messenger = document.getElementById("messengerSelect").value;
    if (!message) return;

    let link = "";
    switch (messenger) {
      case "viber":
        link = `viber://forward?text=${encodeURIComponent(message)}`;
        break;
      case "telegram":
        link = `https://t.me/share/url?url=&text=${encodeURIComponent(message)}`;
        break;
      case "whatsapp":
        link = `https://wa.me/?text=${encodeURIComponent(message)}`;
        break;
    }

    window.open(link, "_blank");
    status.style.display = "block";
    setTimeout(() => {
      status.style.display = "none";
      document.getElementById("userMessage").value = "";
    }, 3000);
  });









  
  

  