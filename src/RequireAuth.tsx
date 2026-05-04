import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { loadMeSafe } from "./controllers/UserController";

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function RequireAuth({ children, adminOnly = false }: Props) {
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

  const isAdmin = meQuery.data.user.Role === "ADMIN";

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!adminOnly && isAdmin) {
    return <Navigate to="/adminDrinks" replace />;
  }

  return <>{children}</>;
}