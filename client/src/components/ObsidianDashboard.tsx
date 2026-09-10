import React, { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  ScanSearch,
  BadgeCheck,
  WalletCards,
  Send,
  LockKeyhole,
  FileSpreadsheet,
  Activity,
  Link2,
  Settings,
  ChevronDown,
  Building2,
  Search,
  Bell,
  LogOut,
  X,
  Menu,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TreasuryAtomLogo } from "./TreasuryAtomLogo";

export type PageName =
  | "Overview"
  | "Cash & liquidity"
  | "Reconciliation"
  | "Approvals"
  | "Collections & settlements"
  | "Outbound payments"
  | "Escrow monitoring"
  | "Reports"
  | "Agent activity"
  | "Connections"
  | "Settings";

export interface NavItemConfig {
  name: PageName;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
}

export interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

export const NAV_GROUPS: NavGroupConfig[] = [
  {
    title: "Workspace",
    items: [
      { name: "Overview", label: "Overview", icon: LayoutDashboard },
      { name: "Cash & liquidity", label: "Cash & liquidity", icon: TrendingUp },
      { name: "Reconciliation", label: "Reconciliation", icon: ScanSearch },
      { name: "Approvals", label: "Approvals", icon: BadgeCheck },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Collections & settlements", label: "Collections & settlements", icon: WalletCards },
      { name: "Outbound payments", label: "Outbound payments", icon: Send },
      { name: "Escrow monitoring", label: "Escrow monitoring", icon: LockKeyhole },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { name: "Reports", label: "Reports", icon: FileSpreadsheet },
      { name: "Agent activity", label: "Agent activity", icon: Activity },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Connections", label: "Connections", icon: Link2 },
      { name: "Settings", label: "Settings", icon: Settings },
    ],
  },
];

interface ObsidianDashboardProps {
  page: PageName;
  onPageChange: (page: PageName) => void;
  connectionStatus: "connecting" | "connected" | "reconnecting" | "offline";
  lastEventAt: string | null;
  pendingApprovalsCount?: number;
  onLogout: () => void;
  onOpenImport?: () => void;
  children: ReactNode;
}

export function ObsidianDashboard({
  page,
  onPageChange,
  connectionStatus,
  lastEventAt,
  pendingApprovalsCount = 0,
  onLogout,
  children,
}: ObsidianDashboardProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const updatedTime = lastEventAt
    ? new Date(lastEventAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Live snapshot";

  return (
    <div className="app-shell">
      {/* Dark Graphite Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-wrapper">
          <TreasuryAtomLogo size={30} showText={true} />
        </div>

        {/* Workspace Selector Dropdown */}
        <button className="workspace-picker" type="button" aria-label="Current workspace">
          <div className="workspace-picker-inner">
            <Building2 size={16} color="#C3A77B" />
            <span>Treasury workspace</span>
          </div>
          <ChevronDown size={14} color="#8E9CA8" />
        </button>

        {/* Grouped Navigation */}
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="nav-group">
              <span className="nav-group-title">{group.title}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = page === item.name;
                const badge =
                  item.name === "Approvals" && pendingApprovalsCount > 0
                    ? pendingApprovalsCount
                    : item.badge;

                return (
                  <button
                    key={item.name}
                    type="button"
                    className={`nav-link-btn ${isActive ? "active" : ""}`}
                    onClick={() => {
                      onPageChange(item.name);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                    {badge !== undefined && <span className="nav-badge">{badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-live-pill">
            <span className={`status-dot ${connectionStatus}`} />
            <span>
              {connectionStatus === "connected"
                ? "Live sync"
                : connectionStatus === "reconnecting"
                ? "Reconnecting"
                : "Standby"}
            </span>
          </div>
          <button
            type="button"
            className="nav-link-btn"
            style={{ color: "#EF7B72" }}
            onClick={onLogout}
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <div className="workspace-main">
        {/* Top Navigation Bar */}
        <header className="topbar">
          <div className="topbar-breadcrumbs">
            <span>Workspace</span>
            <span>/</span>
            <span className="current">{page}</span>
          </div>

          {/* Global Search */}
          <div className="topbar-center-search">
            <div className="search-input-wrapper">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search accounts, transactions, approvals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd>⌘ K</kbd>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-action-btn"
              aria-label="Notifications"
              title="Audit notifications"
            >
              <Bell size={17} />
            </button>

            <div
              className="user-profile-menu"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              tabIndex={0}
              role="button"
            >
              <div className="user-avatar">JD</div>
              <span className="user-name">John Doe</span>
              <ChevronDown size={14} color="#7E8B9B" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}
