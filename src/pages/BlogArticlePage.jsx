import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { usePublicContent } from "../cms/usePublicContent.js";
import { cmsArticle } from "../cms/publicModels.js";
import { ContentBlocks } from "../cms/PublicContent.jsx";
import { usePageMetadata } from "../cms/usePageMetadata.js";
import { ArticleArtwork } from "./BlogPage.jsx";
import "./BlogPage.css";

export default function BlogArticlePage() {
  const { slug } = useParams();
  const records = usePublicContent('blog', []);
  const published = records.map(cmsArticle);
  const article = published.find((item) => item.slug === slug);
  usePageMetadata(article?.title, article?.excerpt, `/blog/${slug}`, article?.image);

  if (!article) {
    return <section className="blog-article blog-article--missing"><div className="blog-container"><Link className="blog-back" to="/blog"><ArrowLeft size={17} /> Volver al blog</Link><h1>Este artículo no existe.</h1><p>Explora las guías y ejemplos disponibles en el blog.</p></div></section>;
  }

  const nextArticle = published[(published.indexOf(article) + 1) % published.length];

  return <article className="blog-article">
    <div className="blog-container">
      <Link className="blog-back" to="/blog"><ArrowLeft size={17} /> Volver a todos los artículos</Link>
      <header className="blog-article__header">
        <div className="blog-article__meta"><span>{article.category}</span><span className="blog-article__dot">·</span><span><Clock3 size={15} /> {article.readTime} min de lectura</span></div>
        <h1>{article.title}</h1>
        <p>{article.excerpt}</p>
      </header>
      <ArticleArtwork article={article} featured />
      <div className="blog-article__layout">
        <aside className="blog-article__toc"><span>EN ESTA GUÍA</span>{article.sections.map((section, index) => <a href={"#seccion-" + index} key={section.title}>{String(index + 1).padStart(2, "0")} <span>{section.title}</span></a>)}</aside>
        <div className="blog-article__content">
          <p className="blog-article__intro">{article.intro}</p>
          {article.blocks?.length ? <ContentBlocks blocks={article.blocks} /> : article.sections.map((section, index) => <section key={section.title} id={"seccion-" + index}><span className="blog-article__section-number">0{index + 1} /</span><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</section>)}
          <div className="blog-article__end"><BookOpen size={22} /><div><strong>Gracias por leer.</strong><p>Más ideas prácticas sobre cloud, automatización y desarrollo en el blog.</p></div></div>
        </div>
      </div>
      <Link className="blog-next" to={"/blog/" + nextArticle.slug}><span>SIGUIENTE LECTURA <strong>{nextArticle.title}</strong></span><ArrowRight size={24} /></Link>
    </div>
  </article>;
}
