import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { fetchWithAuth, API_URL } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Settings,
  Building2,
  Bell,
  Bot,
  Key,
  Save,
  Globe,
  Mail,
  Clock,
  Cpu,
  Info
} from "lucide-react";

export default function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [apiConfig, setApiConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [settingsRes, apiRes] = await Promise.all([
        fetchWithAuth(`${API_URL}/admin/settings`),
        fetchWithAuth(`${API_URL}/admin/api-config`)
      ]);
      
      if (settingsRes.ok) {
        setSettings(await settingsRes.json());
      }
      if (apiRes.ok) {
        setApiConfig(await apiRes.json());
      }
    } catch (error) {
      toast.error("Errore nel caricamento delle impostazioni");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/admin/settings`, {
        method: "PUT",
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        toast.success("Impostazioni salvate");
      } else {
        toast.error("Errore nel salvataggio");
      }
    } catch (error) {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl" data-testid="admin-settings-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Manrope']">Impostazioni Admin</h1>
          <p className="text-muted-foreground">Gestisci le impostazioni avanzate della tua organizzazione</p>
        </div>
        <Button onClick={handleSave} disabled={saving} data-testid="save-admin-settings-btn">
          {saving ? <span className="spinner mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salva Modifiche
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" data-testid="tab-general">
            <Building2 className="w-4 h-4 mr-2" />
            Generale
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifiche
          </TabsTrigger>
          <TabsTrigger value="ai" data-testid="tab-ai">
            <Bot className="w-4 h-4 mr-2" />
            AI & API
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-['Manrope']">
                <Building2 className="w-5 h-5 text-primary" />
                Informazioni Organizzazione
              </CardTitle>
              <CardDescription>
                Configura le informazioni base della tua azienda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome Azienda</Label>
                  <Input
                    id="companyName"
                    value={settings?.company_name || ""}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    placeholder="La tua azienda"
                    data-testid="company-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Email Supporto</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="supportEmail"
                      type="email"
                      className="pl-10"
                      value={settings?.support_email || ""}
                      onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                      placeholder="supporto@azienda.com"
                      data-testid="support-email-input"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Orario</Label>
                  <Select
                    value={settings?.timezone || "Europe/Rome"}
                    onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                  >
                    <SelectTrigger data-testid="timezone-select">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Rome">Europa/Roma (CET)</SelectItem>
                      <SelectItem value="Europe/London">Europa/Londra (GMT)</SelectItem>
                      <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los Angeles (PST)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Lingua</Label>
                  <Select
                    value={settings?.language || "it"}
                    onValueChange={(value) => setSettings({ ...settings, language: value })}
                  >
                    <SelectTrigger data-testid="language-select">
                      <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyLogo">URL Logo Azienda</Label>
                <Input
                  id="companyLogo"
                  type="url"
                  value={settings?.company_logo || ""}
                  onChange={(e) => setSettings({ ...settings, company_logo: e.target.value })}
                  placeholder="https://esempio.com/logo.png"
                  data-testid="company-logo-input"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-['Manrope']">
                <Bell className="w-5 h-5 text-primary" />
                Preferenze Notifiche
              </CardTitle>
              <CardDescription>
                Configura quando ricevere notifiche via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nuovo Lead</Label>
                  <p className="text-sm text-muted-foreground">
                    Ricevi una notifica quando un visitatore lascia i suoi contatti
                  </p>
                </div>
                <Switch
                  checked={settings?.notification_new_lead ?? true}
                  onCheckedChange={(checked) => setSettings({ ...settings, notification_new_lead: checked })}
                  data-testid="notification-lead-switch"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nuova Conversazione</Label>
                  <p className="text-sm text-muted-foreground">
                    Ricevi una notifica all'inizio di ogni nuova chat
                  </p>
                </div>
                <Switch
                  checked={settings?.notification_new_conversation ?? false}
                  onCheckedChange={(checked) => setSettings({ ...settings, notification_new_conversation: checked })}
                  data-testid="notification-conversation-switch"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI & API Settings */}
        <TabsContent value="ai">
          <div className="space-y-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-['Manrope']">
                  <Bot className="w-5 h-5 text-primary" />
                  Configurazione AI
                </CardTitle>
                <CardDescription>
                  Personalizza il comportamento del modello AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Modello AI</Label>
                    <Select
                      value={settings?.ai_model || "gemini-3-flash-preview"}
                      onValueChange={(value) => setSettings({ ...settings, ai_model: value })}
                    >
                      <SelectTrigger data-testid="ai-model-select">
                        <Cpu className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {apiConfig?.available_models?.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{model.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                €{model.cost_input}/1M in
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Token per Risposta</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      min={100}
                      max={2000}
                      value={settings?.max_tokens_per_response || 500}
                      onChange={(e) => setSettings({ ...settings, max_tokens_per_response: parseInt(e.target.value) })}
                      data-testid="max-tokens-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Controlla la lunghezza massima delle risposte (100-2000)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-['Manrope']">
                  <Key className="w-5 h-5 text-primary" />
                  API Key
                </CardTitle>
                <CardDescription>
                  Informazioni sulla configurazione API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${apiConfig?.using_emergent_key ? "bg-green-500" : "bg-blue-500"}`} />
                    <span className="font-medium">
                      {apiConfig?.using_emergent_key ? "Emergent LLM Key (Universale)" : "API Key Personalizzata"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {apiConfig?.using_emergent_key 
                      ? apiConfig?.instructions?.emergent_key 
                      : apiConfig?.instructions?.custom_key}
                  </p>
                  <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-primary">Come funziona?</p>
                      <p className="text-muted-foreground mt-1">
                        La <strong>Emergent LLM Key</strong> è una chiave universale che permette di utilizzare 
                        modelli AI di diversi provider (Google, OpenAI, Anthropic) con un unico credito.
                        I costi vengono addebitati in base all'utilizzo.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Info */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="font-['Manrope']">Costi AI Stimati</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {apiConfig?.available_models?.map((model) => (
                    <div key={model.id} className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="font-medium text-sm">{model.name}</p>
                      <p className="text-2xl font-bold text-primary mt-1">€{model.cost_input}</p>
                      <p className="text-xs text-muted-foreground">/1M token input</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
