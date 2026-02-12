import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
  Palette,
  MessageSquare,
  Save,
  Copy,
  Check,
  Code,
  Send
} from "lucide-react";

export default function WidgetConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState({
    bot_name: "SalesGenius",
    welcome_message: "Ciao! Come posso aiutarti oggi?",
    primary_color: "#F97316",
    position: "bottom-right",
    avatar_url: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewMessage, setPreviewMessage] = useState("");
  const [previewMessages, setPreviewMessages] = useState([]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/widget/config`);
      if (res.ok) {
        const data = await res.json();
        setConfig({
          bot_name: data.bot_name || "SalesGenius",
          welcome_message: data.welcome_message || "Ciao! Come posso aiutarti oggi?",
          primary_color: data.primary_color || "#F97316",
          position: data.position || "bottom-right",
          avatar_url: data.avatar_url || ""
        });
      }
    } catch (error) {
      toast.error("Errore nel caricamento della configurazione");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/widget/config`, {
        method: "PUT",
        body: JSON.stringify(config)
      });
      
      if (res.ok) {
        toast.success("Configurazione salvata");
      } else {
        toast.error("Errore nel salvataggio");
      }
    } catch (error) {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = () => {
    const embedCode = `<!-- SalesGenius Chat Widget -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${window.location.origin}/widget.js';
    s.dataset.widgetKey = '${user?.widget_key}';
    document.body.appendChild(s);
  })();
</script>`;
    
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success("Codice copiato!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreviewSend = () => {
    if (!previewMessage.trim()) return;
    
    setPreviewMessages(prev => [
      ...prev,
      { role: "user", content: previewMessage },
      { role: "assistant", content: "Questa è una risposta di esempio del bot. In produzione, le risposte saranno generate dall'AI basandosi sulla tua knowledge base." }
    ]);
    setPreviewMessage("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="widget-config-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Manrope']">Configurazione Widget</h1>
          <p className="text-muted-foreground">Personalizza l'aspetto del tuo chat widget</p>
        </div>
        <Button onClick={handleSave} disabled={saving} data-testid="save-config-btn">
          {saving ? <span className="spinner mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salva Modifiche
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <div className="space-y-6">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-['Manrope']">
                <Palette className="w-5 h-5 text-primary" />
                Aspetto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botName">Nome Bot</Label>
                <Input
                  id="botName"
                  value={config.bot_name}
                  onChange={(e) => setConfig({ ...config, bot_name: e.target.value })}
                  placeholder="SalesGenius"
                  data-testid="bot-name-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Messaggio di Benvenuto</Label>
                <Textarea
                  id="welcomeMessage"
                  value={config.welcome_message}
                  onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                  placeholder="Ciao! Come posso aiutarti?"
                  rows={3}
                  data-testid="welcome-message-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Colore Primario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                      data-testid="primary-color-input"
                    />
                    <Input
                      value={config.primary_color}
                      onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      placeholder="#F97316"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Posizione</Label>
                  <Select
                    value={config.position}
                    onValueChange={(value) => setConfig({ ...config, position: value })}
                  >
                    <SelectTrigger data-testid="position-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Basso Destra</SelectItem>
                      <SelectItem value="bottom-left">Basso Sinistra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">URL Avatar (opzionale)</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  value={config.avatar_url}
                  onChange={(e) => setConfig({ ...config, avatar_url: e.target.value })}
                  placeholder="https://esempio.com/avatar.jpg"
                  data-testid="avatar-url-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Embed Code */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-['Manrope']">
                <Code className="w-5 h-5 text-primary" />
                Codice di Integrazione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Copia questo codice e incollalo prima del tag &lt;/body&gt; del tuo sito
              </p>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`<!-- SalesGenius Chat Widget -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${window.location.origin}/widget.js';
    s.dataset.widgetKey = '${user?.widget_key}';
    document.body.appendChild(s);
  })();
</script>`}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleCopyCode}
                  data-testid="copy-code-btn"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-6">
          <Card className="dashboard-card h-[600px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-['Manrope']">
                <MessageSquare className="w-5 h-5 text-primary" />
                Anteprima Live
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4">
              <div className="widget-preview-container h-full">
                <motion.div
                  className="widget-preview bg-card border border-border"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ 
                    alignSelf: config.position === "bottom-left" ? "flex-start" : "flex-end"
                  }}
                >
                  {/* Widget Header */}
                  <div 
                    className="widget-header text-white"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                      {config.avatar_url ? (
                        <img src={config.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <MessageSquare className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{config.bot_name}</h4>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full pulse-ring" />
                        <span className="text-xs opacity-80">Online</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Widget Messages */}
                  <div className="widget-messages bg-muted/30">
                    <div className="flex gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white"
                        style={{ backgroundColor: config.primary_color }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="bg-card rounded-lg rounded-tl-none p-3 text-sm shadow-sm max-w-[80%]">
                        {config.welcome_message}
                      </div>
                    </div>
                    
                    {previewMessages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
                      >
                        {msg.role === "assistant" && (
                          <div 
                            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white"
                            style={{ backgroundColor: config.primary_color }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </div>
                        )}
                        <div 
                          className={`rounded-lg p-3 text-sm max-w-[80%] ${
                            msg.role === "user" 
                              ? "text-white rounded-tr-none" 
                              : "bg-card rounded-tl-none shadow-sm"
                          }`}
                          style={msg.role === "user" ? { backgroundColor: config.primary_color } : {}}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Widget Input */}
                  <div className="widget-input bg-card border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Scrivi un messaggio..."
                        value={previewMessage}
                        onChange={(e) => setPreviewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handlePreviewSend()}
                        className="flex-1"
                        data-testid="preview-message-input"
                      />
                      <Button 
                        size="icon"
                        style={{ backgroundColor: config.primary_color }}
                        onClick={handlePreviewSend}
                        data-testid="preview-send-btn"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
