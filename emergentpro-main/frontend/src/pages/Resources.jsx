import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import {
  Users, Plus, Search, UserCircle, Cpu, Building, MoreVertical,
  Shield, AlertTriangle, Edit, Trash2, Award, Briefcase, Activity
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "", type: "human", department: "", unit: "",
    skills: [], certifications: [], clearance_level: "public",
    capacity_hours: 160, hourly_rate: 0
  });
  const [skillInput, setSkillInput] = useState("");
  const [certInput, setCertInput] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [res, conf] = await Promise.all([
        axios.get(`${API}/resources`),
        axios.get(`${API}/resources/conflicts/check`)
      ]);
      setResources(res.data);
      setConflicts(conf.data);
    } catch (error) { toast.error("Failed to load assets"); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/resources`, formData);
      toast.success("Resource asset created");
      setIsDialogOpen(false);
      fetchData();
      setFormData({
        name: "", type: "human", department: "", unit: "",
        skills: [], certifications: [], clearance_level: "public",
        capacity_hours: 160, hourly_rate: 0
      });
    } catch (error) { toast.error("Creation failed"); }
  };

  // Helper Managers
  const addTag = (field, value, setter) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData({ ...formData, [field]: [...formData[field], value.trim()] });
      setter("");
    }
  };
  const removeTag = (field, value) => {
    setFormData({ ...formData, [field]: formData[field].filter(t => t !== value) });
  };

  const getUtilizationColor = (val) => val > 100 ? "#ef4444" : val > 80 ? "#f59e0b" : "#22c55e";
  
  // Data processing for charts
  const capacityData = resources.reduce((acc, curr) => {
    const dept = curr.department || "Unassigned";
    if (!acc[dept]) acc[dept] = { name: dept, capacity: 0, allocated: 0 };
    acc[dept].capacity += curr.capacity_hours;
    acc[dept].allocated += curr.allocated_hours;
    return acc;
  }, {});
  const chartData = Object.values(capacityData);

  const formatCurrency = (val) => `₹${val.toLocaleString('en-IN')}`;

  if (loading) return <div className="flex justify-center h-96 items-center text-blue-600 animate-pulse">Loading Asset Database...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase">Resource Command</h1>
          <p className="text-slate-500 text-sm mt-1">{resources.length} active assets • {conflicts.length} conflict alerts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase">
              <Plus className="w-4 h-4 mr-2" /> Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Resource Profile</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Full Name / Asset ID" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="human">Personnel</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="facility">Facility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Department" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                <Input placeholder="Unit / Division" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-heading text-slate-500 uppercase">Clearance Level</label>
                  <Select value={formData.clearance_level} onValueChange={v => setFormData({...formData, clearance_level: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="confidential">Confidential</SelectItem>
                      <SelectItem value="secret">Secret</SelectItem>
                      <SelectItem value="top_secret">Top Secret</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-heading text-slate-500 uppercase">Monthly Capacity (Hrs)</label>
                  <Input type="number" value={formData.capacity_hours} onChange={e => setFormData({...formData, capacity_hours: parseFloat(e.target.value)})} />
                </div>
              </div>

              {/* Skills & Certs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-heading text-slate-500 uppercase block mb-1">Skills</label>
                  <div className="flex gap-2 mb-2">
                    <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="Add skill..." />
                    <Button type="button" onClick={() => addTag('skills', skillInput, setSkillInput)} variant="outline" size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.skills.map(s => (
                      <span key={s} className="text-[10px] bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                        {s} <button type="button" onClick={() => removeTag('skills', s)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-heading text-slate-500 uppercase block mb-1">Certifications</label>
                  <div className="flex gap-2 mb-2">
                    <Input value={certInput} onChange={e => setCertInput(e.target.value)} placeholder="Add cert..." />
                    <Button type="button" onClick={() => addTag('certifications', certInput, setCertInput)} variant="outline" size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.certifications.map(c => (
                      <span key={c} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded flex items-center gap-1">
                        {c} <button type="button" onClick={() => removeTag('certifications', c)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 text-white">Register Asset</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Fleet Size</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-heading">{resources.length}</p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Over-Allocated</span>
            <Activity className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-red-600">{conflicts.length}</p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Total Capacity</span>
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold font-heading">{chartData.reduce((a,b) => a + b.capacity, 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">Hrs</span></p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Security Cleared</span>
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold font-heading">{resources.filter(r => r.clearance_level !== 'public').length}</p>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="list">Asset List</TabsTrigger>
          <TabsTrigger value="capacity">Capacity Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {conflicts.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="text-sm font-bold text-red-800 uppercase">Critical Resource Conflicts</h4>
                <p className="text-xs text-red-600">Immediate action required: {conflicts.length} assets are exceeding safe operational limits.</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map((res) => (
              <div key={res.id} className="bg-white border rounded-lg p-5 hover:shadow-md transition-all group relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${res.type === 'human' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {res.type === 'human' ? <UserCircle className="w-6 h-6"/> : res.type === 'facility' ? <Building className="w-6 h-6"/> : <Cpu className="w-6 h-6"/>}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{res.name}</h3>
                      <p className="text-xs text-slate-500">{res.department} • {res.unit}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100"><MoreVertical className="w-4 h-4"/></Button></DropdownMenuTrigger>
                    <DropdownMenuContent><DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2"/> Decommission</DropdownMenuItem></DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {res.clearance_level !== 'public' && (
                    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase flex items-center gap-1 font-bold ${res.clearance_level === 'top_secret' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      <Shield className="w-3 h-3"/> {res.clearance_level.replace('_', ' ')}
                    </span>
                  )}
                  {res.certifications?.map(c => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                      <Award className="w-3 h-3"/> {c}
                    </span>
                  ))}
                </div>

                {/* Utilization Bar */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Utilization ({res.allocated_hours}/{res.capacity_hours} hrs)</span>
                    <span className={`font-bold ${getUtilizationColor(res.utilization)}`}>{res.utilization}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(res.utilization, 100)}%`, backgroundColor: getUtilizationColor(res.utilization) }} 
                    />
                  </div>
                  {res.burnout_risk !== 'low' && (
                    <p className="text-[10px] text-red-600 font-bold uppercase mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3"/> {res.burnout_risk} Risk
                    </p>
                  )}
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1">
                  {res.skills?.slice(0, 4).map(s => (
                    <span key={s} className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded">{s}</span>
                  ))}
                  {(res.skills?.length || 0) > 4 && <span className="text-[10px] text-slate-400 pl-1">+{res.skills.length - 4} more</span>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="capacity">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="font-heading text-lg font-bold text-slate-800 uppercase mb-6">Departmental Load Analysis</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={100} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="capacity" fill="#e2e8f0" name="Total Capacity" barSize={20} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="allocated" fill="#3b82f6" name="Allocated Load" barSize={20} radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.allocated > entry.capacity ? "#ef4444" : "#3b82f6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}