import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

// Layout
import Header from "./components/Header";
import Footer from "./components/Footer";
import AdminRoute from "./components/AdminRoute";
import FeedbackWidget from "./components/FeedbackWidget";
import ScrollToTop from "./components/ScrollToTop";

// Pages
import Home from "./pages/Home";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Surveys from "./pages/Surveys";
import NotFound from "./pages/NotFound";
import SurveyAnalysis from "./pages/SurveyAnalysis";
import SurveyDetails from "./pages/SurveyDetails";
import SurveyTake from "./pages/SurveyTake";
import SurveyThanks from "./pages/SurveyThanks";
import Formulaires from "./pages/Formulaires";
import Templates from "./pages/Templates";
import ProductAiGeneration from "./pages/ProductAiGeneration";
import ProductAdvancedAnalytics from "./pages/ProductAdvancedAnalytics";
import Reports from "./pages/Reports";
import Collaboration from "./pages/Collaboration";
import Integrations from "./pages/Integrations";
import Entreprises from "./pages/Entreprises";
import TemplatePreview from "./pages/TemplatePreview";
import TemplatesAdmin from "./pages/TemplatesAdmin";
import Billing from "./pages/billing";
import OpenAIChat from "./pages/OpenAIChat";



// Auth
import AuthSplit from "./pages/AuthSplit";
import ProtectedRoute from "./components/ProtectedRoute";

// 🔽 nouveaux imports offline
import {
  setupOnlineSyncListener,
  runSync,
} from "./offline/syncService";

export default function App() {
  useEffect(() => {
    // écoute le retour en ligne et tente une synchro au chargement
    setupOnlineSyncListener();
    runSync();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)]">
      <Header />

      <main className="flex-grow">
        <ScrollToTop />
        <FeedbackWidget />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/features/ai" element={<ProductAiGeneration />} />
          <Route path="/features/analysis" element={<ProductAdvancedAnalytics/>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<AuthSplit mode="login" />} />
          <Route path="/register" element={<AuthSplit mode="register" />} />
          <Route path="/formulaires" element={<Formulaires />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/team" element={<Collaboration />} />
          <Route path="/entreprises" element={<Entreprises />} />
          <Route path="/templates/:id" element={<TemplatePreview />} />
          <Route path="/billing" element={<Billing />} />

          {/* route admin protégée */}
          <Route path="/templates-admin" element={<AdminRoute><TemplatesAdmin /></AdminRoute> } />

          {/* Public route to take a survey (anyone can access collect form) */}
          <Route path="/surveys/:id/take" element={<SurveyTake />} />

          {/* Routes protégées — seul l'utilisateur authentifié y accède */}
          <Route element={<ProtectedRoute />}>
            <Route path="/ai-chat" element={<OpenAIChat />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/survey/:id" element={<SurveyAnalysis />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/surveys" element={<Surveys />} />
            <Route path="/surveys/:id" element={<SurveyDetails />} />
            <Route path="/surveys/:id/thanks" element={<SurveyThanks />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
