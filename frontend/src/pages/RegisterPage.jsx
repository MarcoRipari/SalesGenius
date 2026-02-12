import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { toast } from "sonner";
import { MessageSquare, Moon, Sun, Eye, EyeOff, Check } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error("La password deve essere almeno 6 caratteri");
      return;
    }
    
    setLoading(true);
    
    try {
      await register(email, password, companyName);
      toast.success("Account creato con successo!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    "Chat AI personalizzata per il tuo business",
    "Knowledge base illimitata",
    "Analytics in tempo reale",
    "Lead generation automatica"
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-secondary items-center justify-center p-12">
        <div className="max-w-md text-secondary-foreground">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-8">
            <MessageSquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold font-['Manrope'] mb-4">
            Inizia a vendere di più con l'AI
          </h2>
          <p className="text-secondary-foreground/80 text-lg mb-8">
            Crea il tuo assistente vendite AI in pochi minuti e trasforma il tuo sito in una macchina da conversioni.
          </p>
          <ul className="space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="text-secondary-foreground/90">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-register">
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
          
          <h1 className="text-3xl font-bold font-['Manrope'] mb-2">Crea il tuo account</h1>
          <p className="text-muted-foreground mb-8">
            Inizia gratis, nessuna carta di credito richiesta
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome Azienda</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="La tua azienda"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                data-testid="register-company-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@azienda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="register-email-input"
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
                  minLength={6}
                  data-testid="register-password-input"
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
              <p className="text-xs text-muted-foreground">Minimo 6 caratteri</p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="register-submit-btn"
            >
              {loading ? <span className="spinner mr-2" /> : null}
              Crea Account
            </Button>
          </form>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            Hai già un account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium" data-testid="login-link">
              Accedi
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
