"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function CTA() {
  const { currentUser, loading } = useAuth();
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-white mb-6">
          Ready to Boost Your Study Game?
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          Join thousands of students already studying smarter, not harder.
        </p>
        {!loading && currentUser ? (
          <Link
            href="/dashboard"
            className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-shadow inline-block"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            href="/signup"
            className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-shadow inline-block"
          >
            Get Started Free
          </Link>
        )}
      </div>
    </section>
  );
}
