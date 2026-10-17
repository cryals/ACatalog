<p align="center">
  <img src="data/logo/acatalog-wordmark.png" alt="ACatalog" width="720">
</p>

<p align="center">
  <sub><code>README</code></sub><br>
  <a href="README.md"><img src="data/flag/english.webp" alt="English README" width="24" height="16"></a>
  &nbsp;|&nbsp;
  <a href="README_RU.md"><img src="data/flag/russia.webp" alt="Русский README" width="24" height="16"></a>
  &nbsp;|&nbsp;
  <a href="README_UK.md"><img src="data/flag/ukraine.webp" alt="Український README" width="24" height="16"></a>
</p>

<p align="center">
  <b>Каталог self-hosted застосунків.</b><br>
  Знайти сервіс → перевірити джерело → розгорнути у себе.
</p>

<p align="center">
  <a href="https://github.com/cryals/ACatalog/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/cryals/ACatalog/ci.yml?branch=main&style=flat-square&label=CI&labelColor=0a0a0b&color=f5f5f5" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-f5f5f5?style=flat-square&labelColor=0a0a0b" alt="AGPL-3.0"></a>
</p>

```text
1 857 APPS   /   134 CATEGORIES   /   746 VERIFIED COMPOSE FILES
```

ACatalog допомагає обрати open-source альтернативу SaaS для домашнього сервера, NAS, homelab або VPS. Кожен запис містить офіційні посилання, метадані, походження даних і перевірений Docker Compose, якщо його справді надає проєкт.

## Можливості

- Пошук за назвою, описом, категоріями, тегами й псевдонімами.
- Категорії, фільтри, обране та порівняння сервісів.
- Детальна сторінка з GitHub, сайтом, ліцензією, stars і походженням даних.
- Вихідний Compose-файл: перегляд, копіювання, завантаження та посилання на оригінал.
- Темний монохромний інтерфейс, навігація з клавіатури та адаптивна верстка.

## Швидкий старт

Потрібен Node.js 22+.

```bash
git clone https://github.com/cryals/ACatalog.git
cd ACatalog
npm ci
npm run dev
```

## Production

```bash
docker compose up --build -d
```

Сайт буде доступний на [localhost:8080](http://localhost:8080). Контейнер працює через Nginx з файловою системою лише для читання, CSP, security headers і healthcheck `/healthz`.

## Дані

```text
raw/                 вихідні Git-клони; не комітяться й не редагуються вручну
data/catalog/        нормалізований каталог і quality report
data/icons/          WebP-іконки та відомості про їхнє джерело
public/data/         дані й Compose-файли, які читає браузер
```

Кожен запис зберігає репозиторій-джерело, commit SHA/ref, шлях до README або Compose, дату імпорту та статус перевірки. ACatalog не вигадує посилання, ліцензії чи конфігурації: якщо офіційний Compose не підтверджено, інтерфейс веде до документації проєкту.

Після свіжого clone зовнішні джерела можна відновити за lock-файлом:

```bash
npm run data:bootstrap
npm run data:inventory
npm run data:build
```

## Перевірки

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run test:e2e
```

CI запускає ті самі перевірки для кожного push і pull request. Щотижневе оновлення каталогу створює окремий pull request — `main` автоматично не змінюється.

## Технології

Vue 3 · TypeScript · Vite · shadcn-vue · Tailwind CSS · Lucide · Vitest · Playwright · Sharp · Docker · Nginx

## Ліцензія

[GNU Affero General Public License v3.0](LICENSE) — AGPL-3.0-only.
