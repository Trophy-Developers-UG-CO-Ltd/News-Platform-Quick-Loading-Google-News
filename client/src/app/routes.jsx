import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import AdminRoute from '../components/protected/AdminRoute';
import ProtectedRoute from '../components/protected/ProtectedRoute';
import AdminLayout from '../components/layout/AdminLayout';

const Home = lazy(() => import('../pages/MukonoHome'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const LoginPage = lazy(() => import('../pages/Login'));
const RegisterPage = lazy(() => import('../pages/Register'));
const ContactUsPage = lazy(() => import('../pages/ContactUs'));
const PrivacyPolicyPage = lazy(() => import('../pages/PrivacyPolicy'));
const TermsConditionsPage = lazy(() => import('../pages/TermsConditions'));
const TranslatorPage = lazy(() => import('../pages/TranslatorPage'));
const MaintenancePage = lazy(() => import('../pages/MaintenancePage'));
const NewsPage = lazy(() => import('../pages/NewsPage'));
const NewsArticlePage = lazy(() => import('../pages/NewsArticlePage'));
const LocalUpdatesPage = lazy(() => import('../pages/LocalUpdatesPage'));
const EntertainmentPage = lazy(() => import('../pages/EntertainmentPage'));
const VideosPage = lazy(() => import('../pages/VideosPage'));
const AdvertisePage = lazy(() => import('../pages/AdvertisePage'));
const ArticlesPage = lazy(() => import('../pages/ArticlesPage'));
const ArticlePage = lazy(() => import('../pages/ArticlePage'));
const DynamicPage = lazy(() => import('../pages/DynamicPage'));

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminPages = lazy(() => import('../pages/admin/AdminPages'));
const AdminPageEditor = lazy(() => import('../pages/admin/AdminPageEditor'));
const AdminArticles = lazy(() => import('../pages/admin/AdminArticles'));
const AdminArticleEditor = lazy(() => import('../pages/admin/AdminArticleEditor'));
const AdminArticleAnalytics = lazy(() => import('../pages/admin/AdminArticleAnalytics'));
const AdminHero = lazy(() => import('../pages/admin/AdminHero'));
const AdminHomeSections = lazy(() => import('../pages/admin/AdminHomeSections'));
const AdminNavMenu = lazy(() => import('../pages/admin/AdminNavMenu'));
const AdminFooter = lazy(() => import('../pages/admin/AdminFooter'));
const AdminDocuments = lazy(() => import('../pages/admin/AdminDocuments'));
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories'));
const AdminSEO = lazy(() => import('../pages/admin/AdminSEO'));
const AdminSeoOverview = lazy(() => import('../pages/admin/seo/overview'));
const AdminRedirects = lazy(() => import('../pages/admin/AdminRedirects'));
const AdminTranslationDashboard = lazy(() => import('../pages/admin/AdminTranslationDashboard'));
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminAuditLogs = lazy(() => import('../pages/admin/AdminAuditLogs'));
const AdminDownloadLogs = lazy(() => import('../pages/admin/AdminDownloadLogs'));
const AdminBranding = lazy(() => import('../pages/admin/AdminBranding'));
const AdminMaintenance = lazy(() => import('../pages/admin/AdminMaintenance'));
const AdminAdvertiseInquiries = lazy(() => import('../pages/admin/AdminAdvertiseInquiries'));

const EditorDashboardPage = lazy(() => import('../pages/editor/EditorDashboardPage'));
const EditorCategoriesPage = lazy(() => import('../pages/editor/EditorCategoriesPage'));
const EditorArticleFormPage = lazy(() => import('../pages/editor/EditorArticleFormPage'));
const Mukono11Login = lazy(() => import('../pages/Mukono11Login'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Suspense fallback
const SuspenseFallback = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <Spinner size="lg" />
  </div>
);



const AppRoutes = () => {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/mukono11login" element={<Mukono11Login />} />
        <Route path="/contact" element={<ContactUsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsConditionsPage />} />
        <Route path="/translator" element={<TranslatorPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:slug" element={<NewsArticlePage />} />
        <Route path="/blog" element={<ArticlesPage />} />
        <Route path="/blog/:slug" element={<ArticlePage />} />
        <Route path="/local" element={<LocalUpdatesPage />} />
        <Route path="/entertainment" element={<EntertainmentPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/advertise" element={<AdvertisePage />} />
        <Route path="/editor" element={<EditorDashboardPage />} />
        <Route path="/editor/categories" element={<EditorCategoriesPage />} />
        <Route path="/editor/articles/new" element={<EditorArticleFormPage />} />
        <Route path="/editor/articles/:id/edit" element={<EditorArticleFormPage />} />

        <Route
          path="/admin/*"
          element={(
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          )}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="pages" element={<AdminPages />} />
          <Route path="pages/new" element={<AdminPageEditor />} />
          <Route path="pages/:id/edit" element={<AdminPageEditor />} />
          <Route path="articles" element={<AdminArticles />} />
          <Route path="articles/new" element={<AdminArticleEditor />} />
          <Route path="articles/:id/edit" element={<AdminArticleEditor />} />
          <Route path="articles/analytics" element={<AdminArticleAnalytics />} />
          <Route path="hero" element={<AdminHero />} />
          <Route path="home-sections" element={<AdminHomeSections />} />
          <Route path="navigation" element={<AdminNavMenu />} />
          <Route path="footer" element={<AdminFooter />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="seo" element={<AdminSEO />} />
          <Route path="seo/overview" element={<AdminSeoOverview />} />
          <Route path="redirects" element={<AdminRedirects />} />
          <Route path="translation-dashboard" element={<AdminTranslationDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="audit" element={<AdminAuditLogs />} />
          <Route path="download-logs" element={<AdminDownloadLogs />} />
          <Route path="branding" element={<AdminBranding />} />
          <Route path="maintenance" element={<AdminMaintenance />} />
          <Route path="advertise-inquiries" element={<AdminAdvertiseInquiries />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/:slug" element={<DynamicPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

// MukonoTalks

