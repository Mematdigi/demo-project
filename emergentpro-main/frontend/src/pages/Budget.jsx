import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import {
  IndianRupee,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Download
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { toast } from "sonner";

export default function Budget() {
  const [budgetEntries, setBudgetEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    project_id: "",
    category: "CAPEX",
    sub_category: "",
    description: "",
    amount_planned: 0,
    fiscal_year: "2024",
    quarter: "Q1",
    release_stage: "initial"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetRes, projectsRes] = await Promise.all([
        axios.get(`${API}/budget`),
        axios.get(`${API}/projects`)
      ]);
      setBudgetEntries(budgetRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error("Failed to fetch budget data:", error);
      toast.error("Failed to load budget data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/budget`, formData);
      toast.success("Budget entry created");
      setIsDialogOpen(false);
      fetchData();
      setFormData({
        project_id: "",
        category: "CAPEX",
        sub_category: "",
        description: "",
        amount_planned: 0,
        fiscal_year: "2024",
        quarter: "Q1",
        release_stage: "initial"
      });
    } catch (error) {
      toast.error("Failed to create budget entry");
    }
  };

  const handleReleaseBudget = async (entryId, amount) => {
    try {
      await axios.post(`${API}/budget/${entryId}/release`, { amount, stage: "released" });
      toast.success("Budget released successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to release budget");
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown";
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  // Calculate totals
  const totalPlanned = budgetEntries.reduce((sum, e) => sum + (e.amount_planned || 0), 0);
  const totalActual = budgetEntries.reduce((sum, e) => sum + (e.amount_actual || 0), 0);
  const totalReleased = budgetEntries.reduce((sum, e) => sum + (e.amount_released || 0), 0);
  const totalForecast = budgetEntries.reduce((sum, e) => sum + (e.amount_forecast || 0), 0);
  const variance = totalPlanned - totalActual;
  const variancePercent = totalPlanned > 0 ? ((variance / totalPlanned) * 100).toFixed(1) : 0;

  // Data for charts
  const categoryData = [
    { name: 'CAPEX', value: budgetEntries.filter(e => e.category === 'CAPEX').reduce((sum, e) => sum + e.amount_planned, 0), color: '#3b82f6' },
    { name: 'OPEX', value: budgetEntries.filter(e => e.category === 'OPEX').reduce((sum, e) => sum + e.amount_planned, 0), color: '#f59e0b' }
  ];

  const quarterData = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({
    quarter: q,
    planned: budgetEntries.filter(e => e.quarter === q).reduce((sum, e) => sum + e.amount_planned, 0) / 10000000,
    actual: budgetEntries.filter(e => e.quarter === q).reduce((sum, e) => sum + e.amount_actual, 0) / 10000000,
    released: budgetEntries.filter(e => e.quarter === q).reduce((sum, e) => sum + (e.amount_released || 0), 0) / 10000000
  }));

  const filteredEntries = budgetEntries.filter(e =>
    (e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getProjectName(e.project_id).toLowerCase().includes(searchTerm.toLowerCase())) &&
    (categoryFilter === "all" || e.category === categoryFilter)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-blue-600 font-heading text-lg uppercase tracking-wider animate-pulse">
          Loading Budget Data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="budget-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase tracking-wide">
            Budget & Finance
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            FY2024-25 financial tracking and fund releases
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-slate-300"
            onClick={() => window.open(`${API}/export/budget?format=csv`, '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase tracking-wider" data-testid="create-budget-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading text-slate-800 uppercase tracking-wider">
                  Add Budget Entry
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Project
                  </label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200" data-testid="budget-project-select">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200" data-testid="budget-category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="CAPEX">CAPEX</SelectItem>
                        <SelectItem value="OPEX">OPEX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                      Sub-Category
                    </label>
                    <Input
                      value={formData.sub_category}
                      onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                      className="bg-slate-50 border-slate-200"
                      placeholder="Hardware, Personnel..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Amount (₹)
                  </label>
                  <Input
                    type="number"
                    value={formData.amount_planned}
                    onChange={(e) => setFormData({ ...formData, amount_planned: parseFloat(e.target.value) })}
                    className="bg-slate-50 border-slate-200 font-mono"
                    required
                    data-testid="budget-amount-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    placeholder="Hardware procurement for Phase 2"
                    required
                    data-testid="budget-description-input"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                      Fiscal Year
                    </label>
                    <Select
                      value={formData.fiscal_year}
                      onValueChange={(value) => setFormData({ ...formData, fiscal_year: value })}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="2024">FY2024-25</SelectItem>
                        <SelectItem value="2025">FY2025-26</SelectItem>
                        <SelectItem value="2026">FY2026-27</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                      Quarter
                    </label>
                    <Select
                      value={formData.quarter}
                      onValueChange={(value) => setFormData({ ...formData, quarter: value })}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="Q1">Q1</SelectItem>
                        <SelectItem value="Q2">Q2</SelectItem>
                        <SelectItem value="Q3">Q3</SelectItem>
                        <SelectItem value="Q4">Q4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                      Release Stage
                    </label>
                    <Select
                      value={formData.release_stage}
                      onValueChange={(value) => setFormData({ ...formData, release_stage: value })}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="initial">Initial</SelectItem>
                        <SelectItem value="phase_1">Phase 1</SelectItem>
                        <SelectItem value="phase_2">Phase 2</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="submit-budget-btn">
                    Add Entry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <IndianRupee className="w-4 h-4" />
            <span className="text-xs font-heading uppercase tracking-wider">Total Planned</span>
          </div>
          <p className="text-2xl font-heading font-bold text-slate-800">{formatCurrency(totalPlanned)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-heading uppercase tracking-wider">Total Spent</span>
          </div>
          <p className="text-2xl font-heading font-bold text-blue-600">{formatCurrency(totalActual)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs font-heading uppercase tracking-wider">Released</span>
          </div>
          <p className="text-2xl font-heading font-bold text-green-600">{formatCurrency(totalReleased)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-heading uppercase tracking-wider">Forecast</span>
          </div>
          <p className="text-2xl font-heading font-bold text-amber-600">{formatCurrency(totalForecast || totalActual)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            {variance >= 0 ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
            <span className="text-xs font-heading uppercase tracking-wider">Variance</span>
          </div>
          <p className={`text-2xl font-heading font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {variance >= 0 ? '+' : ''}{formatCurrency(Math.abs(variance))}
          </p>
          <p className="text-xs text-slate-500">{variancePercent}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
            Quarterly Budget vs Actual vs Released (₹ Crores)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`₹${value.toFixed(2)} Cr`, '']}
                />
                <Bar dataKey="planned" fill="#e2e8f0" name="Planned" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual" radius={[4, 4, 0, 0]} />
                <Bar dataKey="released" fill="#22c55e" name="Released" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
            CAPEX vs OPEX
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#ffffff', 
                    border: '1px solid #e2e8f0'
                  }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-600">{item.name}</span>
                <span className="text-xs font-mono text-slate-500">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search budget entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200"
            data-testid="search-budget-input"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px] bg-white border-slate-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="CAPEX">CAPEX</SelectItem>
            <SelectItem value="OPEX">OPEX</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Budget Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="tactical-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Description</th>
              <th>Category</th>
              <th>Planned</th>
              <th>Actual</th>
              <th>Released</th>
              <th>Variance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => {
              const entryVariance = (entry.amount_planned || 0) - (entry.amount_actual || 0);
              return (
                <tr key={entry.id} data-testid={`budget-row-${entry.id}`}>
                  <td>
                    <p className="text-slate-800 text-sm font-medium">{getProjectName(entry.project_id)}</p>
                    <p className="text-xs text-slate-500">{entry.fiscal_year} {entry.quarter}</p>
                  </td>
                  <td className="text-slate-600 text-sm">
                    {entry.description}
                    {entry.sub_category && <span className="text-slate-400 ml-1">({entry.sub_category})</span>}
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-heading uppercase ${
                      entry.category === 'CAPEX' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {entry.category}
                    </span>
                  </td>
                  <td className="font-mono text-sm text-slate-700">{formatCurrency(entry.amount_planned)}</td>
                  <td className="font-mono text-sm text-slate-800">{formatCurrency(entry.amount_actual || 0)}</td>
                  <td className="font-mono text-sm text-green-600">{formatCurrency(entry.amount_released || 0)}</td>
                  <td className={`font-mono text-sm ${entryVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entryVariance >= 0 ? '+' : ''}{formatCurrency(Math.abs(entryVariance))}
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-heading uppercase ${
                      entry.status === 'approved' ? 'bg-green-100 text-green-700' :
                      entry.status === 'released' ? 'bg-blue-100 text-blue-700' :
                      entry.is_overrun ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {entry.is_overrun ? 'OVERRUN' : entry.status || 'pending'}
                    </span>
                  </td>
                  <td>
                    {entry.status !== 'released' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs border-green-300 text-green-600 hover:bg-green-50"
                        onClick={() => handleReleaseBudget(entry.id, entry.amount_planned)}
                      >
                        Release
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <IndianRupee className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No budget entries found</p>
          </div>
        )}
      </div>
    </div>
  );
}
