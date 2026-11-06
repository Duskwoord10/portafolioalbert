import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, BookOpen, Clock3, Search, X } from "lucide-react";
import { usePublicContent } from "../cms/usePublicContent.js";
import { cmsArticle } from "../cms/publicModels.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import "./BlogPage.css";

export function ArticleArtwork({ article, featured = false }) {
  return <div className={"blog-art blog-art--" + article.theme + (featured ? " blog-art--featured" : "")}>
    {article.image && <img className="blog-art__image" src={article.image} alt={article.imageAlt} loading={featured ? "eager" : "lazy"} decoding="async" fetchPriority={featured ? "high" : "auto"} />}
    <div className="blog-art__shade" aria-hidden="true" />
    <span className="blog-art__code">{article.visualLabel}</span><span className="blog-art__number">{article.number}</span>
  </div>;
}

function ArticleCard({ article }) {
  const { t } = useLanguage();
  return <article className="blog-card"><Link className="blog-card__link" to={"/blog/" + article.slug} aria-label={"Leer " + article.title}>
    <ArticleArtwork article={article} />
    <div className="blog-card__body">
      <div className="blog-card__meta"><span>{article.category}</span><span>{article.readTime} {t('blog.readTime')}</span></div>
      <h3>{article.title}</h3><p>{article.excerpt}</p>
      <span className="blog-card__action">{t('blog.read')} <ArrowUpRight size={17} strokeWidth={1.8} /></span>
    </div>
  </Link></article>;
}

export default function BlogPage() {
  const { t, language } = useLanguage();
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const records = usePublicContent('blog', []);
  const published = useMemo(() => records.map(cmsArticle), [records]);
  const availableCategories = useMemo(() => ['Todos', ...new Set(published.map(article => article.category).filter(Boolean))], [published]);
  const featured = published[0];
  const filteredArticles = useMemo(() => published.filter((article) =>
    (category === "Todos" || article.category === category) &&
    (article.title + " " + article.excerpt + " " + article.category).toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))
  ), [category, query, published]);

  return <section className="blog-page"><div className="blog-container">
    <header className="blog-hero">
      <div className="blog-eyebrow"><span className="blog-eyebrow__dot" /> {t('blog.eyebrow')}</div>
      <h1>{t('blog.title')} <span>{t('blog.titleAccent')}</span></h1>
      <p>{t('blog.description')}</p>
      <div className="blog-hero__details"><span><BookOpen size={16} /> {published.length} {t('blog.articles')}</span><span className="blog-hero__separator" /><span>{t('blog.byline')}</span></div>
    </header>

    {featured && <section className="blog-featured" aria-labelledby="featured-heading">
      <div className="blog-section-label"><span>01 / {language === 'es' ? 'EN PORTADA' : 'FEATURED'}</span><span>{t('blog.featured')}</span></div>
      <Link className="blog-featured__link" to={"/blog/" + featured.slug}>
        <ArticleArtwork article={featured} featured />
        <div className="blog-featured__content">
          <span className="blog-featured__tag">{featured.category} <span>·</span> {language === 'es' ? 'GUÍA PRÁCTICA' : 'PRACTICAL GUIDE'}</span>
          <h2 id="featured-heading">{featured.title}</h2><p>{featured.excerpt}</p>
          <div className="blog-featured__bottom"><span><Clock3 size={16} /> {featured.readTime} min de lectura</span><span className="blog-featured__arrow"><ArrowUpRight size={22} /></span></div>
        </div>
      </Link>
    </section>}

    <section className="blog-library" aria-labelledby="articles-heading">
      <div className="blog-library__heading"><div><span className="blog-kicker">{t('blog.explore')}</span><h2 id="articles-heading">{t('blog.all')}<span className="blog-count">{String(filteredArticles.length).padStart(2, "0")}</span></h2></div><p>{t('blog.resources')}</p></div>
      <div className="blog-toolbar">
        <div className="blog-filters" role="group" aria-label={t('blog.filter')}>
          {availableCategories.map((item) => <button key={item} type="button" className={category === item ? "is-active" : ""} onClick={() => setCategory(item)} aria-pressed={category === item}>{item === 'Todos' ? t('blog.all') : item}</button>)}
        </div>
        <label className="blog-search"><Search size={18} aria-hidden="true" /><span className="sr-only">{t('blog.search')}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('blog.search')} />{query && <button type="button" onClick={() => setQuery("")} aria-label={language === 'es' ? 'Limpiar búsqueda' : 'Clear search'}><X size={16} /></button>}</label>
      </div>
      {filteredArticles.length > 0 ? <div className="blog-grid">{filteredArticles.map((article) => <ArticleCard key={article.slug} article={article} />)}</div> : <div className="blog-empty"><Search size={25} /><h3>{t('blog.emptyTitle')}</h3><p>{t('blog.emptyText')}</p><button type="button" onClick={() => { setCategory("Todos"); setQuery(""); }}>{t('blog.seeAll')} <ArrowRight size={16} /></button></div>}
    </section>

    <aside className="blog-note"><div className="blog-note__icon"><BookOpen size={21} /></div><div><strong>Un espacio para compartir lo aprendido.</strong><p>Estos artículos son ejemplos de contenido técnico. Iré sumando nuevas experiencias, tutoriales y proyectos.</p></div><Link to="/contacto">Conversemos <ArrowUpRight size={18} /></Link></aside>
  </div></section>;
}
