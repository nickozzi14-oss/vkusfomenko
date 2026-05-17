```javascript
// 1. Инициализация Яндекс Карты
ymaps.ready(initMap);

function initMap() {
    // Координаты офиса (замените на свои)
    const officeCoords = [55.751574, 37.573856];
    
    const map = new ymaps.Map("map", {
        center: officeCoords,
        zoom: 16,
        controls: ['zoomControl']
    });
    
    // Метка офиса
    const placemark = new ymaps.Placemark(officeCoords, {
        hintContent: 'Кофемашины24',
        balloonContent: '<strong>Кофемашины24</strong><br>ул. Кофеваркина, д. 15'
    }, {
        preset: 'islands#redIcon'
    });
    
    map.geoObjects.add(placemark);
}

// 2. Обработка формы заказа звонка
document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Получаем данные формы
    const formData = new FormData(this);
    const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        tariff: formData.get('tariff')
    };
    
    // Валидация телефона
    const phonePattern = /\+7\s?[\(]?[0-9]{3}[\)]?\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}/;
    if (!phonePattern.test(data.phone)) {
        alert('Пожалуйста, введите корректный номер телефона в формате +7 (999) 123-45-67');
        return;
    }
    
    // Показываем, что отправляем
    const submitBtn = this.querySelector('.btn-submit');
    submitBtn.textContent = 'Отправка...';
    submitBtn.disabled = true;
    
    // Отправка данных (выберите один из вариантов ниже)
    sendToTelegram(data); // Или sendToEmail(data)
});

// ВАРИАНТ 1: Отправка в Telegram (рекомендую)
function sendToTelegram(data) {
    const botToken = 'ВАШ_ТОКЕН_БОТА'; // Получите у @BotFather
    const chatId = 'ВАШ_CHAT_ID'; // Узнайте у @userinfobot
    
    const message = `
🆕 Новая заявка с сайта!
📝 Имя: ${data.name}
📞 Телефон: ${data.phone}
📧 Email: ${data.email || 'Не указан'}
☕ Тариф: ${data.tariff}
⏰ Время: ${new Date().toLocaleString('ru-RU')}
    `;
    
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            showSuccess('Заявка отправлена! Мы перезвоним в течение 15 минут.');
        } else {
            showError('Ошибка отправки. Попробуйте позже.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Ошибка соединения. Попробуйте еще раз.');
    })
    .finally(() => {
        const submitBtn = document.querySelector('.btn-submit');
        submitBtn.textContent = 'Заказать звонок';
        submitBtn.disabled = false;
    });
}

// ВАРИАНТ 2: Отправка на почту (через PHP)
// Для этого создайте файл send.php (см. ниже)
function sendToEmail(data) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('phone', data.phone);
    formData.append('email', data.email);
    formData.append('tariff', data.tariff);
    
    fetch('send.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(result => {
        if (result === 'success') {
            showSuccess('Заявка отправлена! Мы перезвоним в течение 15 минут.');
        } else {
            showError('Ошибка отправки. Попробуйте позже.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Ошибка соединения.');
    })
    .finally(() => {
        const submitBtn = document.querySelector('.btn-submit');
        submitBtn.textContent = 'Заказать звонок';
        submitBtn.disabled = false;
    });
}

// Вспомогательные функции
function showSuccess(message) {
    const form = document.getElementById('orderForm');
    form.innerHTML = `
        <div class="success-message">
            <i class="fas fa-check-circle" style="color: green; font-size: 3rem;"></i>
            <h3>Спасибо!</h3>
            <p>${message}</p>
        </div>
    `;
}

function showError(message) {
    alert(message);
}

// 3. Плавная прокрутка к якорям
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 4. Маска для телефона (формат +7 (999) 123-45-67)
document.querySelector('input[name="phone"]').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length === 0) {
        e.target.value = '';
        return;
    }
    
    if (value.length === 1) {
        e.target.value = '+7';
        return;
    }
    
    let formatted = '+7';
    if (value.length > 1) {
        formatted += ' (' + value.slice(1, 4);
    }
    if (value.length >= 5) {
        formatted += ') ' + value.slice(4, 7);
    }
    if (value.length >= 8) {
        formatted += '-' + value.slice(7, 9);
    }
    if (value.length >= 10) {
        formatted += '-' + value.slice(9, 11);
    }
    
    e.target.value = formatted;
});
```

---

## 4️⃣ send.php (если выбрали отправку на почту)

```php
<?php
// Получаем данные из формы
$name = $_POST['name'] ?? '';
$phone = $_POST['phone'] ?? '';
$email = $_POST['email'] ?? '';
$tariff = $_POST['tariff'] ?? '';

// Проверяем обязательные поля
if (empty($name) || empty($phone)) {
    echo 'error';
    exit;
}

// Формируем письмо
$to = 'your-email@example.com'; // Замените на ваш email
$subject = 'Новая заявка с сайта Кофемашины24';

$message = "
<html>
<head>
    <title>Новая заявка</title>
</head>
<body>
    <h2>Новая заявка на консультацию</h2>
    <p><strong>Имя:</strong> {$name}</p>
    <p><strong>Телефон:</strong> {$phone}</p>
    <p><strong>Email:</strong> " . (!empty($email) ? $email : 'Не указан') . "</p>
    <p><strong>Тариф:</strong> {$tariff}</p>
    <p><strong>Время заявки:</strong> " . date('Y-m-d H:i:s') . "</p>
</body>
</html>
";

$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=utf-8\r\n";
$headers .= "From: site@coffee24.ru\r\n";

// Отправляем письмо
if (mail($to, $subject, $message, $headers)) {
    echo 'success';
} else {
    echo 'error';
}
?>
```

--2. В `send.php` укажите свой email
3. В `script.js` раскомментируйте `sendToEmail(data)` и закомментируйте `sendToTelegram(data)`
