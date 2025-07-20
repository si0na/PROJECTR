import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  FolderOpen,
  LogOut,
  TrendingUp,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAVIGATION_ITEMS = [
  { name: "Dashboard", href: "/", icon: BarChart3, roles: ["project_manager", "delivery_manager", "admin"] },
  { name: "Projects", href: "/projects", icon: FolderOpen, roles: ["project_manager", "delivery_manager", "admin"] },
  { name: "Weekly Reports", href: "/weekly-reports", icon: FileText, roles: ["project_manager", "delivery_manager", "admin"] },
  { name: "Technical Reviews", href: "/technical-reviews", icon: ClipboardCheck, roles: ["project_manager", "delivery_manager", "admin"] },
  { name: "Analytics", href: "/analytics", icon: TrendingUp, roles: ["delivery_manager", "admin"] },
  { name: "LLM Configuration", href: "/llm-config", icon: Bot, roles: ["delivery_manager", "admin"] },
];

const SidebarHeader = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <div className={cn(
    "flex items-center justify-center border-b border-gray-200 transition-all duration-500 ease-in-out",
    isCollapsed ? "h-20 px-2" : "h-[100px] px-4"
  )}>
    <div className={cn(
      "flex flex-col items-center justify-center gap-1 w-full transition-all duration-500 ease-in-out",
      isCollapsed ? "scale-90" : "scale-100"
    )}>
      <BarChart3 className={cn(isCollapsed ? "h-8 w-8" : "h-10 w-10", "text-blue-600 transition-all duration-500 ease-in-out")} />
      {!isCollapsed && (
        <>
          <h1 className="text-lg font-extrabold tracking-tight text-gray-900 transition-all duration-500 ease-in-out">Project Review</h1>
          <p className="text-xs font-medium text-gray-500 transition-all duration-500 ease-in-out">Management Tool</p>
        </>
      )}
    </div>
  </div>
);

const NavLink = ({ item, isCollapsed, location, onClose }: any) => {
  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));

  return (
    <Link href={item.href} onClick={onClose}>
      <div
        className={cn(
          "group flex cursor-pointer items-center gap-3 rounded-xl py-2.5 font-semibold transition-all duration-300 ease-in-out",
          isActive
            ? "bg-blue-100 text-blue-700 shadow-sm"
            : "text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm",
          isCollapsed ? "justify-center px-2" : "px-4"
        )}
        title={isCollapsed ? item.name : undefined}
      >
        <item.icon
          className={cn(
            "h-5 w-5 flex-shrink-0 transition-all duration-300 ease-in-out",
            isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
          )}
        />
        <span className={cn(
          "text-sm font-medium transition-all duration-300 ease-in-out",
          isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
        )}>
          {item.name}
        </span>
      </div>
    </Link>
  );
};

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  toggleCollapse: () => void;
}

export function Sidebar({ isOpen, isCollapsed, onClose, toggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const filteredNavigation = NAVIGATION_ITEMS.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Overlay for mobile view - clicking anywhere outside closes sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-16 left-0 z-40 flex h-[calc(100vh-4rem)] w-64 flex-col bg-gradient-to-b from-blue-50 via-white to-blue-100 shadow-xl transition-transform duration-300 ease-in-out",
          "lg:relative lg:top-0 lg:z-auto lg:h-screen",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <SidebarHeader isCollapsed={isCollapsed} />

        {/* Collapse Button - Only visible on desktop */}
        <div className="absolute top-3 right-[-14px] z-50 hidden lg:block">
          <Button
            variant="ghost"
            size="icon"
            className="flex justify-center items-center bg-white hover:bg-blue-100 rounded-full border border-gray-200 shadow-sm transition-all duration-300 ease-in-out hover:scale-110"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-blue-500" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-blue-500" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-2 py-4 lg:px-3">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              item={item}
              isCollapsed={isCollapsed}
              location={location}
              onClose={onClose}
            />
          ))}
        </nav>

        {/* Footer (Logout) */}
        <div className="border-t border-gray-200 p-2">
          <Link href="/logout">
            <div
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-xl p-2.5 font-semibold text-red-500 hover:bg-red-50 transition-all duration-300 ease-in-out",
                isCollapsed ? "justify-center px-2" : "px-4"
              )}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-5 w-5 transition-all duration-300 ease-in-out" />
              <span className={cn(
                "text-sm font-medium transition-all duration-300 ease-in-out",
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
              )}>
                Sign Out
              </span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}