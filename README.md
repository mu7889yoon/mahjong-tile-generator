# mahjong-tile-generator

麻雀牌画像（SVG/PNG）を生成し、PNGを印刷用レイアウトPDFに並べるツールです。

## セットアップ

```bash
npm install
```

## 1. 牌画像を生成する

`tile-config.json` を使って画像を生成します。

```bash
npm run generate
```

主なオプション:

```bash
npx ts-node src/cli.ts --config ./tile-config.json --output ./output --format svg,png
```

## 2. PNGをレイアウトしてPDFにする

`output` 配下の `.png` を読み込み、以下の仕様でPDFを出力します。

- ページ: 100mm x 148mm
- 配置: 4列 x 4行（1ページあたり4種類、各4枚）
- セル: 17mm x 24mm
- 間隔: 4mm
- 余白: 上20mm / 左10mm

実行:

```bash
npm run pdf:layout
```

出力先:

- `./output/tile-layout.pdf`

入力/出力を変更する場合:

```bash
npm run pdf:layout -- --input ./output --output ./output/tiles.pdf
```

ヘルプ:

```bash
npm run pdf:layout -- --help
```
