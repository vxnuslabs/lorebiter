"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { LabelWithTooltip } from "@/components/ui/label-with-tooltip";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const { error: resetError } = await authClient.forgetPassword.emailOtp({
      email,
      redirectTo: "/reset-password",
    } as any); // using any to bypass strict type checking if redirectTo is not accepted
    
    if (resetError) {
      setError(resetError.message || "An error occurred.");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center text-gray-900">Reset Password</h1>
        <p className="mt-2 text-center text-sm text-gray-600 mb-6">
          Enter your email to receive a password reset link.
        </p>

        {success ? (
          <div className="text-center">
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100 mb-6">
              A password reset link has been sent to your email address if it exists in our system.
            </div>
            <Link href="/login" className="font-medium text-black hover:underline transition">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <LabelWithTooltip 
                label="Email" 
                tooltip="The email address you used to register. We'll send a password reset link to it." 
              />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-black focus:border-black transition-all"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center bg-black text-white p-3 rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Send Reset Link"}
            </button>
            
            <div className="text-center mt-4">
              <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-black transition">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
