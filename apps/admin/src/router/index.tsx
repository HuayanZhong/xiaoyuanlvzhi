import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import LoginPage from "@/pages/auth/LoginPage";

export const routes: RouteObject[] = [
  { path: "/", element: <Navigate replace to="/login" /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "*", element: <Navigate replace to="/login" /> },
];

export const router = createBrowserRouter(routes);
