"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActiveLink = (path: string) => {
    return pathname === path;
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/products", label: "Products" },
    { path: "/about", label: "About" },
    { path: "/blogs", label: "Blog" },
    { path: "/faq", label: "FAQ" },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-2xl text-[#663399] font-bold hover:scale-105 transition-transform duration-300 inline-block"
            >
              🎉 SATX Bounce
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isActiveLink(link.path)
                    ? "bg-secondary-blue/10 text-primary-blue"
                    : "text-gray-600 hover:bg-secondary-blue/5 hover:text-primary-blue"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="ml-4 px-6 py-2.5 bg-gradient-to-r from-blue-400 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              Contact Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-secondary-blue/5 hover:text-primary-blue transition-colors duration-300"
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isActiveLink(link.path)
                      ? "bg-secondary-blue/10 text-primary-blue"
                      : "text-gray-600 hover:bg-secondary-blue/5 hover:text-primary-blue"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/contact"
                className="px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-500 hover:to-purple-700 transition-all duration-300 text-center shadow-md hover:shadow-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
