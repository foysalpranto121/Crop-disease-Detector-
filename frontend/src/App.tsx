import { lazy, Suspense, type ReactNode } from "react";
import { Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingState } from "./components/ui";
import { container } from "./lib/cn";
import DiagnosePage from "./pages/DiagnosePage";
import LandingPage from "./pages/LandingPage";
import ResultPage from "./pages/ResultPage";

// Core flow (landing → diagnose → result) loads instantly; other pages load on demand.
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const DiseasePage = lazy(() => import("./pages/DiseasePage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className={`${container} py-16`}>
          <LoadingState />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="diagnose" element={<DiagnosePage />} />
        <Route path="result/:id" element={<ResultPage />} />
        <Route path="library" element={<Lazy><LibraryPage /></Lazy>} />
        <Route path="library/:id" element={<Lazy><DiseasePage /></Lazy>} />
        <Route path="about" element={<Lazy><AboutPage /></Lazy>} />
        <Route path="login" element={<Lazy><LoginPage /></Lazy>} />
        <Route path="register" element={<Lazy><RegisterPage /></Lazy>} />
        <Route
          path="history"
          element={
            <ProtectedRoute>
              <Lazy><HistoryPage /></Lazy>
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute role="admin">
              <Lazy><AdminPage /></Lazy>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Lazy><NotFoundPage /></Lazy>} />
      </Route>
    </Routes>
  );
}
