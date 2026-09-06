import type { ReactNode } from 'react'
import Image from 'next/image'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { slugify } from '@/lib/utils'

/** Flattens rendered children back to plain text — used only to derive a heading's anchor id. */
function flattenToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flattenToText).join('')
  if (typeof node === 'object' && 'props' in node) {
    return flattenToText((node as { props?: { children?: ReactNode } }).props?.children)
  }
  return ''
}

/**
 * Heading components add the same `id` `lib/blog.ts` `extractHeadings()`
 * computes from raw markdown (both call `slugify()`), so
 * `TableOfContents` links resolve to a real anchor without the two
 * having to share a single parse pass.
 */
function AnchoredHeading({ as: Tag, children }: { as: 'h2' | 'h3'; children: ReactNode }) {
  const id = slugify(flattenToText(children))
  return (
    <Tag id={id} className="scroll-mt-24">
      <a href={`#${id}`} className="no-underline hover:underline">
        {children}
      </a>
    </Tag>
  )
}

/** Content images route through next/image (optimized, lazy by default) inside a fixed-ratio frame, since markdown gives no explicit dimensions. */
function ContentImage({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return null
  return (
    <span className="relative my-8 block aspect-video overflow-hidden rounded-2xl bg-paper-2">
      <Image src={src} alt={alt ?? ''} fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
    </span>
  )
}

const mdxComponents = {
  h2: (props: { children: ReactNode }) => <AnchoredHeading as="h2" {...props} />,
  h3: (props: { children: ReactNode }) => <AnchoredHeading as="h3" {...props} />,
  img: ContentImage,
}

/** Renders one post's MDX body inside the shared prose styling. */
export function ArticleBody({ content }: { content: string }) {
  return (
    <article className="prose prose-neutral max-w-2xl prose-headings:font-semibold prose-a:text-ground">
      <MDXRemote source={content} components={mdxComponents} />
    </article>
  )
}
