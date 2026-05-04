import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { UserModel } from "@/models/auth-models";
import { loadMeSafe } from "./controllers/UserController";

function isAdmin(user: UserModel) {
  return (user.Role?.toUpperCase() ?? "") === "ADMIN";
}

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: loadMeSafe,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  if (meQuery.isPending) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!meQuery.data?.ok) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin(meQuery.data.user)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}