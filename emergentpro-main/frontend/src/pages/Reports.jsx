import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import {
  BarChart3, FileText, Download, IndianRupee, AlertTriangle,
  Users, Calendar, Filter, TrendingUp, TrendingDown,
  PieChart as PieIcon, Activity, Printer, Mail, Shield, CheckCircle2
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "../components/ui/dropdown-menu"; // <--- ADDED THIS IMPORT BLOCK
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, ScatterChart, Scatter, ZAxis
} from "recharts";
import { toast } from "sonner";

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [risks, setRisks] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState("this_quarter");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, projectsRes, risksRes, vendorsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/projects`),
        axios.get(`${API}/risks`),
        axios.get(`${API}/vendors`)
      ]);
      setStats(statsRes.data);
      setProjects(projectsRes.data);
      setRisks(risksRes.data);
      setVendors(vendorsRes.data);
    } catch (error) { toast.error("Failed to load analytics"); } 
    finally { setLoading(false); }
  };

  const handleExport = (format) => {
    toast.info(`Generating Classified ${format.toUpperCase()}...`, {
      description: "Applying 'SECRET' watermarks and encryption.",
      duration: 3000,
    });
    // In a real app, this would trigger a backend generation job or client-side PDF build
    if (format === 'csv') window.open(`${API}/export/projects?format=csv`, '_blank');
  };

  const handleScheduleReport = (e) => {
    e.preventDefault();
    setIsScheduleOpen(false);
    toast.success("Briefing Scheduled", { description: "Command will receive this report every Monday at 0800 hrs." });
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    return `₹${(value / 1000).toFixed(0)} K`;
  };

  // --- DATA PREP ---
  
  // 1. Portfolio Health Data
  const healthDistribution = [
    { name: 'Healthy (80+)', value: projects.filter(p => p.health_score >= 80).length, color: '#22c55e' },
    { name: 'At Risk (60-79)', value: projects.filter(p => p.health_score >= 60 && p.health_score < 80).length, color: '#f59e0b' },
    { name: 'Critical (<60)', value: projects.filter(p => p.health_score < 60).length, color: '#ef4444' }
  ];

  // 2. Financial Trend (Simulated)
  const financialTrend = [
    { month: 'Jan', budget: 100, actual: 80 },
    { month: 'Feb', budget: 200, actual: 190 },
    { month: 'Mar', budget: 300, actual: 295 },
    { month: 'Apr', budget: 400, actual: 410 }, // Overrun
    { month: 'May', budget: 500, actual: 520 },
  ];

  // 3. Risk Heatmap Data
  const riskScatter = risks.map(r => ({
    x: r.impact,
    y: r.probability,
    z: r.risk_score,
    name: r.title,
    level: r.level
  }));

  // 4. Vendor Performance
  const vendorPerformance = vendors.map(v => ({
    name: v.code,
    sla: v.sla_compliance || 0,
    value: (v.total_value || 0) / 10000000 // In Cr
  }));

  if (loading) return <div className="flex justify-center h-96 items-center text-blue-600 animate-pulse">Generating Insights...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase">Analytics Directorate</h1>
          <p className="text-slate-500 text-sm mt-1">Decision-Grade Insights & Reporting</p>
        </div>
        <div className="flex gap-2">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-[140px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => setIsScheduleOpen(true)}>
            <Mail className="w-4 h-4 mr-2" /> Schedule
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <Printer className="w-4 h-4 mr-2" /> Classified PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="w-4 h-4 mr-2" /> Secure CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="command" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="command"><Shield className="w-4 h-4 mr-2"/> Command View</TabsTrigger>
          <TabsTrigger value="pmo"><Activity className="w-4 h-4 mr-2"/> Project Execution</TabsTrigger>
          <TabsTrigger value="finance"><IndianRupee className="w-4 h-4 mr-2"/> Financials</TabsTrigger>
          <TabsTrigger value="risk"><AlertTriangle className="w-4 h-4 mr-2"/> Risk Heatmap</TabsTrigger>
          <TabsTrigger value="vendor"><Users className="w-4 h-4 mr-2"/> Vendor Perf.</TabsTrigger>
        </TabsList>

        {/* 1. COMMAND PORTFOLIO DASHBOARD */}
        <TabsContent value="command" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Portfolio Value" value={formatCurrency(stats?.projects?.total_budget || 0)} icon={IndianRupee} color="blue" />
            <KpiCard label="Avg Health Score" value={`${stats?.projects?.avg_health_score || 0}%`} icon={Activity} color="green" />
            <KpiCard label="Critical Risks" value={stats?.risks?.critical || 0} icon={AlertTriangle} color="red" />
            <KpiCard label="Active Projects" value={projects.filter(p => p.status === 'in_progress').length} icon={TrendingUp} color="indigo" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-5 shadow-sm">
              <h3 className="font-heading text-sm font-bold uppercase mb-4">Portfolio Health Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={healthDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {healthDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-5 shadow-sm">
              <h3 className="font-heading text-sm font-bold uppercase mb-4">Budget Utilization (Top 5 Projects)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projects.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="code" width={80} style={{fontSize: '10px'}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                    <Bar dataKey="budget_allocated" name="Allocated" fill="#e2e8f0" barSize={10} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="budget_spent" name="Spent" fill="#3b82f6" barSize={10} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. PROJECT EXECUTION DASHBOARD (PMO) */}
        <TabsContent value="pmo" className="space-y-6">
          <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-heading text-sm font-bold uppercase">Mission Execution Status</h3>
              <Button variant="ghost" size="sm" className="text-blue-600">View All Tasks</Button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b font-heading text-slate-500">
                <tr>
                  <th className="p-3">Project</th>
                  <th className="p-3">Phase</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">Schedule Variance</th>
                  <th className="p-3">Next Milestone</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs uppercase">{p.phase}</span></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${p.progress}%` }}></div>
                        </div>
                        <span className="text-xs">{p.progress}%</span>
                      </div>
                    </td>
                    <td className={`p-3 font-mono ${p.schedule_variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {p.schedule_variance > 0 ? '+' : ''}{p.schedule_variance}%
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {p.milestones?.find(m => m.status === 'pending')?.name || "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* 3. FINANCIAL DASHBOARD */}
        <TabsContent value="finance" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-5 shadow-sm">
              <h3 className="font-heading text-sm font-bold uppercase mb-4">Burn Rate Analysis (Budget vs Actual)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financialTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="budget" stroke="#94a3b8" strokeDasharray="5 5" name="Planned Baseline" />
                    <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} name="Actual Spend" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white border rounded-lg p-5 shadow-sm">
              <h3 className="font-heading text-sm font-bold uppercase mb-4">Cost Variance by Program</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projects}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="code" style={{fontSize: '10px'}} />
                    <YAxis />
                    <Tooltip formatter={(val) => `₹${val}`} />
                    <Bar dataKey="cost_variance" fill="#8884d8">
                      {projects.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cost_variance < 0 ? '#ef4444' : '#22c55e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 4. RISK HEATMAP */}
        <TabsContent value="risk" className="space-y-6">
          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <h3 className="font-heading text-sm font-bold uppercase mb-4">Strategic Risk Landscape</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="x" name="Impact" unit="" domain={[0, 6]} label={{ value: 'Impact', position: 'bottom' }} />
                  <YAxis type="number" dataKey="y" name="Probability" unit="" domain={[0, 6]} label={{ value: 'Probability', angle: -90, position: 'left' }} />
                  <ZAxis type="number" dataKey="z" range={[100, 500]} name="Score" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Risks" data={riskScatter} fill="#8884d8">
                    {riskScatter.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.z >= 15 ? '#ef4444' : entry.z >= 10 ? '#f97316' : '#22c55e'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-slate-500 mt-2">Bubble size indicates Risk Score (P x I)</div>
          </div>
        </TabsContent>

        {/* 5. VENDOR PERFORMANCE */}
        <TabsContent value="vendor" className="space-y-6">
          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <h3 className="font-heading text-sm font-bold uppercase mb-4">Vendor SLA Compliance vs. Contract Value</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" label={{ value: 'Contract Value (Cr)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" domain={[0, 100]} label={{ value: 'SLA %', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="value" name="Value (Cr)" fill="#3b82f6" barSize={30} />
                  <Bar yAxisId="right" dataKey="sla" name="SLA %" fill="#10b981" barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* SCHEDULE DIALOG */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Automated Briefing</DialogTitle></DialogHeader>
          <form onSubmit={handleScheduleReport} className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Frequency</label>
              <Select defaultValue="weekly">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily (0800)</SelectItem>
                  <SelectItem value="weekly">Weekly (Mon 0800)</SelectItem>
                  <SelectItem value="monthly">Monthly (1st)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Recipients</label>
              <Input placeholder="Enter email addresses..." defaultValue="command@defense.gov" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="encrypt" defaultChecked />
              <label htmlFor="encrypt" className="text-sm">Encrypt Attachment (AES-256)</label>
            </div>
            <Button type="submit" className="w-full bg-blue-600">Confirm Schedule</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple KPI Card Component
const KpiCard = ({ label, value, icon: Icon, color }) => (
  <div className={`bg-white border-l-4 p-4 rounded-r-lg shadow-sm flex items-center justify-between border-${color}-500`}>
    <div>
      <p className="text-xs text-slate-500 font-heading uppercase">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
    <div className={`p-2 rounded-full bg-${color}-50`}>
      <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
  </div>
);