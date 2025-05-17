import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Logs from "@/pages/logs";
import BypassRules from "@/pages/bypass-rules";
import Websites from "@/pages/websites";
import Games from "@/pages/games";
import IpAddresses from "@/pages/ip-addresses";
import DnsSettings from "@/pages/dns-settings";
import Security from "@/pages/security";
import Backup from "@/pages/backup";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/logs" component={Logs} />
      <ProtectedRoute path="/bypass-rules" component={BypassRules} />
      <ProtectedRoute path="/websites" component={Websites} />
      <ProtectedRoute path="/games" component={Games} />
      <ProtectedRoute path="/ip-addresses" component={IpAddresses} />
      <ProtectedRoute path="/dns-settings" component={DnsSettings} />
      <ProtectedRoute path="/security" component={Security} />
      <ProtectedRoute path="/backup" component={Backup} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
