import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductPage from './pages/ProductPage';
import Contact from './pages/Contact';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminHero from './pages/admin/AdminHero';
import AdminReviews from './pages/admin/AdminReviews';
import AdminContact from './pages/admin/AdminContact';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLogin from './pages/admin/AdminLogin';
import AdminRegister from './pages/admin/AdminRegister';

export default function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Hidden Protected Admin Portal Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="hero" element={<AdminHero />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="contact" element={<AdminContact />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Public Admin Auth Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/register" element={<AdminRegister />} />

              {/* Customer Store Front Routes (Untouched) */}
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                <Route path="product/:id" element={<ProductPage />} />
                <Route path="contact" element={<Contact />} />
                <Route path="*" element={<Home />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
