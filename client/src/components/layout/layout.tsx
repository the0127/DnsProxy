import { useState, ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { Menu, Network } from "lucide-react";
import { Button } from "@/components/ui/button";

type LayoutProps = {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
};

export function Layout({ children, title, actions }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMobile();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white p-4 shadow flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center">
            <div className="w-8 h-8 mr-2 bg-primary rounded-md flex items-center justify-center text-white">
              <Network size={18} />
            </div>
            <h1 className="text-lg font-semibold text-neutral-600">DNS Proxy</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <Menu />
          </Button>
        </div>
      )}
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-6">
        <div className="py-6 px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-semibold text-neutral-700 mb-4 md:mb-0">{title}</h1>
            {actions && (
              <div className="flex items-center space-x-2 w-full md:w-auto">
                {actions}
              </div>
            )}
          </div>
          
          {children}
        </div>
      </main>
    </div>
  );
}
