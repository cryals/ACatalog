# ACatalog

> Каталог open-source приложений, которые можно развернуть у себя: дома, на NAS или VPS.

[![CI](https://github.com/cryals/ACatalog/actions/workflows/ci.yml/badge.svg)](https://github.com/cryals/ACatalog/actions/workflows/ci.yml)

ACatalog помогает выбрать self-hosted замену SaaS без потери контекста: найти сервис, сравнить варианты, открыть официальный репозиторий или сайт и, когда он проверен, сразу получить исходный Docker Compose-файл.

## Возможности

- **1 857 приложений** из локально зафиксированных Git-источников;
- поиск по названию, описанию, категориям, тегам и алиасам;
- прокручиваемый список категорий, фильтры по лицензии, архитектуре и Docker Compose;
- сортировка по релевантности, GitHub stars, дате обновления и названию;
- подробная страница приложения с официальными ссылками, лицензией, stars, источниками и статусом данных;
- **746 проверенных Compose-конфигураций**: текст, копирование, скачивание и ссылка на исходный файл;
- избранное и сравнение до четырёх сервисов в браузере;
- страница качества данных — неполные и требующие проверки записи видны отдельно;
- локальные WebP-иконки 512×512 и manifest их происхождения;
- тёмный монохромный интерфейс, клавиатурная навигация, видимый focus-state и адаптация для мобильных устройств.

## Быстрый старт

Нужен **Node.js 22+**.

```bash
git clone https://github.com/cryals/ACatalog.git
cd ACatalog
npm ci
npm run data:build
npm run dev
```

Vite выведет адрес локального сервера. Нормализованный каталог уже хранится в `data/catalog/apps.json`; обычная сборка не изменяет папку `raw/`.

## Production через Docker Compose

```bash
docker compose up --build -d
```

После запуска:

- сайт: <http://localhost:8080>
- healthcheck: <http://localhost:8080/healthz>

Контейнер запускается через Nginx в read-only режиме с security headers, CSP, healthcheck и без лишних Linux capabilities. Перед внешним размещением замените проброшенный порт и настройте reverse proxy/TLS на своей инфраструктуре.

## Проверка перед изменениями

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run test:e2e
```

## Обновление каталога

`raw/` — это исходный, локально склонированный материал. Его не редактируют вручную и не меняют во время обычной сборки.

```bash
npm run data:sources      # fast-forward чистых исходных Git-клонов
npm run data:inventory    # manifest и статистика источников
npm run data:build        # нормализация, Compose и quality report
npm run data:github       # stars, forks и last push; использует cache
npm run data:icons        # favicon/fallback → WebP 512×512
npm run data:deployments  # поиск Compose в официальных репозиториях
npm run data:version      # snapshot и changelog index
```

Полный pipeline из текущих источников:

```bash
npm run data:all
```

`GITHUB_TOKEN` необязателен, но снимает низкий публичный rate limit при GitHub enrichment. Передавайте его через окружение или GitHub Actions secret — никогда не добавляйте токен в репозиторий.

## Provenance и Docker Compose

Каждая запись каталога хранит источник фактов:

- каталог-источник в `raw/`;
- название и URL исходного репозитория;
- commit SHA/ref и путь к README или Compose-файлу;
- дату импорта, валидацию и предупреждения.

ACatalog не выдумывает Compose, сайт, GitHub URL, лицензию или stars. Если официальный Compose не найден либо связь с приложением неоднозначна, интерфейс ведёт к официальной документации вместо генерации конфигурации наугад.

## Структура проекта

```text
src/                    Vue 3-приложение
tests/                  unit- и Playwright-тесты
scripts/                импорт, нормализация, enrichment, иконки и snapshots
data/catalog/           нормализованный каталог и quality report
data/icons/             локальные WebP-иконки и их метаданные
data/overrides/         явные, проверяемые исключения pipeline
public/data/            runtime-данные и Compose-файлы для приложения
raw/                    внешние Git-клоны, immutable input (не коммитятся)
raw/deployments/        минимальные официальные клоны с Compose (не коммитятся)
deploy/                 Nginx-конфигурация для production image
.github/workflows/      CI и еженедельное обновление каталога
docs/                   эксплуатация и проектные решения
```

## Автоматизация GitHub

- **CI** на каждый pull request и push в `main`: сборка данных, lint, typecheck, unit-тесты, production build и Playwright smoke.
- **Weekly refresh**: обновляет источники, пересобирает каталог и открывает отдельный pull request. Автоматизация не публикует изменения в `main` сама — их можно проверить до merge.

## Технологии

- Vue 3 + TypeScript strict + Vite;
- shadcn-vue conventions, Tailwind CSS 4 и Lucide;
- IBM Plex Sans и JetBrains Mono;
- Vitest и Playwright;
- Node.js data pipeline, Sharp и WebP;
- Nginx, Docker и Docker Compose.

## Безопасность и лицензии

ACatalog агрегирует метаданные сторонних проектов и не гарантирует безопасность их контейнеров. Перед запуском любого сервиса проверяйте официальный репозиторий, лицензию, версии образов, переменные окружения, секреты и открытые порты.

Проект не отображает внешний Markdown как HTML; ссылки проходят protocol allowlist, а production Nginx добавляет CSP и базовые security headers. Подробнее — в [docs/OPERATIONS.md](docs/OPERATIONS.md).
