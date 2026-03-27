import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PageLayout } from './components/PageLayout';
import { VideoListPage } from './pages/VideoListPage';
import { VideoPlayerPage } from './pages/VideoPlayerPage';
import { CmsPage } from './pages/CmsPage';

export default function App() {
  return (
    <BrowserRouter>
      <PageLayout>
        <Routes>
          <Route path="/" element={<VideoListPage />} />
          <Route path="/video/:id" element={<VideoPlayerPage />} />
          <Route path="/cms" element={<CmsPage />} />
        </Routes>
      </PageLayout>
    </BrowserRouter>
  );
}
