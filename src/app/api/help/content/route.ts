import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルパラメータが必要です' },
        { status: 400 }
      );
    }

    // セキュリティ: パストラバーサル攻撃を防ぐ
    if (file.includes('..') || file.includes('\\') || !file.endsWith('.md')) {
      return NextResponse.json(
        { error: '無効なファイルパスです' },
        { status: 400 }
      );
    }

    // ファイルパスを構築
    const projectRoot = process.cwd();
    let filePath: string;

    // 動的読み込みに対応した新しいパス解決ロジック
    if (file.startsWith('docs/')) {
      // docsで始まる場合はそのまま使用
      filePath = join(projectRoot, file);
    } else if (file.includes('/')) {
      // サブディレクトリが含まれる場合はdocs配下として扱う
      filePath = join(projectRoot, 'docs', file);
    } else {
      // それ以外はdocsディレクトリ直下として扱う
      filePath = join(projectRoot, 'docs', file);
    }

    // ファイルの存在確認（デバッグ情報付き）
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      console.error(`Project root: ${projectRoot}`);
      console.error(`Requested file: ${file}`);
      return NextResponse.json(
        { error: `ファイルが見つかりません: ${filePath}` },
        { status: 404 }
      );
    }

    // ファイル読み込み
    const content = await readFile(filePath, 'utf-8');

    // H1タイトルを抽出（最初の # で始まる行）
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : file.replace(/\.md$/, '').replace(/[-_]/g, ' ');

    return NextResponse.json({
      content,
      file,
      title,
      lastModified: new Date().toISOString()
    });

  } catch (error) {
    console.error('Help content API error:', error);
    return NextResponse.json(
      { error: 'ファイルの読み込みに失敗しました' },
      { status: 500 }
    );
  }
}