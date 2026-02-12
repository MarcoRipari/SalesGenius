import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { fetchWithAuth, API_URL, formatDate } from "../lib/utils";
import { toast } from "sonner";
import {
  Globe,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Upload,
  Database as DatabaseIcon
} from "lucide-react";

export default function KnowledgeBase() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const [addPdfOpen, setAddPdfOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [urlName, setUrlName] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/knowledge`);
      if (res.ok) {
        setSources(await res.json());
      }
    } catch (error) {
      toast.error("Errore nel caricamento delle fonti");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUrl = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetchWithAuth(`${API_URL}/knowledge/url`, {
        method: "POST",
        body: JSON.stringify({ type: "url", name: urlName, url: urlValue })
      });
      
      if (res.ok) {
        toast.success("URL aggiunto con successo");
        setAddUrlOpen(false);
        setUrlName("");
        setUrlValue("");
        fetchSources();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Errore nell'aggiunta dell'URL");
      }
    } catch (error) {
      toast.error("Errore nell'aggiunta dell'URL");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPdf = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      toast.error("Seleziona un file PDF");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("name", pdfName);
      
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/knowledge/pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        toast.success("PDF caricato con successo");
        setAddPdfOpen(false);
        setPdfName("");
        setPdfFile(null);
        fetchSources();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Errore nel caricamento del PDF");
      }
    } catch (error) {
      toast.error("Errore nel caricamento del PDF");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sourceId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa fonte?")) return;
    
    try {
      const res = await fetchWithAuth(`${API_URL}/knowledge/${sourceId}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        toast.success("Fonte eliminata");
        fetchSources();
      } else {
        toast.error("Errore nell'eliminazione");
      }
    } catch (error) {
      toast.error("Errore nell'eliminazione");
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
    <div className="space-y-6" data-testid="knowledge-base-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Manrope']">Knowledge Base</h1>
          <p className="text-muted-foreground">Gestisci le fonti di conoscenza per il tuo assistente AI</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addUrlOpen} onOpenChange={setAddUrlOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="add-url-btn">
                <Globe className="w-4 h-4 mr-2" />
                Aggiungi URL
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-['Manrope']">Aggiungi URL</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUrl} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="urlName">Nome</Label>
                  <Input
                    id="urlName"
                    placeholder="es. Homepage"
                    value={urlName}
                    onChange={(e) => setUrlName(e.target.value)}
                    required
                    data-testid="url-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urlValue">URL</Label>
                  <Input
                    id="urlValue"
                    type="url"
                    placeholder="https://esempio.com"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    required
                    data-testid="url-value-input"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting} data-testid="submit-url-btn">
                  {submitting ? <span className="spinner mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Aggiungi
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={addPdfOpen} onOpenChange={setAddPdfOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-pdf-btn">
                <FileText className="w-4 h-4 mr-2" />
                Carica PDF
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-['Manrope']">Carica PDF</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPdf} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pdfName">Nome</Label>
                  <Input
                    id="pdfName"
                    placeholder="es. Catalogo Prodotti"
                    value={pdfName}
                    onChange={(e) => setPdfName(e.target.value)}
                    required
                    data-testid="pdf-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdfFile">File PDF</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      id="pdfFile"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      data-testid="pdf-file-input"
                    />
                    <label htmlFor="pdfFile" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {pdfFile ? pdfFile.name : "Clicca per selezionare un PDF"}
                      </p>
                    </label>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting} data-testid="submit-pdf-btn">
                  {submitting ? <span className="spinner mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Carica
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sources List */}
      {sources.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent className="p-12">
            <div className="empty-state">
              <div className="empty-state-icon">
                <DatabaseIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold font-['Manrope'] mb-2">Nessuna fonte aggiunta</h3>
              <p className="text-muted-foreground mb-4">
                Aggiungi URL o PDF per addestrare il tuo assistente AI
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {sources.map((source, index) => (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="knowledge-card" data-testid={`knowledge-source-${index}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`knowledge-card-icon ${source.type}`}>
                        {source.type === "url" ? (
                          <Globe className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{source.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {source.url || `${source.content_preview?.slice(0, 50)}...`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Aggiunto: {formatDate(source.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={source.status === "active" ? "badge-active" : "badge-error"}>
                        {source.status === "active" ? "Attivo" : "Errore"}
                      </Badge>
                      {source.url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(source.id)}
                        data-testid={`delete-source-${index}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
