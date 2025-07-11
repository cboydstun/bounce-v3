"use client";

import Link from "next/link";
import ConditionalPackageLink from "./ConditionalPackageLink";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  ArrowRight,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text hover:scale-105 transition-transform duration-300 inline-block"
            >
              SATX Bounce
            </Link>
            <p className="text-gray-600 text-lg">
              Making your events memorable with safe and clean bounce house
              rentals in San Antonio.
            </p>
            <Link
              href="/order"
              className="inline-flex items-center gap-2 text-primary-blue hover:text-primary-purple transition-colors duration-300 font-semibold group"
            >
              Book Now
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary-purple">
              Quick Links
            </h2>
            <ul className="space-y-4">
              {[
                { href: "/", label: "Home" },
                { href: "/blogs", label: "Blog" },
                { href: "/products", label: "Products" },
                { href: "/about", label: "About" },
                { href: "/faq", label: "FAQ" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-primary-blue transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <ConditionalPackageLink className="text-gray-600 hover:text-primary-blue transition-colors duration-300 flex items-center gap-2 group">
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                  Package Deals
                </ConditionalPackageLink>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary-purple">Contact</h2>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:(512) 210-0194"
                  className="flex items-center gap-3 text-gray-600 hover:text-primary-blue transition-colors duration-300 group"
                >
                  <div className="p-2 bg-secondary-blue/5 rounded-lg group-hover:bg-secondary-blue/10 transition-colors duration-300">
                    <Phone className="w-5 h-5" />
                  </div>
                  (512) 210-0194
                </a>
              </li>
              <li>
                <a
                  href="mailto:satxbounce@gmail.com"
                  className="flex items-center gap-3 text-gray-600 hover:text-primary-blue transition-colors duration-300 group"
                >
                  <div className="p-2 bg-secondary-blue/5 rounded-lg group-hover:bg-secondary-blue/10 transition-colors duration-300">
                    <Mail className="w-5 h-5" />
                  </div>
                  satxbounce@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-secondary-blue/5 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                San Antonio, TX
              </li>
            </ul>
          </div>

          {/* Featured Products */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary-purple">
              Featured Rentals
            </h2>
            <ul className="space-y-4">
              {[
                {
                  href: "/products/sunburst-tropical-waterslide",
                  label: "Sunburst Waterslide",
                },
                {
                  href: "/products/tropical-waterslide",
                  label: "Tropical Waterslide",
                },
                {
                  href: "/products/blue-double-lane-waterslide",
                  label: "Blue Double Lane Waterslide",
                },
                { href: "/products/popcorn-machine", label: "Popcorn Machine" },
                {
                  href: "/products/cotton-candy-machine",
                  label: "Cotton Candy",
                },
                { href: "/products/tables-chairs", label: "Tables & Chairs" },
              ].map((product) => (
                <li key={product.href}>
                  <Link
                    href={product.href}
                    className="text-gray-600 hover:text-primary-blue transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                    {product.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary-purple">Follow Us</h2>
            <div className="flex gap-4">
              {[
                {
                  icon: Facebook,
                  href: "https://www.facebook.com",
                  label: "Facebook",
                },
                {
                  icon: Instagram,
                  href: "https://www.instagram.com",
                  label: "Instagram",
                },
                {
                  icon: Twitter,
                  href: "https://www.twitter.com",
                  label: "Twitter",
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="p-3 bg-secondary-blue/5 rounded-lg hover:bg-secondary-blue/10 text-primary-blue transition-all duration-300 hover:scale-110"
                >
                  <social.icon className="w-6 h-6" />
                </a>
              ))}
            </div>
            <div className="bg-gradient-to-r from-blue-400 to-purple-600 text-white p-4 rounded-xl">
              <p className="font-semibold">
                <strong>Free</strong> Delivery
              </p>
              <p className="text-sm">Within Loop 1604!</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600">
            <p>
              © {new Date().getFullYear()} SATX Bounce. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy-policy"
                className="hover:text-primary-blue transition-colors duration-300"
              >
                Privacy Policy
              </Link>
              <Link
                href="/tos"
                className="hover:text-primary-blue transition-colors duration-300"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
