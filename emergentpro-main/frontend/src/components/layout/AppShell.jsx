import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  FolderKanban,
  ListTodo,
  Users,
  IndianRupee,
  AlertTriangle,
  Building2,
  BarChart3,
  Menu,
  X,
  LogOut,
  Shield,
  ChevronRight,
  FileCheck // Import icon for Approvals
} from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../App";

// Added "Approvals" to navigation
const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/programs", label: "Programmes", icon: Boxes },
  { path: "/projects", label: "Projects", icon: FolderKanban },
  { path: "/tasks", label: "Tasks", icon: ListTodo },
  { path: "/resources", label: "Resources", icon: Users },
  { path: "/budget", label: "Budget", icon: IndianRupee },
  { path: "/approvals", label: "Approvals", icon: FileCheck }, // Added Approvals Link
  { path: "/risks", label: "Risks", icon: AlertTriangle },
  { path: "/vendors", label: "Vendors", icon: Building2 },
  { path: "/reports", label: "Reports", icon: BarChart3 },
];

export default function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // FIX 1: Destructure object, not array
  const { user, logout } = useAuth(); 

  const handleLogout = () => {
    logout(); // Use the context logout function
    navigate("/login");
  };

  // Helper to get initials
  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="app-shell">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">
              DPMS
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-40 transition-transform duration-200 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">
              DPMS
            </p>
            <p className="text-[10px] text-slate-500">Command Centre</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors group ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-blue-400" />}
              </Link>
            );
          })}
        </nav>

        {/* FIX 2: Dynamic User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                {getInitials(user?.name)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-700 truncate w-32" title={user?.name}>
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {user?.role || "Guest"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}