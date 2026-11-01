import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import ScrollToTop from "./ScrollToTop.jsx";
import CookieConsent from "./CookieConsent.jsx";
import PageAnalytics from "../cms/PageAnalytics.jsx";

export default function Layout() {
  return (
    <div className="app">
      <ScrollToTop />
      <PageAnalytics />
      <Navbar />

      <main className="app-main">
        <Outlet />
      </main>

      <Footer />
      <CookieConsent />
    </div>
  );
}
