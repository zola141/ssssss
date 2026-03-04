import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<MainLayout />}>
      <Route index element={<HomePage />} />
      <Route path='privacy' element={<PrivacyPage />} />
      <Route path='terms' element={<TermsPage />} />
      <Route path='contact' element={<ContactPage />} />
      <Route path='*' element={<NotFoundPage />} />
    </Route>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}