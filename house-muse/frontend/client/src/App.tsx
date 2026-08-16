import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SiteNav from "./components/SiteNav";
import SiteFooter from "./components/SiteFooter";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import MoodBoard from "./pages/MoodBoard";
import { useEffect } from "react";
import { useLocation } from "wouter";

function Layout() {
  const [location] = useLocation();
  // scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="flex-1">
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/studio"} component={Studio} />
          <Route path={"/board"} component={MoodBoard} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <SiteFooter />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                fontFamily: "var(--font-sans)",
                background: "var(--card)",
                color: "var(--card-foreground)",
                border: "1px dashed var(--clay)",
                borderRadius: "4px",
                transform: "rotate(-0.5deg)",
              },
            }}
          />
          <Layout />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
