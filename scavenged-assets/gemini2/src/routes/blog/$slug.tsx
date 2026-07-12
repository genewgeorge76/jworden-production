import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useSeo } from '../../lib/useSeo';
import { getPostBySlug, renderPostBody, SERVICES, CITIES, buildSlug } from '../../data/blog';
import SectionBackdrop from '../../components/SectionBackdrop';

export const Route = createFileRoute('/blog/$slug')({
  component: BlogPostPage,
});

const PHONE = '804-446-1296';
const PHONE_HREF = 'tel:+18044461296';

function BlogPostPage() {
  const { slug } = useParams({ from: '/blog/$slug' });
  const post = getPostBySlug(slug);

  useSeo({
    title: post ? post.title : 'Blog · J. Worden & Sons',
    description: post?.metaDescription ?? 'Asphalt paving and sealcoating insights from J. Worden & Sons, Class A contractor in Chester, Virginia.',
    path: `/blog/${slug}`,
  });

  if (!post) {
    return (
      <main className="min-h-screen bg-black px-6 py-32 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] uppercase tracking-[0.32em] text-white/75">Not found</p>
          <h1 className="mt-4 text-3xl font-light tracking-tight">That post does not exist.</h1>
          <Link to="/" className="mt-8 inline-block text-sm text-white/60 underline-offset-4 hover:underline">
            Return home
          </Link>
        </div>
      </main>
    );
  }

  const body = renderPostBody(post);

  // Related posts: same service in other cities (5) + same city other services
  const sameService = CITIES
    .filter((c) => c.name !== post.city)
    .slice(0, 6)
    .map((c) => ({ slug: buildSlug(post.service.slug, c.name), label: `${post.service.name} in ${c.name}` }));

  const sameCity = SERVICES
    .filter((s) => s.slug !== post.service.slug)
    .map((s) => ({ slug: buildSlug(s.slug, post.city), label: `${s.name} in ${post.city}` }));

  return (
    <main className="min-h-screen bg-premium-black grain text-white antialiased">
      {/* Header */}
      <section className="relative isolate overflow-hidden border-b border-white/[0.04]">
        <SectionBackdrop video="/video/segment-2.mp4" opacity={0.6} />
        <div className="relative mx-auto max-w-3xl px-6 py-24 md:py-32">
          <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">
            {post.service.name} · {post.region}
          </p>
          <h1 className="mt-6 text-4xl font-light leading-[1.05] tracking-tight md:text-6xl">
            {post.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/65">{post.service.blurb}</p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.28em] text-white/45">
            <span>By J. Worden &amp; Sons</span>
            <span>·</span>
            <span>Class A Contractor · Chester, VA</span>
            <span>·</span>
            <a href={PHONE_HREF} className="text-white/80 hover:text-white">
              Call {PHONE}
            </a>
          </div>
        </div>
      </section>

      {/* Body */}
      <article className="border-b border-white/[0.04]">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          {body.map((para, i) => (
            <p key={i} className="mb-7 text-[17px] leading-[1.75] text-white/80">
              {para}
            </p>
          ))}

          {/* Inline CTA */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-10">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">
                Estimating {post.city}
              </p>
              <p className="mt-2 text-base text-white/80">
                Same crew, same trucks, same foreman. 24-hour quote turnaround.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href={PHONE_HREF}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90"
              >
                Call {PHONE}
              </a>
              <Link
                to="/contact"
                className="rounded-full border border-white/25 px-5 py-2.5 text-sm text-white hover:bg-white/5"
              >
                Request estimate →
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Related */}
      <section className="border-b border-white/[0.04]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">Related</p>
          <h2 className="mt-3 text-2xl font-light tracking-tight">
            More {post.service.name.toLowerCase()} posts &amp; {post.city} services
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2">
            <div>
              <p className="mb-4 text-[10px] uppercase tracking-[0.32em] text-white/35">
                {post.service.name} · other cities
              </p>
              <ul className="space-y-2 text-sm text-white/70">
                {sameService.map((p) => (
                  <li key={p.slug}>
                    <Link to="/blog/$slug" params={{ slug: p.slug }} className="hover:text-white">
                      {p.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-[10px] uppercase tracking-[0.32em] text-white/35">
                {post.city} · other services
              </p>
              <ul className="space-y-2 text-sm text-white/70">
                {sameCity.map((p) => (
                  <li key={p.slug}>
                    <Link to="/blog/$slug" params={{ slug: p.slug }} className="hover:text-white">
                      {p.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12">
            <Link
              to={post.service.parent}
              className="text-[11px] uppercase tracking-[0.32em] text-white/55 hover:text-white"
            >
              ← Back to {post.service.name}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default BlogPostPage;
