import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { fetchWithAuth, API_URL, formatDate } from "../lib/utils";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Search,
  Trash2,
  Edit,
  ExternalLink,
  ImageIcon,
  RefreshCw,
  Filter
} from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    price_value: "",
    image_url: "",
    product_url: "",
    category: "",
    in_stock: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, sourcesRes] = await Promise.all([
        fetchWithAuth(`${API_URL}/products?limit=200`),
        fetchWithAuth(`${API_URL}/knowledge`)
      ]);
      
      if (productsRes.ok) setProducts(await productsRes.json());
      if (sourcesRes.ok) setSources(await sourcesRes.json());
    } catch (error) {
      toast.error("Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      price_value: "",
      image_url: "",
      product_url: "",
      category: "",
      in_stock: true
    });
    setEditProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const data = {
      ...form,
      price_value: form.price_value ? parseFloat(form.price_value) : null
    };
    
    try {
      const url = editProduct 
        ? `${API_URL}/products/${editProduct.id}`
        : `${API_URL}/products`;
      
      const res = await fetchWithAuth(url, {
        method: editProduct ? "PUT" : "POST",
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        toast.success(editProduct ? "Prodotto aggiornato" : "Prodotto aggiunto");
        setAddDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Errore");
      }
    } catch (error) {
      toast.error("Errore nel salvataggio");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      price_value: product.price_value?.toString() || "",
      image_url: product.image_url || "",
      product_url: product.product_url || "",
      category: product.category || "",
      in_stock: product.in_stock !== false
    });
    setEditProduct(product);
    setAddDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Eliminare questo prodotto?")) return;
    
    try {
      const res = await fetchWithAuth(`${API_URL}/products/${productId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Prodotto eliminato");
        fetchData();
      }
    } catch (error) {
      toast.error("Errore nell'eliminazione");
    }
  };

  const handleRescan = async (sourceId) => {
    toast.info("Scansione in corso...");
    try {
      const res = await fetchWithAuth(`${API_URL}/products/rescan/${sourceId}`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        fetchData();
      }
    } catch (error) {
      toast.error("Errore nella scansione");
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = filterSource === "all" || p.source_id === filterSource;
    
    return matchesSearch && matchesSource;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="products-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Manrope']">Catalogo Prodotti</h1>
          <p className="text-muted-foreground">
            {products.length} prodotti nel catalogo
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-product-btn">
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Prodotto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-['Manrope']">
                {editProduct ? "Modifica Prodotto" : "Nuovo Prodotto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nome Prodotto *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Es. Scarpa da bambina rosa"
                    required
                    data-testid="product-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prezzo (testo)</Label>
                  <Input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="Es. € 49,90"
                    data-testid="product-price-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prezzo (valore)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.price_value}
                    onChange={(e) => setForm({ ...form, price_value: e.target.value })}
                    placeholder="49.90"
                    data-testid="product-price-value-input"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>URL Immagine</Label>
                  <Input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                    data-testid="product-image-input"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>URL Pagina Prodotto *</Label>
                  <Input
                    type="url"
                    value={form.product_url}
                    onChange={(e) => setForm({ ...form, product_url: e.target.value })}
                    placeholder="https://tuosito.com/prodotto"
                    required
                    data-testid="product-url-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Es. Scarpe Bambina"
                    data-testid="product-category-input"
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.in_stock}
                      onChange={(e) => setForm({ ...form, in_stock: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Disponibile</span>
                  </label>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Descrizione</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descrizione del prodotto..."
                    rows={3}
                    data-testid="product-description-input"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting} data-testid="save-product-btn">
                {submitting && <span className="spinner mr-2" />}
                {editProduct ? "Salva Modifiche" : "Aggiungi Prodotto"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="dashboard-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca prodotti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-products-input"
              />
            </div>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[200px]" data-testid="filter-source-select">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtra per fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le fonti</SelectItem>
                <SelectItem value="manual">Aggiunti manualmente</SelectItem>
                {sources.filter(s => s.type === "url").map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* URL Sources with Rescan */}
      {sources.filter(s => s.type === "url").length > 0 && (
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fonti URL con estrazione prodotti
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-2">
              {sources.filter(s => s.type === "url").map(source => (
                <div 
                  key={source.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50"
                >
                  <span className="text-sm font-medium">{source.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {source.products_count || 0} prodotti
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => handleRescan(source.id)}
                    data-testid={`rescan-${source.id}`}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent className="p-12">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold font-['Manrope'] mb-2">
                {searchQuery ? "Nessun prodotto trovato" : "Nessun prodotto"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Prova con altri termini di ricerca" 
                  : "Aggiungi prodotti manualmente o carica URL di pagine prodotto"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="dashboard-card h-full flex flex-col" data-testid={`product-card-${index}`}>
                  {/* Image */}
                  <div className="relative aspect-square bg-muted rounded-t-xl overflow-hidden">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`absolute inset-0 bg-muted flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}
                    >
                      <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                    {!product.in_stock && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="destructive">Esaurito</Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <CardContent className="flex-1 p-4 flex flex-col">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
                    {product.category && (
                      <p className="text-xs text-muted-foreground mb-2">{product.category}</p>
                    )}
                    <p className="text-lg font-bold text-primary mt-auto">
                      {product.price || "Prezzo su richiesta"}
                    </p>
                    
                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {product.product_url && (
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <a href={product.product_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Vedi
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(product)}
                        data-testid={`edit-product-${index}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        data-testid={`delete-product-${index}`}
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
