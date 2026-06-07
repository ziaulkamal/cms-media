/**
 * src/modules/share/share.controller.ts
 * Halaman "jembatan" untuk crawler sosial media (WhatsApp/FB/X/Threads):
 * menyajikan meta Open Graph per-artikel (yang tak bisa dihasilkan SPA/HashRouter),
 * lalu mengalihkan pengunjung manusia ke artikel di WEB.
 *
 * Route ini DIKECUALIKAN dari global prefix (lihat main.ts) → /share/berita/:slug.
 */
import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { ArticleView } from '../articles/entities/article.entity';
import { ArticlesService } from '../articles/articles.service';
import { SettingsService } from '../settings/settings.service';

/** Escape karakter HTML agar aman di dalam atribut/teks. */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

@Controller('share')
export class ShareController {
  constructor(
    private readonly articles: ArticlesService,
    private readonly settings: SettingsService,
  ) {}

  /** Halaman share satu artikel berita. */
  @Public()
  @Get('berita/:slug')
  async berita(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const [article, map] = await Promise.all([
      this.articles.peekPublishedBySlug(slug),
      this.settings.getPublicMap(),
    ]);

    const origin = this.cmsOrigin(req);
    const frontend = (str(map.frontend_url) || origin).replace(/\/+$/, '');
    const siteName = str(map.site_title) || 'PORA Aceh Jaya';
    const target = `${frontend}/#/berita/${encodeURIComponent(slug)}`;

    if (!article) {
      res
        .status(404)
        .type('html')
        .send(
          this.page({
            title: 'Artikel tidak ditemukan',
            description: '',
            image: this.absolutize(str(map.og_default_image), origin),
            siteName,
            url: target,
            type: 'website',
          }),
        );
      return;
    }

    const title = article.seoTitle || article.title;
    const description = article.seoDescription || article.excerpt || '';
    const image = this.absolutize(
      article.featuredMedia?.url || str(map.og_default_image),
      origin,
    );

    res
      .type('html')
      .send(
        this.page({
          title,
          description,
          image,
          siteName,
          url: target,
          type: 'article',
          jsonLd: this.articleJsonLd(article, siteName, target, image),
        }),
      );
  }

  /** Halaman share situs (fallback umum). */
  @Public()
  @Get()
  async site(@Req() req: Request, @Res() res: Response): Promise<void> {
    const map = await this.settings.getPublicMap();
    const origin = this.cmsOrigin(req);
    const frontend = (str(map.frontend_url) || origin).replace(/\/+$/, '');
    const siteName = str(map.site_title) || 'PORA Aceh Jaya';
    res.type('html').send(
      this.page({
        title: siteName,
        description: str(map.site_description),
        image: this.absolutize(str(map.og_default_image), origin),
        siteName,
        url: frontend,
        type: 'website',
        omitTitleSuffix: true,
      }),
    );
  }

  /** Origin CMS dari request (hormati proxy via x-forwarded-*). */
  private cmsOrigin(req: Request): string {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
    return `${proto}://${host}`;
  }

  /** Jadikan URL absolut (media bisa berupa path relatif /uploads/...). */
  private absolutize(url: string, origin: string): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  /** Structured data NewsArticle. */
  private articleJsonLd(
    a: ArticleView,
    siteName: string,
    url: string,
    image: string,
  ): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: a.title,
      description: a.seoDescription || a.excerpt || undefined,
      image: image ? [image] : undefined,
      articleSection: a.category?.name,
      datePublished: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
      author: { '@type': 'Person', name: a.author?.name },
      publisher: { '@type': 'Organization', name: siteName },
      mainEntityOfPage: url,
    };
  }

  /** Rakit dokumen HTML: meta OG/Twitter + JSON-LD + redirect manusia ke WEB. */
  private page(opts: {
    title: string;
    description: string;
    image: string;
    siteName: string;
    url: string;
    type: 'article' | 'website';
    jsonLd?: object;
    omitTitleSuffix?: boolean;
  }): string {
    const fullTitle = opts.omitTitleSuffix
      ? opts.title
      : `${opts.title} — ${opts.siteName}`;
    const t = esc(fullTitle);
    const d = esc(opts.description);
    const img = esc(opts.image);
    const url = esc(opts.url);
    const site = esc(opts.siteName);
    const jsonLd = opts.jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd).replace(/</g, '\\u003c')}</script>`
      : '';

    return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${t}</title>
<meta name="description" content="${d}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="${opts.type}" />
<meta property="og:site_name" content="${site}" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:url" content="${url}" />
${img ? `<meta property="og:image" content="${img}" />` : ''}
<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
${img ? `<meta name="twitter:image" content="${img}" />` : ''}
${jsonLd}
<meta http-equiv="refresh" content="0; url=${url}" />
</head>
<body>
<p>Mengalihkan ke <a href="${url}">${t}</a>…</p>
<script>location.replace(${JSON.stringify(opts.url)});</script>
</body>
</html>`;
  }
}
