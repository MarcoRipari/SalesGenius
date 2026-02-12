import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { fetchWithAuth, API_URL, formatDate } from "../lib/utils";
import { toast } from "sonner";
import {
  Users,
  Mail,
  Phone,
  User,
  Calendar
} from "lucide-react";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/leads`);
      if (res.ok) {
        setLeads(await res.json());
      }
    } catch (error) {
      toast.error("Errore nel caricamento dei lead");
    } finally {
      setLoading(false);
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
    <div className="space-y-6" data-testid="leads-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-['Manrope']">Lead</h1>
        <p className="text-muted-foreground">Contatti raccolti dal tuo assistente AI</p>
      </div>

      {leads.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent className="p-12">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold font-['Manrope'] mb-2">Nessun lead</h3>
              <p className="text-muted-foreground">
                I lead raccolti dal tuo assistente appariranno qui
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-['Manrope']">
              <Users className="w-5 h-5 text-primary" />
              {leads.length} Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead, index) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border hover:bg-accent/50"
                    data-testid={`lead-row-${index}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{lead.name || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.email ? (
                        <a 
                          href={`mailto:${lead.email}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Mail className="w-4 h-4" />
                          {lead.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.phone ? (
                        <a 
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Phone className="w-4 h-4" />
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {formatDate(lead.created_at)}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
