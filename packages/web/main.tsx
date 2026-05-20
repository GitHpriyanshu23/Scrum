import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./src/web/styles.css";
import App from "./src/web/app.tsx";
import { SessionProvider } from "./src/web/components/ProtectedRoute.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      gcTime: 10 * 60 * 1000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <SessionProvider>
          <App />
        </SessionProvider>
      </Router>
    </QueryClientProvider>
  </StrictMode>,
);
