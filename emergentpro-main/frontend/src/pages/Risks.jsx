import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import {
  AlertTriangle,
  Plus,
  Search,
  Shield,
  MoreVertical,
  TrendingUp,
  ArrowUp
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
import { toast } from "sonner";

const riskCategories = ["Technical", "Financial", "Supply Chain", "Administrative", "Environmental", "Security", "Operational"];

export default function Risks() {
  const [risks, setRisks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    project_id: "",
    title: "",
    description: "",
    category: "Technical",
    probability: 3,
    impact: 3,
    mitigation_plan: "",
    contingency_plan: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [risksRes, issuesRes, projectsRes] = await Promise.all([
        axios.get(`${API}/risks`),
        axios.get(`${API}/issues`),
        axios.get(`${API}/projects`)
      ]);
      setRisks(risksRes.data);
      setIssues(issuesRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error("Failed to fetch risks:", error);
      toast.error("Failed to load risk data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/risks`, formData);
      toast.success("Risk created successfully");
      setIsDialogOpen(false);
      fetchData();
      setFormData({
        project_id: "",
        title: "",
        description: "",
        category: "Technical",
        probability: 3,
        impact: 3,
        mitigation_plan: "",
        contingency_plan: ""
      });
    } catch (error) {
      toast.error("Failed to create risk");
    }
  };

  const handleEscalate = async (riskId) => {
    try {
      await axios.post(`${API}/risks/${riskId}/escalate`, { 
        level: 1, 
        reason: "Manual escalation" 
      });
      toast.success("Risk escalated");
      fetchData();
    } catch (error) {
      toast.error("Failed to escalate risk");
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown";
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      case 'high': return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
      case 'medium': return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' };
      default: return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    }
  };

  const filteredRisks = risks.filter(r =>
    (r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (levelFilter === "all" || r.level === levelFilter)
  );

  const risksByLevel = {
    critical: risks.filter(r => r.level === 'critical'),
    high: risks.filter(r => r.level === 'high'),
    medium: risks.filter(r => r.level === 'medium'),
    low: risks.filter(r => r.level === 'low')
  };

  // Generate risk matrix data
  const riskMatrix = [];
  for (let impact = 5; impact >= 1; impact--) {
    for (let prob = 1; prob <= 5; prob++) {
      const score = prob * impact;
      const level = score >= 15 ? 'critical' : score >= 10 ? 'high' : score >= 5 ? 'medium' : 'low';
      const matchingRisks = risks.filter(r => r.probability === prob && r.impact === impact);
      riskMatrix.push({ prob, impact, score, level, count: matchingRisks.length, risks: matchingRisks });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-blue-600 font-heading text-lg uppercase tracking-wider animate-pulse">
          Loading Risk Data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="risks-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase tracking-wide">
            Risk Matrix
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {risks.length} identified risks • {issues.length} active issues
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase tracking-wider" data-testid="create-risk-btn">
              <Plus className="w-4 h-4 mr-2" />
              Log Risk
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-slate-800 uppercase tracking-wider">
                Log New Risk
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
                  <SelectTrigger className="bg-slate-50 border-slate-200" data-testid="risk-project-select">
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
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Risk Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-slate-50 border-slate-200"
                  placeholder="Vendor delivery delay"
                  required
                  data-testid="risk-title-input"
                />
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
                    <SelectTrigger className="bg-slate-50 border-slate-200" data-testid="risk-category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {riskCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Probability × Impact
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={formData.probability.toString()}
                      onValueChange={(value) => setFormData({ ...formData, probability: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <SelectItem key={v} value={v.toString()}>P: {v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={formData.impact.toString()}
                      onValueChange={(value) => setFormData({ ...formData, impact: parseInt(value) })}
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <SelectItem key={v} value={v.toString()}>I: {v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  data-testid="risk-description-input"
                />
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Mitigation Plan
                </label>
                <textarea
                  value={formData.mitigation_plan}
                  onChange={(e) => setFormData({ ...formData, mitigation_plan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Actions to reduce probability or impact..."
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Contingency Plan
                </label>
                <textarea
                  value={formData.contingency_plan}
                  onChange={(e) => setFormData({ ...formData, contingency_plan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Actions if risk materialises..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="submit-risk-btn">
                  Log Risk
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { level: 'critical', label: 'Critical', color: 'red' },
          { level: 'high', label: 'High', color: 'orange' },
          { level: 'medium', label: 'Medium', color: 'amber' },
          { level: 'low', label: 'Low', color: 'green' },
        ].map(({ level, label, color }) => (
          <button
            key={level}
            onClick={() => setLevelFilter(levelFilter === level ? 'all' : level)}
            className={`bg-white border rounded-lg p-4 text-left transition-all shadow-sm hover:shadow ${
              levelFilter === level ? `border-${color}-400 ring-2 ring-${color}-100` : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className={`w-5 h-5 text-${color}-600`} />
              <span className={`text-xs px-2 py-0.5 rounded font-heading uppercase bg-${color}-100 text-${color}-700`}>
                {label}
              </span>
            </div>
            <p className="text-2xl font-heading font-bold text-slate-800">{risksByLevel[level]?.length || 0}</p>
          </button>
        ))}
      </div>

      {/* View Toggle & Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search risks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200"
            data-testid="search-risks-input"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded text-sm font-heading uppercase ${viewMode === "list" ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("matrix")}
            className={`px-3 py-1.5 rounded text-sm font-heading uppercase ${viewMode === "matrix" ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
          >
            Matrix
          </button>
        </div>
      </div>

      {/* Risk Matrix View */}
      {viewMode === "matrix" && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
            Probability × Impact Matrix
          </h3>
          <div className="flex">
            {/* Y-axis label */}
            <div className="flex flex-col justify-center mr-2">
              <span className="text-xs text-slate-500 font-heading uppercase tracking-wider -rotate-90 whitespace-nowrap">
                Impact →
              </span>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(p => (
                  <div key={p} className="text-center text-xs text-slate-500 font-mono">{p}</div>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {riskMatrix.map((cell, idx) => {
                  const colors = getRiskColor(cell.level);
                  return (
                    <div
                      key={idx}
                      className={`aspect-square ${colors.bg} ${colors.border} border rounded flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
                      title={`P:${cell.prob} × I:${cell.impact} = ${cell.score}`}
                    >
                      <span className={`text-sm font-bold ${colors.text}`}>{cell.score}</span>
                      {cell.count > 0 && (
                        <span className={`text-[10px] ${colors.text}`}>{cell.count} risks</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-slate-500 font-heading uppercase tracking-wider">
                  Probability →
                </span>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
            {[
              { level: 'critical', label: 'Critical (15-25)' },
              { level: 'high', label: 'High (10-14)' },
              { level: 'medium', label: 'Medium (5-9)' },
              { level: 'low', label: 'Low (1-4)' },
            ].map(({ level, label }) => {
              const colors = getRiskColor(level);
              return (
                <div key={level} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${colors.bg} ${colors.border} border`} />
                  <span className="text-xs text-slate-600">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risks List View */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {filteredRisks.map((risk) => {
            const colors = getRiskColor(risk.level);
            return (
              <div
                key={risk.id}
                className={`bg-white border ${colors.border} rounded-lg p-5 shadow-sm`}
                data-testid={`risk-card-${risk.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                      <AlertTriangle className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <h3 className="text-slate-800 font-medium">{risk.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{getProjectName(risk.project_id)} • {risk.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-heading uppercase ${colors.bg} ${colors.text}`}>
                      {risk.level}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-mono bg-slate-100 text-slate-700">
                      Score: {risk.risk_score}
                    </span>
                  </div>
                </div>

                {risk.description && (
                  <p className="text-sm text-slate-600 mb-3">{risk.description}</p>
                )}

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Probability</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <div
                          key={v}
                          className={`w-5 h-5 rounded text-[10px] flex items-center justify-center ${
                            v <= risk.probability ? `${colors.bg} ${colors.text}` : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {v}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Impact</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <div
                          key={v}
                          className={`w-5 h-5 rounded text-[10px] flex items-center justify-center ${
                            v <= risk.impact ? `${colors.bg} ${colors.text}` : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {v}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Mitigation Status</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-heading uppercase ${
                      risk.mitigation_status === 'completed' ? 'bg-green-100 text-green-700' :
                      risk.mitigation_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {risk.mitigation_status?.replace('_', ' ') || 'Not Started'}
                    </span>
                  </div>
                </div>

                {risk.mitigation_plan && (
                  <div className="p-3 bg-slate-50 rounded-lg mb-3">
                    <p className="text-xs text-slate-500 font-heading uppercase mb-1">Mitigation Plan</p>
                    <p className="text-sm text-slate-700">{risk.mitigation_plan}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className={`text-xs ${
                    risk.status === 'open' ? 'text-red-600' :
                    risk.status === 'mitigated' ? 'text-green-600' :
                    'text-slate-500'
                  }`}>
                    Status: {risk.status?.toUpperCase() || 'OPEN'}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => handleEscalate(risk.id)}
                  >
                    <ArrowUp className="w-3 h-3 mr-1" />
                    Escalate
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredRisks.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No risks found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
