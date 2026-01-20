import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Link } from "react-router-dom";
import {
  Boxes, Plus, Search, ChevronRight, Calendar, MoreVertical, Edit, Trash2, Target, FileText
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", code: "", description: "", charter: "", mandate: "",
    start_date: "", end_date: "", budget_total: 0, objectives: [], success_kpis: []
  });
  const [objectiveInput, setObjectiveInput] = useState("");
  const [kpiInput, setKpiInput] = useState({ name: "", target: "", unit: "%" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [programsRes, projectsRes] = await Promise.all([
        axios.get(`${API}/programs`),
        axios.get(`${API}/projects`)
      ]);
      setPrograms(programsRes.data);
      setProjects(projectsRes.data);
    } catch (error) { toast.error("Failed to load programmes"); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/programs`, formData);
      toast.success("Programme created successfully");
      setIsDialogOpen(false);
      fetchData();
      setFormData({ 
        name: "", code: "", description: "", charter: "", mandate: "", 
        start_date: "", end_date: "", budget_total: 0, objectives: [], success_kpis: [] 
      });
    } catch (error) { toast.error("Failed to create programme"); }
  };

  const handleDelete = async (programId) => {
    if (window.confirm("Delete this programme?")) {
      try {
        await axios.delete(`${API}/programs/${programId}`);
        toast.success("Programme deleted");
        fetchData();
      } catch (error) { toast.error("Failed to delete"); }
    }
  };

  // Helper functions for Objectives and KPIs
  const addObjective = () => {
    if (objectiveInput.trim()) {
      setFormData({ ...formData, objectives: [...formData.objectives, objectiveInput.trim()] });
      setObjectiveInput("");
    }
  };
  const addKPI = () => {
    if (kpiInput.name && kpiInput.target) {
      setFormData({ ...formData, success_kpis: [...formData.success_kpis, kpiInput] });
      setKpiInput({ name: "", target: "", unit: "%" });
    }
  };

  const getProjectCount = (programId) => projects.filter(p => p.program_id === programId).length;
  
  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    return `₹${value.toLocaleString()}`;
  };

  const filteredPrograms = programs.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center h-96 items-center text-blue-600 animate-pulse">Loading Programmes...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase">Programmes</h1>
          <p className="text-slate-500 text-sm mt-1">{programs.length} active strategic initiatives</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase">
              <Plus className="w-4 h-4 mr-2" /> New Programme
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Programme</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Programme Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                <Input placeholder="Code (e.g., ADS-2024)" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-heading text-slate-500 uppercase">Strategic Definition</label>
                <Input placeholder="Project Charter / Mission Statement" value={formData.charter} onChange={(e) => setFormData({...formData, charter: e.target.value})} />
                <Input placeholder="Official Mandate (Directive No.)" value={formData.mandate} onChange={(e) => setFormData({...formData, mandate: e.target.value})} />
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm" 
                  placeholder="Detailed Description" 
                  rows={2} 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-heading text-slate-500 uppercase mb-1 block">Mission Objectives</label>
                  <div className="flex gap-2 mb-2">
                    <Input value={objectiveInput} onChange={(e) => setObjectiveInput(e.target.value)} placeholder="Add objective..." />
                    <Button type="button" onClick={addObjective} variant="outline" size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.objectives.map((obj, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{obj}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-heading text-slate-500 uppercase mb-1 block">Success KPIs</label>
                  <div className="flex gap-2 mb-2">
                    <Input placeholder="KPI Name" value={kpiInput.name} onChange={(e) => setKpiInput({...kpiInput, name: e.target.value})} className="w-1/2" />
                    <Input placeholder="Target" value={kpiInput.target} onChange={(e) => setKpiInput({...kpiInput, target: e.target.value})} className="w-1/4" />
                    <Button type="button" onClick={addKPI} variant="outline" size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.success_kpis.map((k, i) => (
                      <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">{k.name}: {k.target}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required />
                <Input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} required />
                <Input type="number" placeholder="Total Budget (₹)" value={formData.budget_total} onChange={(e) => setFormData({...formData, budget_total: parseFloat(e.target.value)})} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 text-white">Create Programme</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search programmes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => (
          <div key={program.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-all group">
            <div className="p-5 border-b border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-heading font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{program.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">{program.code}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleDelete(program.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">{program.description}</p>
              {program.charter && <div className="mt-2 text-xs bg-slate-50 p-2 rounded text-slate-500 italic border border-slate-100"><FileText className="w-3 h-3 inline mr-1"/>{program.charter}</div>}
            </div>
            
            <div className="p-5 bg-slate-50">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 font-heading uppercase">Projects</p>
                  <p className="text-xl font-heading font-bold text-slate-800">{getProjectCount(program.id)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-heading uppercase">Health</p>
                  <p className={`text-xl font-heading font-bold ${(program.health_score || 0) >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{program.health_score || 0}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Budget Utilization</span>
                <span>{formatCurrency(program.budget_allocated || 0)} / {formatCurrency(program.budget_total)}</span>
              </div>
              <Progress value={(program.budget_allocated / program.budget_total) * 100 || 0} className="h-2" />
              
              <div className="mt-4 flex justify-between items-center">
                <div className="flex gap-2 text-xs text-slate-500"><Calendar className="w-3 h-3"/> {program.end_date}</div>
                <Link to={`/projects?program=${program.id}`} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">View Projects <ChevronRight className="w-3 h-3" /></Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}