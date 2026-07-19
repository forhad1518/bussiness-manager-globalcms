"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";
import FormField from "@/components/ui/FormField";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      if (res.data.success) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
      toast.error("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary to-primary-dark">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Business Manager</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>
        {error && (
          <p className="text-error text-sm mb-4 text-center">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="admin@example.com"
            />
          </FormField>
          <FormField label="Password">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="••••••••"
            />
          </FormField>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-on-primary py-2.5 rounded-lg transition cursor-pointer"
          >
            <LogIn size={18} /> Sign In
          </button>
        </form>
      </motion.div>
    </div>
  );
}
