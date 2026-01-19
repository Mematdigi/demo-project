import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "../App"; // Import useAuth hook
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import axios from "axios"; // Needed for the seed function
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  // Get the login function from the global Auth Context
  const { login } = useAuth(); 
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use the global login function (updates App state & fixes "token" vs "access_token" issue)
      await login(email, password);
      
      toast.success("Login successful");
      navigate("/");
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.detail || "Invalid credentials";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    try {
      // Ensure we use the same API URL logic as the rest of the app
      await axios.post(`${API}/seed`);
      toast.success("Demo data seeded successfully");
    } catch (error) {
      console.error("Seed error:", error);
      toast.error("Failed to seed data. Check console.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase tracking-wider">
            Defence Project Management
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Integrated Command & Control System
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-8" data-testid="login-form">
          <h2 className="font-heading text-lg font-bold text-slate-800 uppercase tracking-wider mb-6 text-center">
            Secure Access
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                placeholder="user@defence.gov.in"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 pr-10 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase tracking-wider py-3"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center mb-3">Demo Credentials</p>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-sm text-slate-600 font-mono">admin@defense.gov</p>
              <p className="text-sm text-slate-600 font-mono">admin123</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-3 border-slate-300 text-slate-600 hover:bg-slate-50"
              onClick={handleSeedData}
            >
              Seed Demo Data
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p>Ministry of Defence • Government of India</p>
          <p className="mt-1">Classified System • Authorised Personnel Only</p>
        </div>
      </div>
    </div>
  );
}