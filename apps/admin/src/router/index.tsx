import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import AdminShell from "@/layouts/AdminShell";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import LoginPage from "@/pages/auth/LoginPage";
import PlaceholderPage from "@/pages/placeholder/PlaceholderPage";

const moduleRoutes: RouteObject[] = [
  { path: "adoptions", element: <PlaceholderPage /> },
  { path: "care-reviews", element: <PlaceholderPage /> },
  { path: "tasks", element: <PlaceholderPage /> },
  { path: "feedback", element: <PlaceholderPage /> },
  { path: "plants/species", element: <PlaceholderPage /> },
  { path: "plants/instances", element: <PlaceholderPage /> },
  { path: "points/rules", element: <PlaceholderPage /> },
  { path: "points/rewards", element: <PlaceholderPage /> },
  { path: "points/orders", element: <PlaceholderPage /> },
  { path: "students", element: <PlaceholderPage /> },
  { path: "articles", element: <PlaceholderPage /> },
  { path: "statistics", element: <PlaceholderPage /> },
];

export const routes: RouteObject[] = [
  { path: "/", element: <Navigate replace to="/login" /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: <AdminShell />,
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      ...moduleRoutes,
    ],
  },
  { path: "*", element: <Navigate replace to="/login" /> },
];

export const router = createBrowserRouter(routes);
