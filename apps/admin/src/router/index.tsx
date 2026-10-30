import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import RequireAdmin, {
  RedirectIfAuthenticated,
} from "@/components/auth/RequireAdmin";
import AdminShell from "@/layouts/AdminShell";
import AdoptionsPage from "@/pages/adoptions/AdoptionsPage";
import CareReviewsPage from "@/pages/care/CareReviewsPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import LoginPage from "@/pages/auth/LoginPage";
import InstancesPage from "@/pages/plants/InstancesPage";
import SpeciesPage from "@/pages/plants/SpeciesPage";
import TasksPage from "@/pages/tasks/TasksPage";
import PlaceholderPage from "@/pages/placeholder/PlaceholderPage";

const moduleRoutes: RouteObject[] = [
  { path: "adoptions", element: <AdoptionsPage /> },
  { path: "care-reviews", element: <CareReviewsPage /> },
  { path: "tasks", element: <TasksPage /> },
  { path: "feedback", element: <PlaceholderPage /> },
  { path: "plants/species", element: <SpeciesPage /> },
  { path: "plants/instances", element: <InstancesPage /> },
  { path: "points/rules", element: <PlaceholderPage /> },
  { path: "points/rewards", element: <PlaceholderPage /> },
  { path: "points/orders", element: <PlaceholderPage /> },
  { path: "students", element: <PlaceholderPage /> },
  { path: "articles", element: <PlaceholderPage /> },
  { path: "statistics", element: <PlaceholderPage /> },
];

export const routes: RouteObject[] = [
  { path: "/", element: <Navigate replace to="/login" /> },
  {
    path: "/login",
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    element: (
      <RequireAdmin>
        <AdminShell />
      </RequireAdmin>
    ),
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      ...moduleRoutes,
    ],
  },
  { path: "*", element: <Navigate replace to="/login" /> },
];

export const router = createBrowserRouter(routes);
