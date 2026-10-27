import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PageLayout } from './components/layout/PageLayout';
import { HomePage } from './pages/HomePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ComponentDetailPage } from './pages/ComponentDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { MyReservationsPage } from './pages/MyReservationsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/components/:id" element={<ComponentDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/my-listings" element={<MyListingsPage />} />
      <Route path="/my-reservations" element={<MyReservationsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <PageLayout>
        <AppRoutes />
      </PageLayout>
    </BrowserRouter>
  );
};

export default App;
