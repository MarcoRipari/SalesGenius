import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { fetchWithAuth, API_URL, formatDate } from "../lib/utils";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Mail,
  MoreVertical,
  Shield,
  User,
  Eye,
  Trash2,
  Crown
} from "lucide-react";

const roleLabels = {
  owner: { label: "Proprietario", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  admin: { label: "Admin", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  member: { label: "Membro", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  viewer: { label: "Viewer", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" }
};

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye
};

export default function TeamManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/team/members`);
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch (error) {
      toast.error("Errore nel caricamento del team");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetchWithAuth(`${API_URL}/team/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      
      if (res.ok) {
        toast.success(`Invito inviato a ${inviteEmail}`);
        setInviteOpen(false);
        setInviteEmail("");
        setInviteRole("member");
        fetchMembers();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Errore nell'invio dell'invito");
      }
    } catch (error) {
      toast.error("Errore nell'invio dell'invito");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/team/members/${memberId}`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole })
      });
      
      if (res.ok) {
        toast.success("Ruolo aggiornato");
        fetchMembers();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Errore nell'aggiornamento");
      }
    } catch (error) {
      toast.error("Errore nell'aggiornamento");
    }
  };

  const handleRemove = async (memberId, email) => {
    if (!window.confirm(`Sei sicuro di voler rimuovere ${email} dal team?`)) return;
    
    try {
      const res = await fetchWithAuth(`${API_URL}/team/members/${memberId}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        toast.success("Membro rimosso");
        fetchMembers();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Errore nella rimozione");
      }
    } catch (error) {
      toast.error("Errore nella rimozione");
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
    <div className="space-y-6" data-testid="team-management-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Manrope']">Gestione Team</h1>
          <p className="text-muted-foreground">Gestisci i membri del tuo team e i loro ruoli</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button data-testid="invite-member-btn">
              <UserPlus className="w-4 h-4 mr-2" />
              Invita Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-['Manrope']">Invita un nuovo membro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@esempio.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  data-testid="invite-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Ruolo</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger data-testid="invite-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin - Accesso completo
                      </div>
                    </SelectItem>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Membro - Gestione base
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Viewer - Solo lettura
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={submitting} data-testid="send-invite-btn">
                {submitting ? <span className="spinner mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Invia Invito
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Legend */}
      <Card className="dashboard-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Crown className="w-4 h-4 text-yellow-600" />
              <span><strong>Proprietario:</strong> Accesso completo + gestione billing</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-blue-600" />
              <span><strong>Admin:</strong> Accesso completo</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-green-600" />
              <span><strong>Membro:</strong> Gestione knowledge base e chat</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4 text-gray-600" />
              <span><strong>Viewer:</strong> Solo visualizzazione</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Manrope']">
            <Users className="w-5 h-5 text-primary" />
            Membri del Team ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {members.map((member, index) => {
                const RoleIcon = roleIcons[member.role] || User;
                const roleStyle = roleLabels[member.role] || roleLabels.member;
                
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    data-testid={`team-member-${index}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <RoleIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.email}</span>
                          {member.status === "pending" && (
                            <Badge variant="outline" className="text-xs">In attesa</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.joined_at ? `Iscritto: ${formatDate(member.joined_at)}` : `Invitato: ${formatDate(member.invited_at)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={roleStyle.color}>
                        {roleStyle.label}
                      </Badge>
                      {member.role !== "owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`member-actions-${index}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "admin")}>
                              <Shield className="w-4 h-4 mr-2" />
                              Rendi Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "member")}>
                              <User className="w-4 h-4 mr-2" />
                              Rendi Membro
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "viewer")}>
                              <Eye className="w-4 h-4 mr-2" />
                              Rendi Viewer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleRemove(member.id, member.email)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Rimuovi
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
