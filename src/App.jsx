import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout.jsx";

import HomePage from "./pages/HomePage.jsx";
import CertificationsPage from "./pages/CertificationsPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import DeliverablesPage from "./pages/DeliverablesPage.jsx";
import CompanyPage from "./pages/CompanyPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="certificaciones" element={<CertificationsPage />} />
          <Route path="sobre-mi" element={<AboutPage />} />
          <Route path="entregables" element={<DeliverablesPage />} />
          <Route path="methodica" element={<CompanyPage />} />
          <Route path="contacto" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
