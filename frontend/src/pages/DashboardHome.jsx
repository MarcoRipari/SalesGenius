import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { fetchWithAuth, API_URL } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import {
  MessageCircle,
  Users,
  TrendingUp,
  Calendar,
  ArrowRight,
  BarChart3,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function DashboardHome() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, dailyRes] = await Promise.all([
        fetchWithAuth(`${API_URL}/analytics/overview`),
        fetchWithAuth(`${API_URL}/analytics/daily`)
      ]);
      
      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }
      if (dailyRes.ok) {
        setDailyStats(await dailyRes.json());
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyWidgetKey = () => {
    navigator.clipboard.writeText(user?.widget_key || "");
    setCopied(true);
    toast.success("Widget Key copiata!");
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    {
      title: "Conversazioni Totali",
      value: analytics?.total_conversations || 0,
      icon: MessageCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Lead Generati",
      value: analytics?.total_leads || 0,
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Conversazioni Oggi",
      value: analytics?.conversations_today || 0,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Media Messaggi",
      value: analytics?.avg_messages_per_conversation || 0,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-home">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Manrope']">Dashboard</h1>
          <p className="text-muted-foreground">Benvenuto, {user?.company_name}</p>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <span className="text-sm text-muted-foreground">Widget Key:</span>
          <code className="text-sm font-mono bg-background px-2 py-1 rounded">{user?.widget_key}</code>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={copyWidgetKey}
            data-testid="copy-widget-key-btn"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="dashboard-card" data-testid={`stat-card-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Manrope']">
            <BarChart3 className="w-5 h-5 text-primary" />
            Conversazioni Ultimi 7 Giorni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="conversations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <h3 className="font-bold font-['Manrope'] mb-2">Configura la Knowledge Base</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Aggiungi URL e PDF per addestrare il tuo assistente AI con le informazioni del tuo business.
            </p>
            <Link to="/dashboard/knowledge">
              <Button variant="outline" data-testid="go-to-knowledge-btn">
                Vai alla Knowledge Base
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <h3 className="font-bold font-['Manrope'] mb-2">Personalizza il Widget</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Personalizza l'aspetto del chat widget per adattarlo al tuo brand.
            </p>
            <Link to="/dashboard/widget">
              <Button variant="outline" data-testid="go-to-widget-btn">
                Configura Widget
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
