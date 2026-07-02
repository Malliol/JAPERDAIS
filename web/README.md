# JAPERDAIS — React-приложение

Исходники сайта (диаграмма отношений, статистика, персонажи, мир).

## Разработка

```bash
npm install
npm run dev
```

## Сборка и деплой

Сайт собирается в `../docs`, который отдаётся через GitHub Pages.

```bash
npm run build
```

После сборки закоммить и запушь папку `docs/` вместе с изменениями в `web/src`.

## Данные

`public/data.json`, `public/characters.json`, `public/world.json` и папки `public/portraits`, `public/world` — исходные данные и изображения, копируются в сборку как есть.
