# Railway Deployment Guide

Пошаговая инструкция по деплою CRM на Railway.

## Предварительные требования

- GitHub аккаунт
- Railway аккаунт (https://railway.app)
- Код загружен в GitHub репозиторий

---

## Шаг 1: Подготовка репозитория

```bash
# Убедитесь что .gitignore обновлен
git add .
git commit -m "Add deployment configuration"
git push origin main
```

---

## Шаг 2: Создание проекта в Railway

1. Зайдите на https://railway.app
2. Нажмите **"Start a New Project"**
3. Выберите **"Deploy from GitHub Repo"**
4. Авторизуйте GitHub и выберите репозиторий CRM

---

## Шаг 3: Настройка PostgreSQL

1. В проекте Railway нажмите **"+ New"**
2. Выберите **"Database" → "PostgreSQL"**
3. Railway автоматически создаст базу данных
4. Скопируйте `DATABASE_URL` из раздела Variables

---

## Шаг 4: Деплой Backend

1. Нажмите **"+ New" → "GitHub Repo"**
2. Выберите тот же репозиторий
3. В настройках укажите:
   - **Root Directory**: `backend`
   - **Start Command**: оставьте пустым (Railway использует Dockerfile)

4. Перейдите в **Variables** и добавьте:

```
DATABASE_URL=<скопированный URL из PostgreSQL>
SECRET_KEY=<сгенерируйте: openssl rand -hex 32>
DEBUG=false
FRONTEND_URL=https://ваш-домен.com
CORS_ORIGINS_STR=https://ваш-домен.com
ADMIN_LOGIN=admin
ADMIN_PASSWORD=<ваш_надежный_пароль>
```

5. Нажмите **Deploy**

---

## Шаг 5: Деплой Frontend

1. Нажмите **"+ New" → "GitHub Repo"**
2. Выберите тот же репозиторий
3. В настройках Root Directory оставьте пустым (корень)

4. В **Variables** добавьте:

```
VITE_API_URL=https://<backend-url>.railway.app/api/v1
```

> Замените `<backend-url>` на URL вашего backend сервиса

5. Нажмите **Deploy**

---

## Шаг 6: Миграции базы данных

1. Откройте терминал backend сервиса в Railway
2. Выполните:

```bash
alembic upgrade head
```

---

## Шаг 7: Подключение домена

### Для Backend:
1. Settings → Domains → **Generate Domain** или **Custom Domain**
2. Для custom domain: добавьте CNAME запись в DNS

### Для Frontend:
1. Settings → Domains → **Custom Domain**
2. Добавьте CNAME запись:
   - Host: `@` или `www`
   - Value: `<ваш-railway-домен>.railway.app`

Railway автоматически настроит SSL!

---

## Шаг 8: Обновление переменных

После получения доменов обновите:

**Backend Variables:**
```
FRONTEND_URL=https://вашдомен.com
CORS_ORIGINS_STR=https://вашдомен.com,https://www.вашдомен.com
```

**Frontend Variables:**
```
VITE_API_URL=https://api.вашдомен.com/api/v1
```

---

## Финальная структура Railway

```
Railway Project
├── PostgreSQL (database)
├── Backend (backend/)
│   └── Environment Variables
└── Frontend (root/)
    └── Environment Variables
```

---

## Полезные команды Railway CLI

```bash
# Установка CLI
npm install -g @railway/cli

# Логин
railway login

# Просмотр логов
railway logs

# Открыть консоль
railway shell
```

---

## Решение проблем

### Backend не запускается
- Проверьте логи: `railway logs`
- Убедитесь что DATABASE_URL правильный

### Frontend не видит API
- Проверьте VITE_API_URL
- Проверьте CORS_ORIGINS_STR на backend

### Ошибка миграции
```bash
railway shell
alembic revision --autogenerate -m "fix"
alembic upgrade head
```

---

## Примерная стоимость

- **Hobby Plan**: $5/месяц
- Включает: 500 часов выполнения, 100GB bandwidth
- PostgreSQL: бесплатно в пределах лимитов

---

> 💡 **Совет**: Начните с Railway Free Tier для тестирования!
