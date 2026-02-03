import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/i18n";

// Layouts
import { MainLayout, AdminLayout } from "@/components/layout";

// Auth pages
import { LoginPage, RegisterPage, CompanySetupPage, PendingApprovalPage, AdminLoginPage } from "@/pages/auth";

// Main pages
import { DashboardPage } from "@/pages/dashboard";
import { DeclarationsPage } from "@/pages/declarations";
import { CertificatesPage } from "@/pages/certificates";
import { TasksPage } from "@/pages/tasks";
import { DocumentsPage } from "@/pages/documents";
import { ClientsPage } from "@/pages/clients";
import { PartnersPage } from "@/pages/partners";
import { EmployeesPage } from "@/pages/employees";
import { RequestsPage } from "@/pages/requests";
import { SettingsPage } from "@/pages/settings";

// Admin pages
import { AdminDashboardPage, AdminCompaniesPage, AdminUsersPage, AdminRequestsPage } from "@/pages/admin";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/company-setup" element={<CompanySetupPage />} />
            <Route path="/pending-approval" element={<PendingApprovalPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Main app routes */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/declarations" element={<DeclarationsPage />} />
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/partners" element={<PartnersPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="companies" element={<AdminCompaniesPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="requests" element={<AdminRequestsPage />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
