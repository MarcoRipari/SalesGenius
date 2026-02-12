import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { useAuth } from "../context/AuthContext";
import { fetchWithAuth, API_URL } from "../lib/utils";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  User,
  Key,
  Copy,
  Check,
  AlertTriangle
} from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyWidgetKey = () => {
    navigator.clipboard.writeText(user?.widget_key || "");
    setCopied(true);
    toast.success("Widget Key copiata!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-['Manrope']">Impostazioni</h1>
        <p className="text-muted-foreground">Gestisci il tuo account e le preferenze</p>
      </div>

      {/* Account Info */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Manrope']">
            <User className="w-5 h-5 text-primary" />
            Informazioni Account
          </CardTitle>
          <CardDescription>
            Dettagli del tuo account SalesGenius
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Azienda</Label>
              <Input value={user?.company_name || ""} disabled data-testid="company-name-display" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled data-testid="email-display" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget Key */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Manrope']">
            <Key className="w-5 h-5 text-primary" />
            Widget Key
          </CardTitle>
          <CardDescription>
            Usa questa chiave per integrare il widget nel tuo sito
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input 
              value={user?.widget_key || ""} 
              readOnly 
              className="font-mono"
              data-testid="widget-key-display"
            />
            <Button variant="outline" onClick={copyWidgetKey} data-testid="copy-widget-key-settings">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Non condividere questa chiave pubblicamente
          </p>
        </CardContent>
      </Card>

      {/* Pricing Info */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Manrope']">
            <SettingsIcon className="w-5 h-5 text-primary" />
            Piano e Costi
          </CardTitle>
          <CardDescription>
            Informazioni sul modello AI e costi stimati
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Modello AI</p>
              <p className="font-semibold mt-1">Gemini 3 Flash</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Costo Input</p>
              <p className="font-semibold mt-1">€0.10/1M token</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Costo Output</p>
              <p className="font-semibold mt-1">€0.40/1M token</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Per Conversazione</p>
              <p className="font-semibold mt-1">~€0.0002</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="dashboard-card border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Manrope'] text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Zona Pericolosa
          </CardTitle>
          <CardDescription>
            Azioni irreversibili per il tuo account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Disconnetti Account</p>
              <p className="text-sm text-muted-foreground">
                Esci dal tuo account su questo dispositivo
              </p>
            </div>
            <Button variant="destructive" onClick={logout} data-testid="logout-settings-btn">
              Disconnetti
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
