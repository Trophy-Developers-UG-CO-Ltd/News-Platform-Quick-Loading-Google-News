import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';

const Home = lazy(() => import('../pages/MukonoHome'));
const NewsPage = lazy(() => import('../pages/NewsPage'));
const NewsArticlePage = lazy(() => import('../pages/NewsArticlePage'));
const LocalUpdatesPage = lazy(() => import('../pages/LocalUpdatesPage'));
const EntertainmentPage = lazy(() => import('../pages/EntertainmentPage'));
const VideosPage = lazy(() => import('../pages/VideosPage'));
const EditorDashboardPage = lazy(() => import('../pages/editor/EditorDashboardPage'));
const EditorArticleFormPage = lazy(() => import('../pages/editor/EditorArticleFormPage'));
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
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:slug" element={<NewsArticlePage />} />
        <Route path="/local" element={<LocalUpdatesPage />} />
        <Route path="/entertainment" element={<EntertainmentPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/editor" element={<EditorDashboardPage />} />
        <Route path="/editor/articles/new" element={<EditorArticleFormPage />} />
        <Route path="/editor/articles/:id/edit" element={<EditorArticleFormPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

// MukonoTalks

