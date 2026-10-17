# План ACatalog: от исходных клонов до production-ready

## 0. Зафиксированная цель

Сделать быстрый каталог self-hosted приложений: пользователь вводит запрос, сужает выдачу фильтрами, сортирует варианты и открывает карточку с официальными ссылками, GitHub, Docker Compose и точным источником данных.

На текущем шаге изменена только структура данных: `data/icon/` переименован в `data/icons/`. Исходные коллекции в `raw/` не менялись.

## 1. Предлагаемый продуктовый scope

### MVP

- главная страница с поиском и популярными категориями;
- список результатов с debounce-поиском;
- категории, теги, лицензии, наличие Compose и архитектура;
- сортировки: релевантность, GitHub stars, обновление, название;
- карточка/панель деталей приложения;
- поля: название, краткое и полное описание, официальный сайт, GitHub, лицензия, поддержка Docker/Compose, Compose-файл, источник и дата импорта;
- локальные WebP-иконки 512×512;
- адаптивность, тёмная тема, keyboard navigation;
- статическая сборка, Docker Compose для запуска.

### После MVP

- версии и история изменений источников;
- автоматическое обновление Git-клонов по расписанию;
- GitHub API для актуальных stars/forks/last push с кешем и rate-limit обработкой;
- пользовательские коллекции и bookmarks;
- сравнение двух или нескольких приложений;
- админский экран для разбора неоднозначных импортов;
- серверный поиск при росте каталога.

## 2. Архитектура

### Слой исходников

`raw/` остаётся immutable input layer. Отдельный importer сканирует репозитории, выделяет Markdown, ссылки, категории и Compose-файлы и записывает нормализованный результат в `data/catalog`.

### Слой данных

Рекомендуемая схема записи:

```text
App
  id, slug, name, summary, description
  categories[], tags[], aliases[]
  websiteUrl, repositoryUrl
  license, runtimes[], architectures[]
  githubStars, githubForks, lastPushedAt
  iconPath
  compose: { path, content, sourceRepo }
  provenance: { repoName, repoUrl, commitSha, sourcePath, importedAt }
  quality: { completeness, warnings[], verifiedAt }
```

На MVP допустим versioned JSON + generated search index. Перед production нужно выбрать SQLite FTS5 или PostgreSQL, исходя из фактического объёма записей и требований к обновлению.

### Слой приложения

Vue 3 + TypeScript + Vite. Компоненты отделяются от data-access и importer-кода. Дизайн-система — `shadcn-vue`, иконки — Lucide; визуальное направление — Minimalism & Swiss Style.

## 3. Этапы реализации

### Этап A — инвентаризация

1. Определить канонические источники и приоритет между дубликатами.
2. Добавить manifest с URL, clone date и commit SHA для каждого `raw`-репозитория.
3. Посчитать уникальные проекты, категории, Compose-файлы и конфликтующие ссылки.
4. Зафиксировать правила лицензий и fallback для иконок.

Результат: воспроизводимый inventory report без изменения исходных клонов.

### Этап B — импортёр

1. Парсить Markdown и локальные README.
2. Нормализовать URL и GitHub-репозитории.
3. Связывать Compose с приложением по относительному пути, имени и явному source mapping.
4. Сохранять предупреждения при неоднозначности.
5. Генерировать `data/catalog/apps.json` и отчёт качества.

Результат: каталог, который можно пересобрать одной командой.

### Этап C — иконки

1. Найти favicon официального сайта.
2. Проверить HTTP-статус, MIME, размер и читаемость.
3. При отсутствии favicon использовать согласованный fallback-источник.
4. Преобразовать в WebP 512×512, сохранить стабильное имя по slug.
5. Сохранить provenance и не перезаписывать ручные overrides.

Результат: `data/icons/*.webp` и manifest происхождения.

### Этап D — Vue MVP

1. Создать Vue 3 + TypeScript + Vite workspace.
2. Подключить `shadcn-vue`, Tailwind и Lucide.
3. Реализовать shell, поиск, фильтры, сортировку, list/card views.
4. Реализовать details drawer/page с Compose viewer и source block.
5. Добавить empty/loading/error states и deep links по slug.

Результат: локально работающий каталог на реальных импортированных данных.

### Этап E — качество

1. Unit-тесты нормализаторов, сортировки и фильтров.
2. Contract tests схемы каталога.
3. Playwright smoke: поиск, фильтр, открытие детали, копирование Compose, keyboard navigation.
4. Проверка accessibility и contrast.
5. Проверка производительности: lazy icons, reserved image size, bundle budget, no layout shift.

Результат: воспроизводимый CI с typecheck, test, build и e2e.

### Этап F — production

1. Dockerfile для сборки и лёгкой раздачи статических файлов.
2. Docker Compose для локального запуска и healthcheck.
3. CI: импорт в отдельной job, diff отчёта, тесты, build artifact.
4. Политика обновления raw-клонов и отката каталога.
5. Security review: внешние URL, XSS в Markdown/Compose, dependency audit, immutable raw layer.
6. Мониторинг ошибки импорта, размер индекса, битые ссылки и uptime.

Результат: документированный релизный процесс и deployable production artifact.

## 4. Решения по UX

- Главный экран начинается с поисковой строки, а не с декоративного hero.
- Быстрые фильтры видны рядом с результатами; сложные параметры раскрываются отдельно.
- Stars отображаются как сигнал популярности, но не подменяют релевантность и качество.
- Каждая карточка имеет понятные действия: открыть сайт, открыть GitHub, посмотреть Compose.
- Детали открываются по прямой ссылке, чтобы карточку можно было отправить другому человеку.
- Markdown и YAML санитизируются и показываются с явной ссылкой на первоисточник.

## 5. Definition of Done для production

- все показываемые факты имеют provenance;
- каталог пересобирается из raw без ручного редактирования результата;
- нет критичных ошибок typecheck, тестов и сборки;
- Playwright проходит на desktop и mobile viewport;
- keyboard-only сценарий работает для поиска, фильтров и details;
- изображения локальные, WebP 512×512, без layout shift;
- README и AGENTS.md соответствуют фактической структуре;
- есть rollback-процедура для неудачного импорта;
- опубликован только проверенный build artifact.

## 6. Следующий шаг после согласования дизайна

Перед началом реализации нужно подтвердить дизайн-решение: Vue 3 + TypeScript + Vite, `shadcn-vue` + Lucide, Minimalism & Swiss Style, dark/light theme и details page вместо перегруженного модального окна. После этого можно писать отдельную implementation plan и создавать исходники приложения.

