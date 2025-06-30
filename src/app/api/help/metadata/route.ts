import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json();

    if (!files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'ファイル配列が必要です' },
        { status: 400 }
      );
    }

    const projectRoot = process.cwd();
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          // セキュリティチェック
          if (file.includes('..') || file.includes('\\') || !file.endsWith('.md')) {
            return { file, error: '無効なファイルパス' };
          }

          // ファイルパスを構築（content APIと同じロジック）
          let filePath: string;
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

          // ファイルの存在確認
          if (!existsSync(filePath)) {
            return { file, error: 'ファイルが見つかりません' };
          }

          // ファイル読み込み（最初の100行まで）
          const content = await readFile(filePath, 'utf-8');
          const lines = content.split('\n').slice(0, 100).join('\n');

          // H1タイトルを抽出
          const titleMatch = lines.match(/^#\s+(.+)$/m);
          const title = titleMatch ? titleMatch[1] : file.replace(/\.md$/, '').replace(/[-_]/g, ' ');

          // 説明を抽出（H2の概要セクションまたは最初の段落）
          const descMatch = lines.match(/^##\s*(?:📋\s*)?概要\s*\n+([\s\S]*?)(?=\n##|\n#|$)/m);
          let description = '';
          
          if (descMatch) {
            description = descMatch[1].trim().split('\n')[0];
          } else {
            // 概要セクションがない場合、H1の次の段落を取得
            const h1Index = lines.indexOf(titleMatch ? titleMatch[0] : '');
            if (h1Index !== -1) {
              const afterH1 = lines.substring(h1Index + (titleMatch ? titleMatch[0].length : 0));
              const paragraphMatch = afterH1.match(/\n\n([^#\n].+?)(?=\n\n|\n#|$)/);
              if (paragraphMatch) {
                description = paragraphMatch[1].trim();
              }
            }
          }

          return {
            file,
            title,
            description: description || 'ドキュメントの詳細はクリックしてご確認ください。',
            success: true
          };
        } catch (error) {
          return {
            file,
            error: 'ファイルの読み込みに失敗しました',
            success: false
          };
        }
      })
    );

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Help metadata API error:', error);
    return NextResponse.json(
      { error: 'メタデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}