import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({
  content,
  className = '',
  isUser = false,
}) => {
  if (isUser) {
    // For user messages, simple clean display
    return <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>{content}</div>;
  }

  return (
    <div
      className={`prose-sm max-w-none break-words text-slate-800 dark:text-slate-200 leading-relaxed ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-3.5 mb-2 pb-1 border-b border-emerald-500/30 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-emerald-800 dark:text-emerald-300 mt-3 mb-1.5 flex items-center gap-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-2.5 mb-1.5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-300">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-700 dark:text-slate-300 font-medium">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="my-2 pl-4 space-y-1.5 list-disc marker:text-emerald-600 dark:marker:text-emerald-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 pl-4 space-y-1.5 list-decimal marker:text-emerald-600 dark:marker:text-emerald-400 font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-slate-700 dark:text-slate-300 pl-1">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-emerald-500 pl-3 py-1 my-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-r-xl italic text-slate-700 dark:text-slate-300 text-xs">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isCodeBlock = className?.includes('language-');
            if (isCodeBlock) {
              return (
                <code className="block p-3 rounded-xl bg-slate-900 text-emerald-300 text-xs font-mono overflow-x-auto my-2">
                  {children}
                </code>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 font-mono text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-slate-900 rounded-xl overflow-hidden my-2 shadow-xs">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-bold">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/50">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 underline font-semibold transition"
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className="my-3 border-t border-slate-200 dark:border-slate-700" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
