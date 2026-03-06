import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { UserModel } from "@/models/auth-models";
import { loadMe } from "./controllers/UserController";

function isAdmin(user: UserModel) {
  // dal tuo PHP arriva "Role"
  return (user as any).Role === "ADMIN";
}

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: loadMe,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  if (meQuery.isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (meQuery.isError) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  const user = meQuery.data;
  if (!isAdmin(user)) {
    return <Navigate to="/" replace />;
    // oppure: return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}