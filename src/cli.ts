/**
 * AWS麻雀牌 - CLIエントリーポイント
 * 
 * コマンドラインからSVG牌を生成するためのエントリーポイント
 * Requirements: 4.4 - バッチ生成コマンド
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { TileConfig } from './types';
import { validateTileConfig } from './validator';
import { generateAll } from './generator';

// ============================================================================
// 定数 (Constants)
// ============================================================================

/** デフォルトの設定ファイルパス */
const DEFAULT_CONFIG_PATH = './tile-config.json';

/** デフォルトの出力ディレクトリ */
const DEFAULT_OUTPUT_DIR = './output';

// ============================================================================
// ヘルプ表示 (Help Display)
// ============================================================================

/**
 * ヘルプメッセージを表示
 */
function printHelp(): void {
  console.log(`
AWS麻雀牌 SVG生成ツール

Usage: npx ts-node src/cli.ts [options]

Options:
  -c, --config <path>  設定ファイルのパス (default: ${DEFAULT_CONFIG_PATH})
  -o, --output <dir>   出力ディレクトリ (default: ${DEFAULT_OUTPUT_DIR})
  -h, --help           ヘルプを表示

Examples:
  npx ts-node src/cli.ts
  npx ts-node src/cli.ts --config ./my-config.json --output ./tiles
  npx ts-node src/cli.ts -c tile-config.json -o output
`);
}

// ============================================================================
// 引数パース (Argument Parsing)
// ============================================================================

interface CliOptions {
  configPath: string;
  outputDir: string;
  showHelp: boolean;
}

/**
 * コマンドライン引数をパース
 * 
 * @param args コマンドライン引数（process.argv.slice(2)）
 * @returns パースされたオプション
 */
function parseArgs(args: string[]): CliOptions {
  let configPath = DEFAULT_CONFIG_PATH;
  let outputDir = DEFAULT_OUTPUT_DIR;
  let showHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--config' || arg === '-c') {
      const nextArg = args[++i];
      if (nextArg) {
        configPath = nextArg;
      }
    } else if (arg === '--output' || arg === '-o') {
      const nextArg = args[++i];
      if (nextArg) {
        outputDir = nextArg;
      }
    } else if (arg === '--help' || arg === '-h') {
      showHelp = true;
    }
  }

  return { configPath, outputDir, showHelp };
}

// ============================================================================
// 設定ファイル読み込み (Config Loading)
// ============================================================================

/**
 * 設定ファイルを読み込む
 * 
 * @param configPath 設定ファイルのパス
 * @returns 牌設定
 * @throws 設定ファイルが見つからない、またはパースに失敗した場合
 */
async function loadConfig(configPath: string): Promise<TileConfig> {
  const absolutePath = path.resolve(configPath);
  
  try {
    const content = await fs.readFile(absolutePath, 'utf-8');
    const config = JSON.parse(content) as TileConfig;
    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`設定ファイルが見つかりません: ${absolutePath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`設定ファイルのJSONパースに失敗しました: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// 結果表示 (Result Display)
// ============================================================================

/**
 * 生成結果をコンソールに表示
 * 
 * Requirements: 4.5 - 生成数とエラー数をレポート
 * 
 * @param result 生成結果
 * @param outputDir 出力ディレクトリ
 */
function printResult(result: Awaited<ReturnType<typeof generateAll>>, outputDir: string): void {
  console.log('\n========================================');
  console.log('AWS麻雀牌 SVG生成結果');
  console.log('========================================\n');

  if (result.success) {
    console.log('✅ 生成完了！\n');
  } else {
    console.log('⚠️  一部エラーが発生しました\n');
  }

  console.log(`📁 出力ディレクトリ: ${path.resolve(outputDir)}`);
  console.log(`📊 生成数: ${result.generated} 牌`);
  console.log(`❌ 失敗数: ${result.failed} 牌`);
  console.log(`📋 マニフェスト: ${path.join(outputDir, 'tiles-manifest.json')}`);

  if (result.errors.length > 0) {
    console.log('\n--- エラー詳細 ---');
    result.errors.forEach((error, index) => {
      console.log(`${index + 1}. [${error.tileId}] ${error.message}`);
    });
  }

  console.log('\n========================================\n');
}

// ============================================================================
// メイン処理 (Main)
// ============================================================================

/**
 * メイン関数
 */
async function main(): Promise<void> {
  // 引数をパース
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // ヘルプ表示
  if (options.showHelp) {
    printHelp();
    process.exit(0);
  }

  console.log('\n🀄 AWS麻雀牌 SVG生成ツール\n');
  console.log(`📄 設定ファイル: ${options.configPath}`);
  console.log(`📁 出力先: ${options.outputDir}\n`);

  try {
    // 1. 設定ファイルを読み込み
    console.log('⏳ 設定ファイルを読み込み中...');
    const config = await loadConfig(options.configPath);
    console.log(`✅ 設定ファイルを読み込みました (${config.tiles.length} 牌)`);

    // 2. 設定を検証
    console.log('⏳ 設定を検証中...');
    const validationResult = validateTileConfig(config);
    
    if (!validationResult.valid) {
      console.error('\n❌ 設定ファイルにエラーがあります:\n');
      validationResult.errors.forEach((error, index) => {
        console.error(`  ${index + 1}. [${error.field}] ${error.message}`);
        if (error.tileId) {
          console.error(`     牌ID: ${error.tileId}`);
        }
      });
      process.exit(1);
    }
    console.log('✅ 設定の検証が完了しました');

    // 3. SVGを生成
    console.log('⏳ SVGを生成中...');
    const result = await generateAll(config, options.outputDir);

    // 4. 結果を表示
    printResult(result, options.outputDir);

    // 終了コードを設定
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ エラーが発生しました:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// メイン関数を実行
main().catch((error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});
