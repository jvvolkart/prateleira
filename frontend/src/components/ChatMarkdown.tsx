import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

const components: Components = {
  p: ({ children }) => (
    <p className="mb-2 text-left last:mb-0 [&:first-child]:mt-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 text-left">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 text-left">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-900 dark:text-cream">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-clinic-600 underline decoration-clinic-600/40 underline-offset-2 hover:text-clinic-500 dark:text-clinic-400 dark:hover:text-clinic-300"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt ?? ""}
      className="mt-3 max-h-80 max-w-full rounded-lg border border-zinc-200 object-contain dark:border-zinc-700"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  ),
  code: ({ children }) => (
    <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[0.9em] text-zinc-900 dark:bg-zinc-800 dark:text-cream">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100 p-3 text-left dark:border-zinc-700 dark:bg-zinc-900">
      {children}
    </pre>
  ),
};

export function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="break-words text-left">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
