import React from "react";
import Link from "next/link";
import {
  DocumentTextIcon,
  CubeIcon,
  EnvelopeIcon,
  StarIcon,
  TagIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface EnhancedStatCardProps {
  name: string;
  stat: string;
  href: string;
  change: number;
  changeType: "increase" | "decrease" | "neutral";
  subtitle: string;
  color: "blue" | "green" | "yellow" | "red" | "purple" | "indigo";
  icon: string;
}

const iconMap = {
  document: DocumentTextIcon,
  cube: CubeIcon,
  envelope: EnvelopeIcon,
  star: StarIcon,
  tag: TagIcon,
  "shopping-cart": ShoppingCartIcon,
  "currency-dollar": CurrencyDollarIcon,
  users: UsersIcon,
};

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    border: "border-blue-200",
    trend: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    icon: "text-green-600",
    border: "border-green-200",
    trend: "text-green-600",
  },
  yellow: {
    bg: "bg-yellow-50",
    icon: "text-yellow-600",
    border: "border-yellow-200",
    trend: "text-yellow-600",
  },
  red: {
    bg: "bg-red-50",
    icon: "text-red-600",
    border: "border-red-200",
    trend: "text-red-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    border: "border-purple-200",
    trend: "text-purple-600",
  },
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    border: "border-indigo-200",
    trend: "text-indigo-600",
  },
};

const EnhancedStatCard: React.FC<EnhancedStatCardProps> = ({
  name,
  stat,
  href,
  change,
  changeType,
  subtitle,
  color,
  icon,
}) => {
  const IconComponent =
    iconMap[icon as keyof typeof iconMap] || DocumentTextIcon;
  const colors = colorMap[color];

  const getTrendIcon = () => {
    switch (changeType) {
      case "increase":
        return <ArrowUpIcon className="h-4 w-4" />;
      case "decrease":
        return <ArrowDownIcon className="h-4 w-4" />;
      default:
        return <ArrowRightIcon className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    switch (changeType) {
      case "increase":
        return "text-green-600";
      case "decrease":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Link
      href={href}
      className={`relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow hover:shadow-lg transition-all duration-200 border-l-4 ${colors.border} group`}
    >
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-md p-3 ${colors.bg}`}>
          <IconComponent className={`h-6 w-6 ${colors.icon}`} />
        </div>
        <div className="ml-4 flex-1">
          <dt className="truncate text-sm font-medium text-gray-500 group-hover:text-gray-700">
            {name}
          </dt>
          <dd className="flex items-baseline">
            <div className="text-2xl font-semibold text-gray-900">{stat}</div>
            {change !== 0 && (
              <div
                className={`ml-2 flex items-center text-sm font-medium ${getTrendColor()}`}
              >
                {getTrendIcon()}
                <span className="ml-1">
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              </div>
            )}
          </dd>
          {subtitle && (
            <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
          )}
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </Link>
  );
};

export default EnhancedStatCard;
