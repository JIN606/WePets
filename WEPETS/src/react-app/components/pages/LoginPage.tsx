



import React, { useState } from "react";
import { useAuth } from "@hey-boss/users-service/react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export const LoginPage = () => {
  const { sendOTP, verifyOTP, loginWithPassword } = useAuth();
  const navigate = useNavigate();
  
  // Login mode: 'email' or 'password'
  const [mode, setMode] = useState<"email" | "password">("email");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await sendOTP(email);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the OTP code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyOTP(email, otp);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await loginWithPassword(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Placeholder: navigate to forgot password page or show modal
    alert("Forgot Password functionality coming soon!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center mb-8">
          <img
            src="https://heyboss.heeyo.ai/chat-images/屏幕截图 2025-11-21 163810_J1f0wd6g.png"
            alt="WePets Logo"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-black uppercase tracking-tighter">Welcome Back</h1>
          <p className="text-gray-600 mt-2">
            {step === "input" ? "Sign in to continue your adventure" : "Enter the code sent to your email"}
          </p>
        </div>

        {step === "input" && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("email");
                setError("");
                setPassword("");
              }}
              className={`flex-1 py-3 font-bold uppercase text-sm border-2 border-black transition-colors ${
                mode === "email"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              🔘 Email Code
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError("");
                setOtp("");
              }}
              className={`flex-1 py-3 font-bold uppercase text-sm border-2 border-black transition-colors ${
                mode === "password"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              🔘 Password Login
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-600 text-red-800 font-bold text-sm">
            {error}
          </div>
        )}

        {step === "input" && mode === "email" && (
          <form onSubmit={handleSendOTP}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-bold uppercase mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="you@example.com"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-orange-600 transition-colors flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Code...
                </>
              ) : (
                "Send Login Code"
              )}
            </button>
          </form>
        )}

        {step === "input" && mode === "password" && (
          <form onSubmit={handlePasswordLogin}>
            <div className="mb-4">
              <label htmlFor="email-password" className="block text-sm font-bold uppercase mb-2">
                Email Address
              </label>
              <input
                id="email-password"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="you@example.com"
                disabled={loading}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-bold uppercase mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="········"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-orange-600 transition-colors flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging In...
                </>
              ) : (
                "Login"
              )}
            </button>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-center text-orange-600 font-bold uppercase text-sm hover:underline"
            >
              Forgot Password?
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP}>
            <div className="mb-6">
              <label htmlFor="otp" className="block text-sm font-bold uppercase mb-2">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500 tracking-widest text-center text-xl"
                placeholder="000000"
                disabled={loading}
                required
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-orange-600 transition-colors flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Sign In"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setOtp("");
                setError("");
              }}
              className="w-full mt-4 py-2 text-gray-600 font-bold uppercase text-sm hover:text-orange-600 transition-colors"
            >
              Use Different Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
  
