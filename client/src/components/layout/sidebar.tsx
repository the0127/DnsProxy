import { Link, useLocation } from "wouter";
import { 
  Gauge, 
  ListTree, 
  Filter, 
  Globe, 
  Gamepad, 
  Network, 
  Cog, 
  Shield, 
  CloudDownload, 
  User as UserIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMobile } from "@/hooks/use-mobile";

type SidebarItemProps = {
  href: string;
  icon: React.ReactNode;
  text: string;
  currentPath: string;
  onClick?: () => void;
};

function SidebarItem({ href, icon, text, currentPath, onClick }: SidebarItemProps) {
  const isActive = currentPath === href;
  
  return (
    <Link href={href}>
      <a 
        className={`flex items-center px-3 py-2 text-neutral-600 rounded-md transition-all hover:bg-neutral-200 mb-1 ${
          isActive ? 'border-l-2 border-primary bg-primary/10' : ''
        }`}
        onClick={onClick}
      >
        <span className={`mr-3 ${isActive ? 'text-primary' : ''}`}>{icon}</span>
        <span>{text}</span>
      </a>
    </Link>
  );
}

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Close sidebar on mobile when item is clicked
  const handleItemClick = () => {
    if (isMobile) {
      onClose();
    }
  };
  
  const sidebarClass = `
    bg-white shadow flex-shrink-0 flex flex-col
    ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out' : 'w-64'} 
    ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
  `;
  
  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      <div className={sidebarClass}>
        <div className="p-4 flex items-center border-b border-neutral-200">
          <div className="w-8 h-8 mr-2 bg-primary rounded-md flex items-center justify-center text-white">
            <Network size={18} />
          </div>
          <h1 className="text-lg font-semibold text-neutral-600">DNS Proxy Manager</h1>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-2">Status</h2>
            <SidebarItem 
              href="/" 
              icon={<Gauge size={18} />} 
              text="Dashboard" 
              currentPath={location}
              onClick={handleItemClick}
            />
            <SidebarItem 
              href="/logs" 
              icon={<ListTree size={18} />} 
              text="Logs" 
              currentPath={location}
              onClick={handleItemClick}
            />
          </div>
          
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-2">Configuration</h2>
            <SidebarItem 
              href="/bypass-rules" 
              icon={<Filter size={18} />} 
              text="Bypass Rules" 
              currentPath={location}
              onClick={handleItemClick}
            />
            <SidebarItem 
              href="/websites" 
              icon={<Globe size={18} />} 
              text="Websites" 
              currentPath={location}
              onClick={handleItemClick}
            />
            <SidebarItem 
              href="/games" 
              icon={<Gamepad size={18} />} 
              text="Games" 
              currentPath={location}
              onClick={handleItemClick}
            />
            <SidebarItem 
              href="/ip-addresses" 
              icon={<Network size={18} />} 
              text="IP Addresses" 
              currentPath={location}
              onClick={handleItemClick}
            />
          </div>
          
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-2">Settings</h2>
            <SidebarItem 
              href="/dns-settings" 
              icon={<Cog size={18} />} 
              text="DNS Settings" 
              currentPath={location}
              onClick={handleItemClick}
            />
            <SidebarItem 
              href="/security" 
              icon={<Shield size={18} />} 
              text="Security" 
              currentPath={location}
              onClick={handleItemClick}
            />
            <SidebarItem 
              href="/backup" 
              icon={<CloudDownload size={18} />} 
              text="Backup & Restore" 
              currentPath={location}
              onClick={handleItemClick}
            />
          </div>
        </nav>
        
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center text-neutral-600 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-2">
              <UserIcon size={16} />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.username || "User"}</p>
              <p className="text-xs text-neutral-500">{user?.email || "No email"}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </>
  );
}
