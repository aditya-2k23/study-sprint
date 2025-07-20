"use client";

import Link from "next/link";
import { useState } from "react";
import ThemeSwitcher from "./ThemeSwitcher";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, loading } = useAuth();

  return (
    <nav className="backdrop-blur-xl shadow-sm dark:shadow-2xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              StudySprint
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {/* <ThemeSwitcher /> */}
            {!loading && currentUser ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md font-bold"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-semibold hover:shadow-lg transition-shadow"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md font-bold"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-semibold hover:shadow-lg transition-shadow"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeSwitcher />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-fg hover:text-primary p-2 rounded-md transition-colors dark:text-fg-dark dark:hover:text-primary"
              aria-label="Toggle menu"
            >
              <svg
                className={`w-6 h-6 transition-transform ${
                  isMenuOpen ? "rotate-90" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-primary/20 dark:border-gray-600">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {!loading && currentUser ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block text-fg hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-md font-semibold transition-colors dark:text-fg-dark dark:hover:text-primary dark:hover:bg-primary/20"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="block text-center bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-shadow mx-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-fg hover:text-primary hover:bg-primary/10 px-3 py-2 rounded-md font-semibold transition-colors dark:text-fg-dark dark:hover:text-primary dark:hover:bg-primary/20"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="block text-center bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-shadow mx-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
