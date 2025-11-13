const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
//const twilio = require('twilio');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

//const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

function base64(str) {
  return Buffer.from(str).toString('base64');
}

function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('base64');
}

function saveOrderFiles(order) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const txtPath = path.join(__dirname, 'orders', `order_${timestamp}.txt`);
  const jsonPath = path.join(__dirname, 'orders', `order_${timestamp}.json`);

  const txtContent = `Ім’я: ${order.name}\nТелефон: ${order.phone}\nДоставка: ${order.delivery}\nАдреса: ${order.address}\nТовари:\n${order.cart.map(c => `${c.name} — ₴${c.price}`).join('\n')}`;
  const jsonContent = JSON.stringify(order, null, 2);

  fs.mkdirSync(path.join(__dirname, 'orders'), { recursive: true });
  fs.writeFileSync(txtPath, txtContent);
  fs.writeFileSync(jsonPath, jsonContent);
}

// 📦 Прийом замовлення
app.post('/api/order', async (req, res) => {
  const { name, phone, delivery, address, cart } = req.body;
  const order = { name, phone, delivery, address, cart };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: 'Нове замовлення',
    text: `Ім’я: ${name}\nТелефон: ${phone}\nДоставка: ${delivery}\nАдреса: ${address}\nТовари:\n${cart.map(c => `${c.name} — ₴${c.price}`).join('\n')}`
  };

  const smsBody = `Замовлення від ${name}: ${cart.map(c => c.name).join(', ')}. Сума: ₴${cart.reduce((t, c) => t + c.price, 0)}`;

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Помилка підключення до пошти:', error);
  } else {
    console.log('✅ Пошта готова до надсилання');
  }
});


  try {
   await transporter.sendMail(mailOptions);
    /*await twilioClient.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE,
      to: process.env.TWILIO_RECIPIENT
    });*/

  /* try {
  await twilioClient.messages.create({
    body: smsBody,
    from: process.env.TWILIO_VIBER_SENDER,
    to: process.env.TWILIO_RECIPIENT,
    channel: 'viber'
  });
} catch (twilioError) {
  console.warn('⚠️ Twilio помилка:', twilioError.message);
}*/

    saveOrderFiles(order);
    
const now = new Date().toLocaleString('uk-UA');
    console.log(`🧾 Замовлення отримано ${now}:\n`, order);
    res.json({ message: 'Замовлення надіслано!' });
  } catch (error) {
    console.error('Помилка:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }


});

// 💳 Генерація параметрів для LiqPay
app.post('/api/pay', (req, res) => {
  const { amount, description } = req.body;

  const liqpayParams = {
    public_key: process.env.LIQPAY_PUBLIC_KEY,
    version: '3',
    action: 'pay',
    amount,
    currency: 'UAH',
    description,
    order_id: `order_${Date.now()}`,
    sandbox: '1'
  };

  const data = base64(JSON.stringify(liqpayParams));
  const signature = sha1(process.env.LIQPAY_PRIVATE_KEY + data + process.env.LIQPAY_PRIVATE_KEY);

  res.json({ data, signature });
});

// 📋 Перевірка статусу платежу
app.post('/api/pay/status', async (req, res) => {
  const { order_id } = req.body;

  const statusParams = {
    public_key: process.env.LIQPAY_PUBLIC_KEY,
    version: '3',
    action: 'status',
    order_id
  };

  const data = base64(JSON.stringify(statusParams));
  const signature = sha1(process.env.LIQPAY_PRIVATE_KEY + data + process.env.LIQPAY_PRIVATE_KEY);

  try {
    const response = await fetch('https://www.liqpay.ua/api/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, signature })
    });

    const result = await response.json();

    const orderPath = path.join(__dirname, 'orders', `${order_id}.json`);
if (fs.existsSync(orderPath)) {
  const orderData = JSON.parse(fs.readFileSync(orderPath));
  orderData.paymentStatus = result.status;
  orderData.paymentDetails = result;
  fs.writeFileSync(orderPath, JSON.stringify(orderData, null, 2));
  console.log(`📁 Статус додано до ${orderPath}`);
} else {
  console.warn(`⚠️ Файл замовлення ${order_id}.json не знайдено`);
}
res.json(result);


    const now = new Date().toLocaleString('uk-UA');
    console.log(`💳 Статус платежу (${order_id}) на ${now}: ${result.status}`);

    // Якщо оплата успішна — надіслати email
    if (result.status === 'success') {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_TO,
  subject: 'Нове замовлення',
  html: `
    <h2>Нове замовлення</h2>
    <img src="cid:logo@company" alt="Логотип" style="width:150px;"><br>
    <p><strong>Ім’я:</strong> ${name}</p>
    <p><strong>Телефон:</strong> ${phone}</p>
    <p><strong>Доставка:</strong> ${delivery}</p>
    <p><strong>Адреса:</strong> ${address}</p>
    <p><strong>Товари:</strong><br>${cart.map(c => `${c.name} — ₴${c.price}`).join('<br>')}</p>
  `,
  attachments: [
    {
      filename: 'Cheeseburger_Calori.png',
      path: path.join(__dirname, 'images', 'Cheeseburger_Calori.png'),
      cid: 'logo@company'
    }
  ]
};

      await transporter.sendMail(mailOptions);
      console.log(`📧 Email надіслано для ${order_id}`);
    }

    res.json(result);
  } catch (err) {
    console.error('Помилка перевірки статусу:', err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});







// 🔒 Обмеження на кількість запитів
const reviewLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 хвилина
  max: 3, // максимум 3 запити на хвилину з одного IP
  message: 'Забагато запитів. Спробуйте пізніше.'
});

// 🚫 Заборонені слова
const bannedWords = ['spam', 'viagra', 'casino'];

// 📩 Обробка форми відгуку
app.post('/submit-review', reviewLimiter, (req, res) => {
  const { email, comment, rating, website } = req.body;

  // Honeypot-перевірка
  if (website) {
    return res.status(400).json({ message: 'Підозра на спам.' });
  }

  // Перевірка на заборонені слова
  if (bannedWords.some(word => comment.toLowerCase().includes(word))) {
    return res.status(400).json({ message: 'Коментар містить заборонені слова.' });
  }

  // Валідація полів
  if (!email || !comment || !rating) {
    return res.status(400).json({ message: 'Будь ласка, заповніть всі поля.' });
  }

  if (comment.length < 10) {
    return res.status(400).json({ message: 'Коментар має містити щонайменше 10 символів.' });
  }

  // 🕒 Дата та час
  const now = new Date();
  const timestamp = now.toLocaleString('uk-UA');

  // 🎯 Вибір емодзі за рейтингом
  let emoji = '';
  switch (parseInt(rating)) {
    case 5: emoji = '🌟'; break;
    case 4: emoji = '👍'; break;
    case 3: emoji = '😐'; break;
    case 2: emoji = '😕'; break;
    case 1: emoji = '👎'; break;
    default: emoji = '';
  }

  // 📝 Формування тексту відгуку
  const review = `Дата: ${timestamp}, Email: ${email}, Rating: ${rating} ${emoji}, Comment: ${comment}\n`;

  // 💾 Запис у файл
  fs.appendFile('reviews.txt', review, err => {
    if (err) {
      console.error('Помилка запису:', err);
      return res.status(500).json({ message: 'Помилка сервера' });
    }

    console.log('Новий відгук:', review);
    res.json({ message: `Дякуємо за ваш відгук! ${emoji}` });
  });
});






app.get('/', (req, res) => {
  res.send('Сервер працює! Вітаємо 👋');
});

// 🚀 Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));







