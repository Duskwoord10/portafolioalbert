import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import AlbertChatWidget from "./components/AlbertChatWidget.jsx";

import HomePage from "./pages/HomePage.jsx";
import CertificationsPage from "./pages/CertificationsPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import BlogPage from "./pages/BlogPage.jsx";
import BlogArticlePage from "./pages/BlogArticlePage.jsx";
import CompanyPage from "./pages/CompanyPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import { CollectionPage, DetailPage, CustomPage } from "./cms/PublicContent.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";

const AdminApp = import.meta.env.VITE_CMS_BUILD_TARGET === 'public' ? null :
  lazy(() => import('./cms/AdminApp.jsx'));

export default function App() {
  const target = import.meta.env.VITE_CMS_BUILD_TARGET || 'combined';
  if (target === 'admin' || (target === 'combined' &&
      (window.location.hostname === 'auth.albertsanfle.com' || window.location.pathname.startsWith('/admin'))))
    return <Suspense fallback={<div style={{ padding: 40 }}>Cargando administración…</div>}><AdminApp /></Suspense>;
  return (
    <LanguageProvider><BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          {target === 'combined' && <Route path="vista-inicio" element={<HomePage />} />}
          <Route path="certificaciones" element={<CertificationsPage />} />
          <Route path="sobre-mi" element={<AboutPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<BlogArticlePage />} />
          <Route path="methodica" element={<CompanyPage />} />
          <Route path="contacto" element={<ContactPage />} />
          <Route path="experiencia" element={<CollectionPage kind="experience" />} />
          <Route path="experiencia/:slug" element={<DetailPage kind="experience" />} />
          <Route path="proyectos" element={<CollectionPage kind="project" />} />
          <Route path="proyectos/:slug" element={<DetailPage kind="project" />} />
          <Route path="eventos" element={<CollectionPage kind="event" />} />
          <Route path="eventos/:slug" element={<DetailPage kind="event" />} />
          <Route path="galeria" element={<CollectionPage kind="album" />} />
          <Route path="galeria/:slug" element={<DetailPage kind="album" />} />
          <Route path="educacion" element={<CollectionPage kind="education" />} />
          <Route path="reconocimientos" element={<CollectionPage kind="award" />} />
          <Route path="habilidades" element={<CollectionPage kind="skill" />} />
          <Route path="cv" element={<CollectionPage kind="cv" />} />
          <Route path=":slug" element={<CustomPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      <AlbertChatWidget />
    </BrowserRouter></LanguageProvider>
  );
}
