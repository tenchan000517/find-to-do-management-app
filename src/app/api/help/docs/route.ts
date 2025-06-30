import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { readFile } from 'fs/promises';

export async function GET(request: NextRequest) {
  try {
    const projectRoot = process.cwd();
    const docsPath = join(projectRoot, 'docs');
    
    const sections = await scanDocumentSections(docsPath);
    
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error scanning documents:', error);
    return NextResponse.json(
      { error: 'Failed to scan documents' },
      { status: 500 }
    );
  }
}

interface DocFile {
  name: string;
  path: string;
  title: string;
  description: string;
}

interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  files: DocFile[];
}

async function scanDocumentSections(docsPath: string): Promise<DocSection[]> {
  const sections: DocSection[] = [];
  
  try {
    const entries = await readdir(docsPath, { withFileTypes: true });
    
    // Root level files (quick-start section)
    const rootFiles = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => entry.name);
    
    if (rootFiles.length > 0) {
      const files = await Promise.all(
        rootFiles.map(async (filename) => {
          const filePath = join(docsPath, filename);
          const metadata = await extractMetadata(filePath);
          return {
            name: filename,
            path: filename,
            title: metadata.title || filename.replace('.md', ''),
            description: metadata.description || ''
          };
        })
      );
      
      sections.push({
        id: 'quick-start',
        title: 'クイックスタート',
        description: '15分で体験開始 - 基本セットアップから最初の価値体験まで',
        icon: 'BookOpen',
        files
      });
    }
    
    // Directory-based sections
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sectionPath = join(docsPath, entry.name);
        const sectionFiles = await scanDirectory(sectionPath, entry.name);
        
        if (sectionFiles.length > 0) {
          const sectionConfig = getSectionConfig(entry.name);
          sections.push({
            id: entry.name,
            title: sectionConfig.title,
            description: sectionConfig.description,
            icon: sectionConfig.icon,
            files: sectionFiles
          });
        }
      }
    }
    
    return sections;
  } catch (error) {
    console.error('Error scanning document sections:', error);
    return [];
  }
}

async function scanDirectory(dirPath: string, dirName: string): Promise<DocFile[]> {
  const files: DocFile[] = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const filePath = join(dirPath, entry.name);
        const metadata = await extractMetadata(filePath);
        
        files.push({
          name: entry.name,
          path: `${dirName}/${entry.name}`,
          title: metadata.title || entry.name.replace('.md', ''),
          description: metadata.description || ''
        });
      }
    }
    
    // Sort files by name
    files.sort((a, b) => a.name.localeCompare(b.name));
    
    return files;
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    return [];
  }
}

async function extractMetadata(filePath: string): Promise<{ title: string; description: string }> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    let title = '';
    let description = '';
    
    // Extract title (first H1)
    for (const line of lines) {
      if (line.startsWith('# ')) {
        title = line.replace('# ', '').trim();
        break;
      }
    }
    
    // Extract description (first H2 概要 or first paragraph)
    let foundOverview = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('## ') && (line.includes('概要') || line.includes('Overview'))) {
        foundOverview = true;
        continue;
      }
      
      if (foundOverview && line.trim() && !line.startsWith('#')) {
        description = line.trim();
        break;
      }
      
      // Fallback: use first non-empty paragraph
      if (!foundOverview && line.trim() && !line.startsWith('#') && !title) {
        description = line.trim();
        break;
      }
    }
    
    return { title, description };
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error);
    return { title: '', description: '' };
  }
}

function getSectionConfig(dirName: string): { title: string; description: string; icon: string } {
  const configs: Record<string, { title: string; description: string; icon: string }> = {
    'manuals': {
      title: '機能別マニュアル',
      description: '詳細な操作方法・設定ガイド',
      icon: 'FileText'
    },
    'user-flows': {
      title: 'ユーザーフロー・活用ガイド', 
      description: '段階別学習パス - Level 1から限界突破まで',
      icon: 'Users'
    },
    'specifications': {
      title: '技術仕様・API',
      description: '開発者・上級者向け技術情報',
      icon: 'Settings'
    }
  };
  
  return configs[dirName] || {
    title: dirName.charAt(0).toUpperCase() + dirName.slice(1),
    description: `${dirName}に関するドキュメント`,
    icon: 'File'
  };
}
