import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

// Renders a doc. No rehype-raw, so raw HTML inside the markdown is never rendered.
// Element styles live under .doc in globals.css.
export function DocMarkdown({ source }: { source: string }) {
  return (
    <div className="doc">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          a: ({ href = "", children }) =>
            /^https?:\/\//.test(href) ? (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            ) : (
              <a href={href}>{children}</a>
            ),
          table: ({ children }) => (
            <div className="doc-table">
              <table>{children}</table>
            </div>
          ),
          img: ({ src, alt }) => (
            // README images come from raw.githubusercontent.com; sizes are unknown
            // eslint-disable-next-line @next/next/no-img-element
            <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />
          ),
        }}
      >
        {source}
      </Markdown>
    </div>
  );
}
