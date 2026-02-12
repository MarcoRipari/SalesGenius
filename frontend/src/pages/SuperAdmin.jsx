import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { fetchWithAuth, API_URL, formatDate } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Shield,
  Users,
  MessageCircle,
  Package,
  Database,
  Trash2,
  RefreshCw,
  Crown,
  UserX
} from "lucide-react";

export default function SuperAdmin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [collections, setCollections] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/superadmin/stats`);
      if (res.ok) {
        setIsAuthorized(true);
        fetchData();
      } else {
        setIsAuthorized(false);
        setLoading(false);
      }
    } catch (error) {
      setIsAuthorized(false);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [usersRes, statsRes, collectionsRes] = await Promise.all([
        fetchWithAuth(`${API_URL}/superadmin/users`),
        fetchWithAuth(`${API_URL}/superadmin/stats`),
        fetchWithAuth(`${API_URL}/superadmin/collections`)
      ]);
      
      if (usersRes.ok) setUsers(await usersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (collectionsRes.ok) setCollections(await collectionsRes.json());
    } catch (error) {
      toast.error("Errore nel caricamento dati");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/superadmin/users/${userId}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        toast.success(`Utente ${email} eliminato`);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Errore nell'eliminazione");
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

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Shield className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold font-['Manrope'] mb-2">Accesso Negato</h2>
        <p className="text-muted-foreground">
          Questa sezione è riservata al Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="superadmin-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <Crown className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-['Manrope']">Super Admin Panel</h1>
          <p className="text-muted-foreground">Gestione completa del sistema</p>
        </div>
        <Button variant="outline" className="ml-auto" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      {/* System Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="dashboard-card">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{stats.total_users}</p>
              <p className="text-xs text-muted-foreground">Utenti</p>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">{stats.total_conversations}</p>
              <p className="text-xs text-muted-foreground">Conversazioni</p>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 mx-auto text-orange-500 mb-2" />
              <p className="text-2xl font-bold">{stats.total_products}</p>
              <p className="text-xs text-muted-foreground">Prodotti</p>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{stats.total_leads}</p>
              <p className="text-xs text-muted-foreground">Lead</p>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-4 text-center">
              <Database className="w-8 h-8 mx-auto text-cyan-500 mb-2" />
              <p className="text-2xl font-bold">{stats.total_knowledge_sources}</p>
              <p className="text-xs text-muted-foreground">Knowledge</p>
            </CardContent>
          </Card>
          <Card className="dashboard-card">
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-8 h-8 mx-auto text-pink-500 mb-2" />
              <p className="text-2xl font-bold">{stats.total_messages}</p>
              <p className="text-xs text-muted-foreground">Messaggi</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Database Collections */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Manrope']">
            <Database className="w-5 h-5 text-primary" />
            Collezioni MongoDB
          </CardTitle>
          <CardDescription>
            Tutte le tabelle nel database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(collections).map(([name, count]) => (
              <div 
                key={name}
                className="px-3 py-2 rounded-lg bg-muted/50 flex items-center gap-2"
              >
                <span className="font-mono text-sm">{name}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Manrope']">
            <Users className="w-5 h-5 text-primary" />
            Tutti gli Utenti ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Azienda</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Widget Key</TableHead>
                <TableHead>Data Creazione</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u, index) => (
                <TableRow key={u.id} data-testid={`user-row-${index}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {u.is_super_admin && <Crown className="w-4 h-4 text-yellow-500" />}
                      {u.email}
                    </div>
                  </TableCell>
                  <TableCell>{u.company_name}</TableCell>
                  <TableCell>
                    <Badge className={
                      u.is_super_admin 
                        ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                        : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    }>
                      {u.is_super_admin ? "Super Admin" : u.role || "owner"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{u.widget_key}</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {u.created_at ? formatDate(u.created_at) : "-"}
                  </TableCell>
                  <TableCell>
                    {!u.is_super_admin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminare questo utente?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Questa azione eliminerà permanentemente l'utente <strong>{u.email}</strong> e tutti i suoi dati (prodotti, conversazioni, lead, ecc.).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
