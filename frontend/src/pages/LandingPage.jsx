import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { useTheme } from "../context/ThemeContext";
import { 
  MessageSquare, 
  BarChart3, 
  Zap, 
  Users, 
  FileText, 
  Settings,
  Moon,
  Sun,
  ArrowRight,
  Check
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 }
  }
};

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: MessageSquare,
      title: "Chat AI Intelligente",
      description: "Assistente vendite basato su AI che risponde 24/7 alle domande dei tuoi clienti"
    },
    {
      icon: FileText,
      title: "Knowledge Base",
      description: "Carica URL e PDF per addestrare l'AI con le informazioni del tuo business"
    },
    {
      icon: BarChart3,
      title: "Analytics Avanzate",
      description: "Monitora conversazioni, lead e performance in tempo reale"
    },
    {
      icon: Settings,
      title: "Widget Personalizzabile",
      description: "Personalizza colori, messaggi e posizione per adattarsi al tuo brand"
    },
    {
      icon: Users,
      title: "Lead Generation",
      description: "Cattura automaticamente i contatti dei visitatori interessati"
    },
    {
      icon: Zap,
      title: "Risposte Istantanee",
      description: "Powered by Gemini 3 Flash per risposte rapide e accurate"
    }
  ];

  const pricing = [
    { conversations: "100", cost: "€0.02" },
    { conversations: "1,000", cost: "€0.20" },
    { conversations: "10,000", cost: "€2.00" },
    { conversations: "100,000", cost: "€20.00" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-['Manrope']">SalesGenius</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Link to="/login">
              <Button variant="ghost" data-testid="login-nav-btn">Accedi</Button>
            </Link>
            <Link to="/register">
              <Button data-testid="register-nav-btn">Inizia Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute inset-0 gradient-hero" />
        
        <motion.div 
          className="relative max-w-7xl mx-auto text-center"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Powered by Gemini 3 Flash
            </span>
          </motion.div>
          
          <motion.h1 
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 font-['Manrope']"
          >
            Trasforma il tuo sito in un
            <span className="text-gradient block mt-2">Venditore Intelligente</span>
          </motion.h1>
          
          <motion.p 
            variants={fadeUp}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Un assistente AI che risponde alle domande dei tuoi clienti 24/7, 
            genera lead qualificati e aumenta le conversioni.
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="text-base px-8" data-testid="hero-cta-btn">
                Inizia Gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-base px-8" data-testid="demo-btn">
              Vedi Demo
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 font-['Manrope']">
              Tutto ciò che ti serve per vendere di più
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Una suite completa di strumenti per automatizzare e migliorare le tue vendite online
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="feature-icon">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 font-['Manrope']">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 font-['Manrope']">
              Prezzi Trasparenti
            </h2>
            <p className="text-muted-foreground text-lg">
              Paghi solo per quello che usi. Nessun costo nascosto.
            </p>
          </motion.div>
          
          <motion.div 
            className="dashboard-card overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="p-6 bg-primary/5 border-b border-border">
              <h3 className="text-xl font-bold font-['Manrope']">Costo Stimato per Conversazione</h3>
              <p className="text-muted-foreground mt-1">Basato su Gemini 3 Flash (~500 token/conversazione)</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pricing.map((item) => (
                  <div key={item.conversations} className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">{item.cost}</div>
                    <div className="text-sm text-muted-foreground mt-1">{item.conversations} conv.</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">Costo medio per conversazione: ~€0.0002</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Input: €0.10/1M token | Output: €0.40/1M token
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-secondary text-secondary-foreground">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 font-['Manrope']">
            Pronto a trasformare il tuo sito?
          </h2>
          <p className="text-secondary-foreground/80 text-lg mb-8">
            Inizia gratuitamente e scopri come SalesGenius può aumentare le tue vendite.
          </p>
          <Link to="/register">
            <Button size="lg" variant="default" className="text-base px-8 bg-primary hover:bg-primary/90" data-testid="cta-register-btn">
              Crea il tuo Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold font-['Manrope']">SalesGenius</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SalesGenius. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
}
