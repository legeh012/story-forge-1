import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnimatePresence, motion } from "framer-motion";
import BotpressChat from "@/components/BotpressChat";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Characters from "./pages/Characters";
import Episodes from "./pages/Episodes";
import EpisodesGallery from "./pages/EpisodesGallery";
import EpisodeDetail from "./pages/EpisodeDetail";
import Workflow from "./pages/Workflow";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import CreateProject from "./pages/CreateProject";
import MediaLibrary from "./pages/MediaLibrary";
import Analytics from "./pages/Analytics";
import SystemMonitor from "./pages/SystemMonitor";
import ViralBots from "./pages/ViralBots";
import Install from "./pages/Install";
import VideoGeneration from "./pages/VideoGeneration";
import RemixStudio from "./pages/RemixStudio";
import CloudServices from "./pages/CloudServices";
import DevTools from "./pages/DevTools";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen"
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/install" element={<Install />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/episodes" element={<Episodes />} />
          <Route path="/episodes-gallery" element={<EpisodesGallery />} />
          <Route path="/episodes/:id" element={<EpisodeDetail />} />
          <Route path="/workflow" element={<Workflow />} />
          <Route path="/create" element={<CreateProject />} />
          <Route path="/media" element={<MediaLibrary />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/system-monitor" element={<SystemMonitor />} />
          <Route path="/viral-bots" element={<ViralBots />} />
          <Route path="/video-generation" element={<VideoGeneration />} />
          <Route path="/remix-studio" element={<RemixStudio />} />
          <Route path="/cloud-services" element={<CloudServices />} />
          <Route path="/dev-tools" element={<DevTools />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => {
  const botId = import.meta.env.VITE_BOTPRESS_BOT_ID || '';
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          {botId && <BotpressChat botId={botId} />}
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AnimatedRoutes />
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
