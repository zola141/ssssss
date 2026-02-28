import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MainLayout() {
  return (
    <div className="page-bg">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}