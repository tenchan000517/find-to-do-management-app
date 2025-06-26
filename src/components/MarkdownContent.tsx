"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

// リンクを含むコンテンツを表示するコンポーネント（Markdown非対応の場合）
export function ContentWithLinks({ content }: { content: string }) {
  // URLを検出する正規表現
  const urlRegex = /(https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)/g;
  
  const parts = content.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        // URLかどうかをチェック
        if (urlRegex.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
}

// マークダウン対応コンテンツ表示コンポーネント
export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  // マークダウン記法があるかを簡単にチェック
  const hasMarkdown = /[#*`\[\]_~]/.test(content) || /^\s*[-*+]\s/.test(content) || /^\s*\d+\.\s/.test(content);
  
  if (!hasMarkdown) {
    // マークダウン記法がない場合は通常のリンク変換のみ
    return (
      <div className={className}>
        <ContentWithLinks content={content} />
      </div>
    );
  }

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // リンクのカスタマイズ
          a: ({ href, children, ...props }) => (
            <a
              {...props}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors"
            >
              {children}
            </a>
          ),
          // 見出しのカスタマイズ
          h1: ({ children, ...props }) => (
            <h1 {...props} className="text-xl font-bold mb-3 text-gray-900 border-b border-gray-200 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 {...props} className="text-lg font-bold mb-2 text-gray-800">
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 {...props} className="text-base font-semibold mb-2 text-gray-800">
              {children}
            </h3>
          ),
          // 段落
          p: ({ children, ...props }) => (
            <p {...props} className="mb-2 leading-relaxed">
              {children}
            </p>
          ),
          // リスト
          ul: ({ children, ...props }) => (
            <ul {...props} className="list-disc list-inside mb-2 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol {...props} className="list-decimal list-inside mb-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li {...props} className="text-gray-700">
              {children}
            </li>
          ),
          // コードブロック
          code: ({ children, ...props }: any) => {
            const inline = props.inline;
            if (inline) {
              return (
                <code {...props} className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code {...props} className="block bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-2">
                {children}
              </code>
            );
          },
          // ブロッククォート
          blockquote: ({ children, ...props }) => (
            <blockquote {...props} className="border-l-4 border-gray-300 pl-4 py-2 mb-2 text-gray-600 italic bg-gray-50">
              {children}
            </blockquote>
          ),
          // テーブル
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-2">
              <table {...props} className="min-w-full border border-gray-300 text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead {...props} className="bg-gray-50">
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th {...props} className="border border-gray-300 px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td {...props} className="border border-gray-300 px-3 py-2">
              {children}
            </td>
          ),
          // 水平線
          hr: ({ ...props }) => (
            <hr {...props} className="border-gray-300 my-4" />
          ),
          // 強調
          strong: ({ children, ...props }) => (
            <strong {...props} className="font-semibold text-gray-900">
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em {...props} className="italic text-gray-700">
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownContent;