"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmail, resetPassword } from "@/firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmail(formData.email, formData.password);
      router.push("/dashboard"); // Redirect to dashboard after successful login
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred during login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Please enter your email address first");
      return;
    }

    try {
      await resetPassword(formData.email);
      setResetEmailSent(true);
      setError("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Error sending password reset email");
      }
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
        <p className="text-gray-600">Sign in to your StudySprint account</p>
      </div>

      {resetEmailSent && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          Password reset email sent! Check your inbox.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your password"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-md font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-600 hover:text-blue-500 font-semibold"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
