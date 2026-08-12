"use client";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { LabelWithTooltip } from "@/components/ui/label-with-tooltip";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: signUpError } = await signUp.email({
      email,
      password,
      name,
    });
    if (signUpError) {
      setError(signUpError.message || "An error occurred during sign up.");
      setLoading(false);
    } else {
      router.push("/worlds");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center text-gray-900">Create an account</h1>
        <p className="mt-2 text-center text-sm text-gray-600 mb-6">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-black hover:underline transition">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSignUp} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <div>
            <LabelWithTooltip 
              label="Name" 
              tooltip="Your display name. This is how you will appear to others." 
            />
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="block w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-black focus:border-black transition-all"
              required
            />
          </div>

          <div>
            <LabelWithTooltip 
              label="Email" 
              tooltip="A valid email address to verify your account and recover passwords." 
            />
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-black focus:border-black transition-all"
              required
            />
          </div>

          <div>
            <LabelWithTooltip 
              label="Password" 
              tooltip="Make sure it's at least 8 characters long and includes numbers and symbols." 
            />
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-black focus:border-black transition-all"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center bg-black text-white p-3 rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
