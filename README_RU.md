<p align="center">
  <img src="data/logo/acatalog-wordmark.png" alt="ACatalog" width="720">
</p>

<p align="center">
  <a href="README.md"><img src="data/flag/english.webp" alt="English README" width="24" height="16"></a>
  &nbsp;
  <a href="README_RU.md"><img src="data/flag/russia.webp" alt="Русский README" width="24" height="16"></a>
  &nbsp;
  <a href="README_UK.md"><img src="data/flag/ukraine.webp" alt="Український README" width="24" height="16"></a>
</p>

<p align="center">
  <b>Каталог self-hosted приложений.</b><br>
  Найти сервис → проверить источник → развернуть у себя.
</p>

<p align="center">
  <a href="https://github.com/cryals/ACatalog/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/cryals/ACatalog/ci.yml?branch=main&style=flat-square&label=CI&labelColor=0a0a0b&color=f5f5f5" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-f5f5f5?style=flat-square&labelColor=0a0a0b" alt="AGPL-3.0"></a>
</p>

```text
1 857 APPS   /   134 CATEGORIES   /   746 VERIFIED COMPOSE FILES
```

ACatalog помогает выбрать open-source альтернативу SaaS для дома, NAS, homelab или VPS. У каждой записи есть официальные ссылки, метаданные, путь к источнику и проверенный Docker Compose — когда он действительно найден у проекта.

## Возможности

- Поиск по названию, описанию, категориям, тегам и алиасам.
- Категории, фильтры, избранное и сравнение сервисов.
- Подробная страница с GitHub, сайтом, лицензией, stars и происхождением данных.
- Исходный Compose-файл: просмотр, копирование, скачивание и ссылка на оригинал.
- Тёмный монохромный интерфейс, клавиатурная навигация и мобильная версия.

## Быстрый старт

Нужен Node.js 22+.

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

Сайт будет доступен на [localhost:8080](http://localhost:8080). Контейнер работает через Nginx, в read-only режиме, с CSP, security headers и healthcheck `/healthz`.

## Данные

```text
raw/                 исходные Git-клоны; не коммитятся и не редактируются
data/catalog/        нормализованный каталог и quality report
data/icons/          WebP-иконки и сведения об их источнике
public/data/         данные и Compose-файлы, которые читает браузер
```

Каждая запись сохраняет репозиторий-источник, commit SHA/ref, путь к README или Compose, дату импорта и статус проверки. ACatalog не придумывает ссылки, лицензии или конфигурации: если официальный Compose не подтверждён, интерфейс ведёт к документации проекта.

После свежего clone внешние источники можно восстановить по lock-файлу:

```bash
npm run data:bootstrap
npm run data:inventory
npm run data:build
```

## Проверки

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run test:e2e
```

CI запускает те же проверки для каждого push и pull request. Еженедельное обновление каталога создаёт отдельный pull request — `main` автоматически не меняется.

## Стек

Vue 3 · TypeScript · Vite · shadcn-vue · Tailwind CSS · Lucide · Vitest · Playwright · Sharp · Docker · Nginx

## Лицензия

[GNU Affero General Public License v3.0](LICENSE) — AGPL-3.0-only.
