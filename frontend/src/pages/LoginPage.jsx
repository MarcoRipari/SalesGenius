import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { toast } from "sonner";
import { MessageSquare, Moon, Sun, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success("Accesso effettuato con successo!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-login">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full mx-auto"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-['Manrope']">SalesGenius</span>
          </Link>
          
          <h1 className="text-3xl font-bold font-['Manrope'] mb-2">Bentornato</h1>
          <p className="text-muted-foreground mb-8">
            Accedi al tuo account per gestire il tuo assistente AI
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@azienda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="login-password-input"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? <span className="spinner mr-2" /> : null}
              Accedi
            </Button>
          </form>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            Non hai un account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium" data-testid="register-link">
              Registrati
            </Link>
          </p>
        </motion.div>
      </div>
      
      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-secondary items-center justify-center p-12">
        <div className="max-w-md text-secondary-foreground">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-8">
            <MessageSquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold font-['Manrope'] mb-4">
            Il tuo assistente vendite AI sempre attivo
          </h2>
          <p className="text-secondary-foreground/80 text-lg">
            SalesGenius risponde automaticamente alle domande dei tuoi clienti, 
            genera lead qualificati e aumenta le conversioni del tuo sito.
          </p>
        </div>
      </div>
    </div>
  );
}
