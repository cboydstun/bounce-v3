import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  NewspaperIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  CalendarIcon,
  MapIcon,
  StarIcon,
  ChartBarIcon,
  UsersIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  onLogout?: () => void;
  userRole?: string; // New prop for user role
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/admin", icon: HomeIcon },
  { name: "Blogs", href: "/admin/blogs", icon: NewspaperIcon },
  { name: "Products", href: "/admin/products", icon: ShoppingBagIcon },
  { name: "Contacts", href: "/admin/contacts", icon: UserGroupIcon },
  { name: "Contractors", href: "/admin/contractors", icon: UsersIcon },
  {
    name: "Tasks",
    href: "/admin/tasks",
    icon: ShoppingBagIcon, // Assuming this is a placeholder for tasks
  },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCartIcon },
  { name: "Kudos", href: "/admin/kudos", icon: HeartIcon },
  {
    name: "Marketing Emails",
    href: "/admin/marketing-emails",
    icon: NewspaperIcon,
  },
  { name: "Calendar", href: "/admin/calendar", icon: CalendarIcon },
  { name: "Routes", href: "/admin/routes", icon: MapIcon },
  { name: "Reviews", href: "/admin/reviews", icon: StarIcon },
  { name: "Performance", href: "/admin/performance", icon: ChartBarIcon },
  {
    name: "Search Rankings",
    href: "/admin/search-rankings",
    icon: MagnifyingGlassIcon,
  },
  { name: "Competitors", href: "/admin/competitors", icon: UserGroupIcon },
  { name: "Visitors", href: "/admin/visitors", icon: UserGroupIcon },
  { name: "Promo Optins", href: "/admin/promo-optins", icon: TagIcon },
];

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  onLogout,
  userRole,
}) => {
  const pathname = usePathname();

  return (
    <div
      className={`h-[100vh] bg-white shadow-md transition-all duration-300 mt-20 ${
        isCollapsed ? "w-16" : "w-64"
      } fixed left-0 top-0 z-10`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {!isCollapsed && (
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-primary-purple truncate">
              Admin Dashboard
            </h1>
            {userRole && (
              <div className="flex items-center mt-1">
                <span className="text-xs font-medium text-gray-500 mr-1">
                  Role:
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 capitalize">
                  {userRole}
                </span>
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="mt-5 px-2 flex flex-col h-[calc(100vh-4rem)]">
        <ul className="space-y-2 flex-grow">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-primary-purple text-white"
                      : "text-primary-gray hover:bg-gray-100"
                  }`}
                >
                  <item.icon
                    className="h-5 w-5 flex-shrink-0"
                    aria-label={item.name}
                  />
                  <span className={`ml-3 ${isCollapsed ? "hidden" : "block"}`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Logout button at the bottom */}
        {onLogout && (
          <div className="mt-auto mb-6 border-t pt-4">
            <button
              onClick={onLogout}
              className={`w-full flex items-center p-2 rounded-md transition-colors text-primary-gray hover:bg-gray-100`}
              aria-label="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
              <span className={`ml-3 ${isCollapsed ? "hidden" : "block"}`}>
                Logout
              </span>
            </button>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
