import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { loadMe } from "./controllers/UserController";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
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

  return <>{children}</>;
}