import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import {
  IndianRupee, Plus, Search, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Download, Lock, RefreshCw,
  Landmark, ArrowRight
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

export default function Budget() {
  const { user } = useAuth();
  const [budgetEntries, setBudgetEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReleaseOpen, setIsReleaseOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  // Simulation State for ERP Sync
  const [isSyncing, setIsSyncing] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    project_id: "", category: "CAPEX", sub_category: "", description: "",
    amount_planned: 0, fiscal_year: "2024", quarter: "Q1", release_stage: "initial"
  });
  
  const [releaseForm, setReleaseForm] = useState({ amount: 0, stage: "phase_1" });
  const [updateForm, setUpdateForm] = useState({ amount_actual: 0, amount_forecast: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [budgetRes, projectsRes] = await Promise.all([
        axios.get(`${API}/budget`),
        axios.get(`${API}/projects`)
      ]);
      setBudgetEntries(budgetRes.data);
      setProjects(projectsRes.data);
    } catch (error) { toast.error("Failed to load financial data"); } 
    finally { setLoading(false); }
  };

  // --- ACTIONS ---

  const handleSyncERP = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("Synced with Central Treasury (SAP ERP)", {
        description: "Financials updated with latest actuals."
      });
    }, 2000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/budget`, formData);
      toast.success("Budget allocated successfully");
      setIsDialogOpen(false);
      fetchData();
    } catch (error) { toast.error("Allocation failed"); }
  };

  const openReleaseDialog = (entry) => {
    setSelectedEntry(entry);
    setReleaseForm({ amount: entry.amount_planned - entry.amount_released, stage: "phase_1" });
    setIsReleaseOpen(true);
  };

  const handleRelease = async () => {
    try {
      await axios.post(`${API}/budget/${selectedEntry.id}/release`, releaseForm);
      toast.success(`Funds released for ${releaseForm.stage.replace('_', ' ').toUpperCase()}`);
      setIsReleaseOpen(false);
      fetchData();
    } catch (error) { toast.error("Release failed"); }
  };

  const openUpdateDialog = (entry) => {
    setSelectedEntry(entry);
    setUpdateForm({ amount_actual: entry.amount_actual, amount_forecast: entry.amount_forecast });
    setIsUpdateOpen(true);
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API}/budget/${selectedEntry.id}`, updateForm);
      toast.success("Financials updated");
      setIsUpdateOpen(false);
      fetchData();
    } catch (error) { toast.error("Update failed"); }
  };

  // --- HELPERS ---
  
  const getProjectName = (id) => projects.find(p => p.id === id)?.name || "Unknown";
  
  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString()}`;
  };

  // KPIs
  const totalPlanned = budgetEntries.reduce((sum, e) => sum + (e.amount_planned || 0), 0);
  const totalActual = budgetEntries.reduce((sum, e) => sum + (e.amount_actual || 0), 0);
  const totalReleased = budgetEntries.reduce((sum, e) => sum + (e.amount_released || 0), 0);
  const overruns = budgetEntries.filter(e => e.amount_actual > e.amount_planned);

  // Charts
  const categoryData = [
    { name: 'CAPEX', value: budgetEntries.filter(e => e.category === 'CAPEX').reduce((sum, e) => sum + e.amount_planned, 0), color: '#3b82f6' },
    { name: 'OPEX', value: budgetEntries.filter(e => e.category === 'OPEX').reduce((sum, e) => sum + e.amount_planned, 0), color: '#f59e0b' }
  ];

  if (loading) return <div className="flex justify-center h-96 items-center text-blue-600 animate-pulse">Loading Financials...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase">Financial Governance</h1>
          <p className="text-slate-500 text-sm mt-1">FY2024-25 • Integrated Treasury View</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncERP} disabled={isSyncing} className="border-slate-300">
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? "Syncing..." : "Sync ERP"}
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase">
                <Plus className="w-4 h-4 mr-2" /> Allocate Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white max-w-lg">
              <DialogHeader><DialogTitle>New Budget Allocation</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <Select onValueChange={(v) => setFormData({ ...formData, project_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Project" /></SelectTrigger>
                  <SelectContent className="bg-white">{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <Select onValueChange={(v) => setFormData({ ...formData, category: v })} defaultValue="CAPEX">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white"><SelectItem value="CAPEX">CAPEX</SelectItem><SelectItem value="OPEX">OPEX</SelectItem></SelectContent>
                  </Select>
                  <Input placeholder="Amount (₹)" type="number" onChange={e => setFormData({...formData, amount_planned: parseFloat(e.target.value)})} required />
                </div>
                <Input placeholder="Line Item Description" onChange={e => setFormData({...formData, description: e.target.value})} required />
                <Button type="submit" className="w-full bg-blue-600 text-white">Allocate Funds</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cost Overrun Alert */}
      {overruns.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 font-bold uppercase text-xs tracking-wider">Cost Overrun Alert</AlertTitle>
          <AlertDescription className="text-red-700 text-sm">
            Warning: {overruns.length} line items have exceeded allocated budget. Immediate review required.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Total Allocated</span>
            <Landmark className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-slate-800">{formatCurrency(totalPlanned)}</p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Funds Released</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-green-600">{formatCurrency(totalReleased)}</p>
          <p className="text-xs text-slate-400 mt-1">{((totalReleased/totalPlanned)*100).toFixed(1)}% of planned</p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Actual Spend</span>
            <TrendingDown className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-slate-700">{formatCurrency(totalActual)}</p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Burn Rate</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-amber-600">{((totalActual/totalReleased)*100).toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">of released funds</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Budget Table */}
        <div className="lg:col-span-2 bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
            <h3 className="font-heading text-sm font-bold uppercase">Budget Line Items</h3>
            <div className="flex gap-2">
              <Input placeholder="Search..." className="h-8 w-48 bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <table className="tactical-table">
            <thead>
              <tr>
                <th>Project / Item</th>
                <th>Category</th>
                <th>Planned</th>
                <th>Actual</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {budgetEntries.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase())).map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50 group">
                  <td>
                    <div className="font-medium text-slate-800">{entry.description}</div>
                    <div className="text-xs text-slate-500">{getProjectName(entry.project_id)}</div>
                  </td>
                  <td><span className={`text-[10px] px-2 py-1 rounded border uppercase ${entry.category === 'CAPEX' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{entry.category}</span></td>
                  <td className="font-mono text-sm">{formatCurrency(entry.amount_planned)}</td>
                  <td className="font-mono text-sm">
                    <span className={entry.amount_actual > entry.amount_planned ? "text-red-600 font-bold" : "text-slate-600"}>
                      {formatCurrency(entry.amount_actual)}
                    </span>
                  </td>
                  <td>
                    <span className={`text-[10px] uppercase font-bold ${entry.status === 'released' ? 'text-green-600' : 'text-amber-600'}`}>
                      {entry.status}
                    </span>
                    {entry.status === 'released' && <div className="text-[10px] text-slate-400">{entry.release_stage?.replace('_', ' ')}</div>}
                  </td>
                  <td>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openUpdateDialog(entry)}>Update</Button>
                      {user?.role === 'admin' && entry.status !== 'released' && (
                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => openReleaseDialog(entry)}>Release</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Charts & Breakdown */}
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <h3 className="font-heading text-sm font-bold uppercase mb-4">Allocation Mix</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> CAPEX</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded-sm"></div> OPEX</div>
            </div>
          </div>
        </div>
      </div>

      {/* RELEASE DIALOG (Stage-Gate) */}
      <Dialog open={isReleaseOpen} onOpenChange={setIsReleaseOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Stage-Gate Fund Release</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
              Releasing funds for: <strong>{selectedEntry?.description}</strong>
              <br/>
              Remaining: {formatCurrency((selectedEntry?.amount_planned || 0) - (selectedEntry?.amount_released || 0))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase text-slate-500 font-bold">Release Stage</label>
                <Select onValueChange={(v) => setReleaseForm({ ...releaseForm, stage: v })} defaultValue="phase_1">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="initial">Initial Mobilization</SelectItem>
                    <SelectItem value="phase_1">Phase 1 Execution</SelectItem>
                    <SelectItem value="phase_2">Phase 2 Execution</SelectItem>
                    <SelectItem value="final">Final Settlement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 font-bold">Amount to Release</label>
                <Input type="number" value={releaseForm.amount} onChange={(e) => setReleaseForm({ ...releaseForm, amount: parseFloat(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleRelease} className="bg-green-600 hover:bg-green-700 text-white w-full">
              <Lock className="w-4 h-4 mr-2" /> Authorize Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPDATE DIALOG (Actuals & Forecast) */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>Update Financials</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase text-slate-500 font-bold">Actual Spend to Date</label>
                <Input type="number" value={updateForm.amount_actual} onChange={(e) => setUpdateForm({ ...updateForm, amount_actual: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs uppercase text-slate-500 font-bold">Forecast at Completion</label>
                <Input type="number" value={updateForm.amount_forecast} onChange={(e) => setUpdateForm({ ...updateForm, amount_forecast: parseFloat(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} className="bg-blue-600 text-white w-full">Update Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}