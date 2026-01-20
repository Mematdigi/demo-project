import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API } from "../App";
import {
  AlertTriangle,
  Plus,
  Search,
  Shield,
  TrendingUp,
  ArrowUp,
  Calendar,
  GitBranch,
  Target,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  Route,
  Zap,
  FileWarning,
  Activity,
  ArrowRight,
  CircleDot,
  Link2
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

const riskCategories = ["Technical", "Financial", "Supply Chain", "Administrative", "Environmental", "Security", "Operational", "Quality", "Vendor"];

// Demo Data - Fire Station Shoes Project
const demoProject = {
  id: "demo-firestation-shoes",
  name: "Fire Station Safety Shoes Procurement",
  code: "FSS-2024",
  description: "Procurement and distribution of safety shoes for fire station personnel"
};

// Demo Tasks with Dependencies for Gantt Chart
const demoTasks = [
  {
    id: "task-1",
    name: "Requirement Analysis",
    start_date: "2024-01-01",
    end_date: "2024-01-15",
    duration: 15,
    progress: 100,
    dependencies: [],
    is_critical: true,
    status: "completed"
  },
  {
    id: "task-2",
    name: "Vendor Identification",
    start_date: "2024-01-16",
    end_date: "2024-01-30",
    duration: 15,
    progress: 100,
    dependencies: ["task-1"],
    is_critical: true,
    status: "completed"
  },
  {
    id: "task-3",
    name: "RFQ Preparation",
    start_date: "2024-01-20",
    end_date: "2024-02-05",
    duration: 17,
    progress: 100,
    dependencies: ["task-1"],
    is_critical: false,
    status: "completed"
  },
  {
    id: "task-4",
    name: "Vendor Quotation Review",
    start_date: "2024-02-01",
    end_date: "2024-02-20",
    duration: 20,
    progress: 80,
    dependencies: ["task-2", "task-3"],
    is_critical: true,
    status: "in_progress"
  },
  {
    id: "task-5",
    name: "Sample Testing",
    start_date: "2024-02-21",
    end_date: "2024-03-10",
    duration: 18,
    progress: 0,
    dependencies: ["task-4"],
    is_critical: true,
    status: "todo"
  },
  {
    id: "task-6",
    name: "Quality Certification",
    start_date: "2024-03-01",
    end_date: "2024-03-15",
    duration: 15,
    progress: 0,
    dependencies: ["task-5"],
    is_critical: true,
    status: "todo"
  },
  {
    id: "task-7",
    name: "Contract Negotiation",
    start_date: "2024-03-11",
    end_date: "2024-03-25",
    duration: 15,
    progress: 0,
    dependencies: ["task-5"],
    is_critical: false,
    status: "todo"
  },
  {
    id: "task-8",
    name: "Order Placement",
    start_date: "2024-03-16",
    end_date: "2024-03-20",
    duration: 5,
    progress: 0,
    dependencies: ["task-6", "task-7"],
    is_critical: true,
    status: "todo"
  },
  {
    id: "task-9",
    name: "Manufacturing",
    start_date: "2024-03-21",
    end_date: "2024-05-20",
    duration: 60,
    progress: 0,
    dependencies: ["task-8"],
    is_critical: true,
    status: "todo"
  },
  {
    id: "task-10",
    name: "Quality Inspection",
    start_date: "2024-05-21",
    end_date: "2024-06-05",
    duration: 15,
    progress: 0,
    dependencies: ["task-9"],
    is_critical: true,
    status: "todo"
  },
  {
    id: "task-11",
    name: "Delivery & Distribution",
    start_date: "2024-06-06",
    end_date: "2024-06-20",
    duration: 15,
    progress: 0,
    dependencies: ["task-10"],
    is_critical: true,
    status: "todo"
  }
];

// Demo Risks for Fire Station Shoes
const demoRisks = [
  {
    id: "risk-fs-001",
    project_id: "demo-firestation-shoes",
    title: "Shoe Quality Below Standards",
    description: "Vendor may supply shoes with inferior material quality - poor leather, weak stitching, or substandard soles that don't meet fire safety requirements",
    category: "Quality",
    probability: 4,
    impact: 5,
    risk_score: 20,
    level: "critical",
    mitigation_plan: "Mandatory ISI certification, third-party quality testing before acceptance, sample testing with fire station personnel",
    contingency_plan: "Reject batch, impose penalty on vendor, activate backup vendor",
    status: "open",
    affected_tasks: ["task-5", "task-6", "task-9", "task-10"],
    triggers: ["Failed sample test", "Missing certifications", "User complaints during trial"]
  },
  {
    id: "risk-fs-002",
    project_id: "demo-firestation-shoes",
    title: "Vendor Delivery Delay",
    description: "Selected vendor may fail to deliver on time due to production capacity issues or raw material shortage",
    category: "Supply Chain",
    probability: 3,
    impact: 4,
    risk_score: 12,
    level: "high",
    mitigation_plan: "Include penalty clauses in contract, maintain buffer stock from previous procurement, identify backup vendors",
    contingency_plan: "Split order between multiple vendors, expedite shipping at vendor cost",
    status: "open",
    affected_tasks: ["task-9", "task-11"],
    triggers: ["Production delay notification", "Raw material shortage reports", "Missed milestone"]
  },
  {
    id: "risk-fs-003",
    project_id: "demo-firestation-shoes",
    title: "Size/Fit Issues",
    description: "Shoes may not fit properly for all personnel leading to discomfort, blisters, or inability to perform duties effectively",
    category: "Operational",
    probability: 3,
    impact: 3,
    risk_score: 9,
    level: "medium",
    mitigation_plan: "Collect accurate size measurements from all stations, order sample sizes for trial, include exchange policy in contract",
    contingency_plan: "Fast-track exchange process, maintain size buffer stock",
    status: "open",
    affected_tasks: ["task-1", "task-5", "task-11"],
    triggers: ["Size measurement errors", "Personnel transfer/new joining", "Physical changes"]
  },
  {
    id: "risk-fs-004",
    project_id: "demo-firestation-shoes",
    title: "Budget Overrun",
    description: "Actual costs may exceed budgeted amount due to price increase, additional requirements, or currency fluctuation",
    category: "Financial",
    probability: 2,
    impact: 4,
    risk_score: 8,
    level: "medium",
    mitigation_plan: "Lock prices in contract, include 10% contingency buffer, multi-year rate agreement",
    contingency_plan: "Seek additional budget approval, reduce quantity in phases",
    status: "open",
    affected_tasks: ["task-4", "task-7", "task-8"],
    triggers: ["Price revision request", "Scope change", "Inflation index increase"]
  },
  {
    id: "risk-fs-005",
    project_id: "demo-firestation-shoes",
    title: "Heat & Fire Resistance Failure",
    description: "Shoes may not withstand required temperature levels during actual fire operations, leading to safety hazard for firefighters",
    category: "Technical",
    probability: 2,
    impact: 5,
    risk_score: 10,
    level: "high",
    mitigation_plan: "Specify exact temperature resistance requirements (min 300°C), mandatory lab testing, field trials in controlled conditions",
    contingency_plan: "Immediate recall, provide temporary equipment, blacklist vendor",
    status: "open",
    affected_tasks: ["task-5", "task-6", "task-10"],
    triggers: ["Lab test failure", "Field incident report", "Material change notification"]
  },
  {
    id: "risk-fs-006",
    project_id: "demo-firestation-shoes",
    title: "Vendor Bankruptcy/Closure",
    description: "Selected vendor may face financial difficulties leading to business closure before or during order fulfillment",
    category: "Vendor",
    probability: 1,
    impact: 5,
    risk_score: 5,
    level: "medium",
    mitigation_plan: "Check vendor financial health before selection, require bank guarantee, maintain approved backup vendor list",
    contingency_plan: "Activate backup vendor, claim bank guarantee, legal action for recovery",
    status: "open",
    affected_tasks: ["task-8", "task-9"],
    triggers: ["Negative credit reports", "Delayed payments to sub-suppliers", "Legal notices"]
  },
  {
    id: "risk-fs-007",
    project_id: "demo-firestation-shoes",
    title: "Non-Compliance with Safety Standards",
    description: "Shoes may not comply with BIS/ISO safety standards for protective footwear leading to rejection during audit",
    category: "Quality",
    probability: 2,
    impact: 4,
    risk_score: 8,
    level: "medium",
    mitigation_plan: "Mandate specific standard compliance (IS 15298, EN ISO 20345), verify certifications before order",
    contingency_plan: "Reject non-compliant batch, re-tender with corrected specifications",
    status: "open",
    affected_tasks: ["task-3", "task-6"],
    triggers: ["Missing certification documents", "Audit findings", "Standard revision"]
  },
  {
    id: "risk-fs-008",
    project_id: "demo-firestation-shoes",
    title: "Import Dependency Risk",
    description: "If shoes or critical components are imported, customs delays or import restrictions may affect delivery",
    category: "Supply Chain",
    probability: 2,
    impact: 3,
    risk_score: 6,
    level: "medium",
    mitigation_plan: "Prefer Make in India vendors, plan for customs clearance time, maintain documentation ready",
    contingency_plan: "Use domestic alternatives, expedite customs through authorized channels",
    status: "open",
    affected_tasks: ["task-9", "task-11"],
    triggers: ["Import policy change", "Customs hold notice", "Port congestion"]
  }
];

// Scenario Planning Data
const scenarios = {
  best: {
    name: "Best Case Scenario",
    description: "All risks mitigated, no delays, quality exceeds expectations",
    completion_date: "2024-06-15",
    budget_variance: -5,
    quality_score: 95,
    assumptions: [
      "Vendor delivers on time with excellent quality",
      "No price escalation",
      "All sizes fit correctly on first delivery",
      "Smooth certification process"
    ],
    probability: 20
  },
  expected: {
    name: "Expected Case Scenario",
    description: "Normal execution with minor issues handled through mitigation",
    completion_date: "2024-06-25",
    budget_variance: 5,
    quality_score: 85,
    assumptions: [
      "Minor delivery delays (1-2 weeks)",
      "5-10% size exchanges needed",
      "Standard quality meeting minimum requirements",
      "Some rework in certification"
    ],
    probability: 60
  },
  worst: {
    name: "Worst Case Scenario",
    description: "Multiple risks materialize, significant delays and cost overrun",
    completion_date: "2024-08-30",
    budget_variance: 25,
    quality_score: 70,
    assumptions: [
      "Major vendor delay or quality failure",
      "Need to switch vendors mid-project",
      "Budget overrun requiring additional approvals",
      "Re-testing and re-certification needed"
    ],
    probability: 15
  },
  conflict: {
    name: "Conflict/Crisis Scenario",
    description: "Emergency situation requiring immediate action",
    completion_date: "2024-04-30",
    budget_variance: 50,
    quality_score: 75,
    assumptions: [
      "Urgent requirement due to disaster/emergency",
      "Expedited procurement process",
      "Premium pricing for fast delivery",
      "Reduced quality checks for speed"
    ],
    probability: 5
  }
};

export default function Risks() {
  const [risks, setRisks] = useState(demoRisks);
  const [tasks, setTasks] = useState(demoTasks);
  const [projects, setProjects] = useState([demoProject]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [viewMode, setViewMode] = useState("gantt");
  const [selectedScenario, setSelectedScenario] = useState("expected");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [formData, setFormData] = useState({
    project_id: demoProject.id,
    title: "",
    description: "",
    category: "Technical",
    probability: 3,
    impact: 3,
    mitigation_plan: "",
    contingency_plan: ""
  });

  // Calculate Critical Path
  const criticalPath = useMemo(() => {
    return tasks.filter(t => t.is_critical).map(t => t.id);
  }, [tasks]);

  const criticalPathDuration = useMemo(() => {
    return tasks.filter(t => t.is_critical).reduce((sum, t) => sum + t.duration, 0);
  }, [tasks]);

  // Gantt Chart Date Calculations
  const ganttConfig = useMemo(() => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-07-01");
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const months = [];
    let current = new Date(startDate);
    while (current < endDate) {
      months.push({
        name: current.toLocaleString('default', { month: 'short' }),
        year: current.getFullYear(),
        days: new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
      });
      current.setMonth(current.getMonth() + 1);
    }
    
    return { startDate, endDate, totalDays, months };
  }, []);

  const getTaskPosition = (task) => {
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);
    const startOffset = Math.ceil((taskStart - ganttConfig.startDate) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24));
    
    return {
      left: `${(startOffset / ganttConfig.totalDays) * 100}%`,
      width: `${(duration / ganttConfig.totalDays) * 100}%`
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newRisk = {
      ...formData,
      id: `risk-fs-${String(risks.length + 1).padStart(3, '0')}`,
      risk_score: formData.probability * formData.impact,
      level: formData.probability * formData.impact >= 15 ? 'critical' : 
             formData.probability * formData.impact >= 10 ? 'high' : 
             formData.probability * formData.impact >= 5 ? 'medium' : 'low',
      status: 'open',
      affected_tasks: [],
      triggers: []
    };
    setRisks([...risks, newRisk]);
    toast.success("Risk logged successfully");
    setIsDialogOpen(false);
    setFormData({
      project_id: demoProject.id,
      title: "",
      description: "",
      category: "Technical",
      probability: 3,
      impact: 3,
      mitigation_plan: "",
      contingency_plan: ""
    });
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', bar: 'bg-red-500' };
      case 'high': return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', bar: 'bg-orange-500' };
      case 'medium': return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', bar: 'bg-amber-500' };
      default: return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', bar: 'bg-green-500' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  };

  const filteredRisks = risks.filter(r =>
    (r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (levelFilter === "all" || r.level === levelFilter)
  );

  const riskStats = {
    critical: risks.filter(r => r.level === 'critical').length,
    high: risks.filter(r => r.level === 'high').length,
    medium: risks.filter(r => r.level === 'medium').length,
    low: risks.filter(r => r.level === 'low').length,
    total: risks.length,
    avgScore: Math.round(risks.reduce((sum, r) => sum + r.risk_score, 0) / risks.length)
  };

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            Risk Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            <span className="font-medium text-blue-600">{demoProject.name}</span> • {risks.length} identified risks • Critical Path: {criticalPathDuration} days
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase tracking-wider">
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
                  Risk Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Vendor Delivery Delay"
                  className="bg-slate-50 border-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the risk..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm min-h-[80px]"
                  required
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
                    <SelectTrigger className="bg-slate-50 border-slate-200">
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
                    Probability (1-5)
                  </label>
                  <Select
                    value={String(formData.probability)}
                    onValueChange={(value) => setFormData({ ...formData, probability: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <SelectItem key={v} value={String(v)}>{v} - {v === 1 ? 'Rare' : v === 2 ? 'Unlikely' : v === 3 ? 'Possible' : v === 4 ? 'Likely' : 'Almost Certain'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Impact (1-5)
                  </label>
                  <Select
                    value={String(formData.impact)}
                    onValueChange={(value) => setFormData({ ...formData, impact: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <SelectItem key={v} value={String(v)}>{v} - {v === 1 ? 'Negligible' : v === 2 ? 'Minor' : v === 3 ? 'Moderate' : v === 4 ? 'Major' : 'Severe'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <div className={`w-full p-3 rounded-lg text-center ${getRiskColor(
                    formData.probability * formData.impact >= 15 ? 'critical' :
                    formData.probability * formData.impact >= 10 ? 'high' :
                    formData.probability * formData.impact >= 5 ? 'medium' : 'low'
                  ).bg}`}>
                    <span className="text-xs font-heading uppercase">Risk Score</span>
                    <p className="text-2xl font-bold">{formData.probability * formData.impact}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Mitigation Plan
                </label>
                <textarea
                  value={formData.mitigation_plan}
                  onChange={(e) => setFormData({ ...formData, mitigation_plan: e.target.value })}
                  placeholder="How will this risk be prevented or reduced?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm min-h-[60px]"
                />
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Contingency Plan
                </label>
                <textarea
                  value={formData.contingency_plan}
                  onChange={(e) => setFormData({ ...formData, contingency_plan: e.target.value })}
                  placeholder="What actions will be taken if the risk occurs?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm min-h-[60px]"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase tracking-wider">
                Log Risk
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Risk Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-xs font-heading text-slate-500 uppercase">Critical</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{riskStats.critical}</p>
        </div>
        <div className="bg-white border border-orange-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs font-heading text-slate-500 uppercase">High</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{riskStats.high}</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <FileWarning className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs font-heading text-slate-500 uppercase">Medium</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{riskStats.medium}</p>
        </div>
        <div className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-heading text-slate-500 uppercase">Low</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{riskStats.low}</p>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-heading text-slate-500 uppercase">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{riskStats.avgScore}</p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-lg p-2">
        {[
          { id: 'gantt', label: 'Gantt Chart', icon: BarChart3 },
          { id: 'critical', label: 'Critical Path', icon: Route },
          { id: 'scenario', label: 'Scenario Planning', icon: Layers },
          { id: 'list', label: 'Risk List', icon: AlertTriangle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading uppercase transition-all ${
              viewMode === id 
                ? "bg-blue-600 text-white shadow-md" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ==================== GANTT CHART VIEW ==================== */}
      {viewMode === "gantt" && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Gantt Chart with Dependencies
            </h3>
            <p className="text-xs text-slate-500 mt-1">Tasks on critical path are highlighted in red • Hover for details</p>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Month Headers */}
              <div className="flex border-b border-slate-200">
                <div className="w-64 flex-shrink-0 p-3 bg-slate-50 font-heading text-xs uppercase text-slate-500 border-r border-slate-200">
                  Task Name
                </div>
                <div className="flex-1 flex">
                  {ganttConfig.months.map((month, idx) => (
                    <div 
                      key={idx} 
                      className="flex-1 p-3 text-center bg-slate-50 font-heading text-xs uppercase text-slate-600 border-r border-slate-100 last:border-r-0"
                    >
                      {month.name} {month.year}
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Rows */}
              {tasks.map((task, idx) => {
                const position = getTaskPosition(task);
                const taskRisks = risks.filter(r => r.affected_tasks?.includes(task.id));
                const hasRisk = taskRisks.length > 0;
                const highestRiskLevel = hasRisk ? 
                  taskRisks.reduce((max, r) => {
                    const levels = { critical: 4, high: 3, medium: 2, low: 1 };
                    return levels[r.level] > levels[max] ? r.level : max;
                  }, 'low') : null;

                return (
                  <div key={task.id} className={`flex border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${task.is_critical ? 'bg-red-50/30' : ''}`}>
                    <div className="w-64 flex-shrink-0 p-3 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                        {task.is_critical && (
                          <Zap className="w-3 h-3 text-red-500" title="Critical Path" />
                        )}
                        <span className={`text-sm ${task.is_critical ? 'font-medium text-red-700' : 'text-slate-700'}`}>
                          {task.name}
                        </span>
                        {hasRisk && (
                          <AlertTriangle className={`w-3 h-3 ${getRiskColor(highestRiskLevel).text}`} title={`${taskRisks.length} risks`} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{task.duration}d</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getStatusColor(task.status)} text-white`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {task.dependencies.length > 0 && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Link2 className="w-2.5 h-2.5" />
                            {task.dependencies.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 relative py-3 px-2">
                      {/* Grid lines for months */}
                      <div className="absolute inset-0 flex">
                        {ganttConfig.months.map((_, idx) => (
                          <div key={idx} className="flex-1 border-r border-slate-100 last:border-r-0" />
                        ))}
                      </div>
                      
                      {/* Task Bar */}
                      <div 
                        className="absolute top-3 h-8 rounded-md transition-all group cursor-pointer"
                        style={{
                          left: position.left,
                          width: position.width,
                        }}
                      >
                        <div className={`h-full rounded-md ${task.is_critical ? 'bg-red-500' : 'bg-blue-500'} relative overflow-hidden shadow-sm group-hover:shadow-md transition-shadow`}>
                          {/* Progress Fill */}
                          <div 
                            className={`h-full ${task.is_critical ? 'bg-red-600' : 'bg-blue-600'} transition-all`}
                            style={{ width: `${task.progress}%` }}
                          />
                          
                          {/* Label */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] text-white font-medium drop-shadow">
                              {task.progress}%
                            </span>
                          </div>
                        </div>

                        {/* Dependency Arrow Indicator */}
                        {task.dependencies.length > 0 && (
                          <div className="absolute -left-2 top-1/2 -translate-y-1/2">
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </div>
                        )}

                        {/* Tooltip */}
                        <div className="absolute left-0 top-full mt-2 bg-slate-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 min-w-[200px] shadow-xl pointer-events-none">
                          <p className="font-medium">{task.name}</p>
                          <p className="text-slate-300 mt-1">{task.start_date} → {task.end_date}</p>
                          <p className="text-slate-300">Duration: {task.duration} days</p>
                          {task.dependencies.length > 0 && (
                            <p className="text-slate-300 mt-1">
                              Depends on: {task.dependencies.map(d => tasks.find(t => t.id === d)?.name).join(', ')}
                            </p>
                          )}
                          {taskRisks.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-600">
                              <p className="text-amber-400">⚠ {taskRisks.length} Associated Risks:</p>
                              {taskRisks.map(r => (
                                <p key={r.id} className="text-slate-300 text-[10px]">• {r.title}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-3 bg-red-500 rounded" />
                <span className="text-xs text-slate-600">Critical Path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-3 bg-blue-500 rounded" />
                <span className="text-xs text-slate-600">Non-Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-red-500" />
                <span className="text-xs text-slate-600">On Critical Path</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-slate-600">Has Risks</span>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Total Project Duration: <span className="font-bold text-blue-600">{criticalPathDuration} days</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CRITICAL PATH VIEW ==================== */}
      {viewMode === "critical" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h3 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Route className="w-4 h-4 text-red-600" />
              Critical Path Analysis
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xs text-red-600 font-heading uppercase mb-1">Critical Path Duration</p>
                <p className="text-3xl font-bold text-red-700">{criticalPathDuration} Days</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-600 font-heading uppercase mb-1">Critical Tasks</p>
                <p className="text-3xl font-bold text-blue-700">{tasks.filter(t => t.is_critical).length} / {tasks.length}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs text-amber-600 font-heading uppercase mb-1">Risks on Critical Path</p>
                <p className="text-3xl font-bold text-amber-700">
                  {risks.filter(r => r.affected_tasks?.some(t => criticalPath.includes(t))).length}
                </p>
              </div>
            </div>

            {/* Critical Path Flow */}
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-heading text-slate-500 uppercase mb-4">Critical Path Flow</p>
              <div className="flex flex-wrap items-center gap-2">
                {tasks.filter(t => t.is_critical).map((task, idx, arr) => (
                  <React.Fragment key={task.id}>
                    <div className={`px-4 py-3 rounded-lg border-2 ${
                      task.status === 'completed' ? 'bg-green-100 border-green-300' :
                      task.status === 'in_progress' ? 'bg-blue-100 border-blue-300' :
                      'bg-red-50 border-red-300'
                    }`}>
                      <p className="text-sm font-medium text-slate-700">{task.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{task.duration} days • {task.progress}%</p>
                    </div>
                    {idx < arr.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Risks Affecting Critical Path */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h3 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Risks Impacting Critical Path
            </h3>
            <div className="space-y-3">
              {risks.filter(r => r.affected_tasks?.some(t => criticalPath.includes(t))).map(risk => {
                const colors = getRiskColor(risk.level);
                return (
                  <div key={risk.id} className={`border ${colors.border} rounded-lg p-4 ${colors.bg}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800">{risk.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{risk.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {risk.affected_tasks?.filter(t => criticalPath.includes(t)).map(taskId => {
                            const task = tasks.find(t => t.id === taskId);
                            return (
                              <span key={taskId} className="text-[10px] px-2 py-1 bg-white rounded border border-slate-200">
                                {task?.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-heading uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {risk.level}
                        </span>
                        <p className="text-2xl font-bold mt-2 text-slate-700">{risk.risk_score}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SCENARIO PLANNING VIEW ==================== */}
      {viewMode === "scenario" && (
        <div className="space-y-6">
          {/* Scenario Selector */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h3 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-purple-600" />
              Scenario Planning - Fire Station Shoes Project
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(scenarios).map(([key, scenario]) => (
                <button
                  key={key}
                  onClick={() => setSelectedScenario(key)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedScenario === key 
                      ? key === 'best' ? 'border-green-500 bg-green-50' :
                        key === 'worst' ? 'border-red-500 bg-red-50' :
                        key === 'conflict' ? 'border-purple-500 bg-purple-50' :
                        'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className={`text-xs font-heading uppercase ${
                    selectedScenario === key
                      ? key === 'best' ? 'text-green-600' :
                        key === 'worst' ? 'text-red-600' :
                        key === 'conflict' ? 'text-purple-600' :
                        'text-blue-600'
                      : 'text-slate-500'
                  }`}>
                    {scenario.name}
                  </p>
                  <p className="text-lg font-bold text-slate-700 mt-1">{scenario.probability}%</p>
                  <p className="text-xs text-slate-500">Probability</p>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Scenario Details */}
          <div className={`bg-white border-2 rounded-lg shadow-sm overflow-hidden ${
            selectedScenario === 'best' ? 'border-green-300' :
            selectedScenario === 'worst' ? 'border-red-300' :
            selectedScenario === 'conflict' ? 'border-purple-300' :
            'border-blue-300'
          }`}>
            <div className={`p-4 ${
              selectedScenario === 'best' ? 'bg-green-50' :
              selectedScenario === 'worst' ? 'bg-red-50' :
              selectedScenario === 'conflict' ? 'bg-purple-50' :
              'bg-blue-50'
            }`}>
              <h4 className="font-heading text-lg font-bold text-slate-800 uppercase">
                {scenarios[selectedScenario].name}
              </h4>
              <p className="text-sm text-slate-600 mt-1">{scenarios[selectedScenario].description}</p>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Calendar className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 font-heading uppercase">Expected Completion</p>
                  <p className="text-xl font-bold text-slate-700">{scenarios[selectedScenario].completion_date}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 font-heading uppercase">Budget Variance</p>
                  <p className={`text-xl font-bold ${
                    scenarios[selectedScenario].budget_variance < 0 ? 'text-green-600' :
                    scenarios[selectedScenario].budget_variance > 10 ? 'text-red-600' :
                    'text-amber-600'
                  }`}>
                    {scenarios[selectedScenario].budget_variance > 0 ? '+' : ''}{scenarios[selectedScenario].budget_variance}%
                  </p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Target className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 font-heading uppercase">Quality Score</p>
                  <p className={`text-xl font-bold ${
                    scenarios[selectedScenario].quality_score >= 90 ? 'text-green-600' :
                    scenarios[selectedScenario].quality_score >= 80 ? 'text-blue-600' :
                    'text-amber-600'
                  }`}>
                    {scenarios[selectedScenario].quality_score}/100
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs font-heading text-slate-500 uppercase mb-3">Key Assumptions</p>
                <ul className="space-y-2">
                  {scenarios[selectedScenario].assumptions.map((assumption, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <CircleDot className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        selectedScenario === 'best' ? 'text-green-500' :
                        selectedScenario === 'worst' ? 'text-red-500' :
                        selectedScenario === 'conflict' ? 'text-purple-500' :
                        'text-blue-500'
                      }`} />
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Scenario Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h4 className="font-heading text-sm font-bold text-slate-800 uppercase">Scenario Comparison</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 text-xs font-heading text-slate-500 uppercase">Metric</th>
                    <th className="text-center p-3 text-xs font-heading text-green-600 uppercase">Best</th>
                    <th className="text-center p-3 text-xs font-heading text-blue-600 uppercase">Expected</th>
                    <th className="text-center p-3 text-xs font-heading text-red-600 uppercase">Worst</th>
                    <th className="text-center p-3 text-xs font-heading text-purple-600 uppercase">Conflict</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="p-3 text-sm text-slate-600">Completion Date</td>
                    <td className="p-3 text-center text-sm font-medium text-green-700">{scenarios.best.completion_date}</td>
                    <td className="p-3 text-center text-sm font-medium text-blue-700">{scenarios.expected.completion_date}</td>
                    <td className="p-3 text-center text-sm font-medium text-red-700">{scenarios.worst.completion_date}</td>
                    <td className="p-3 text-center text-sm font-medium text-purple-700">{scenarios.conflict.completion_date}</td>
                  </tr>
                  <tr className="border-t border-slate-100 bg-slate-50/50">
                    <td className="p-3 text-sm text-slate-600">Budget Variance</td>
                    <td className="p-3 text-center text-sm font-medium text-green-700">{scenarios.best.budget_variance}%</td>
                    <td className="p-3 text-center text-sm font-medium text-blue-700">+{scenarios.expected.budget_variance}%</td>
                    <td className="p-3 text-center text-sm font-medium text-red-700">+{scenarios.worst.budget_variance}%</td>
                    <td className="p-3 text-center text-sm font-medium text-purple-700">+{scenarios.conflict.budget_variance}%</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-3 text-sm text-slate-600">Quality Score</td>
                    <td className="p-3 text-center text-sm font-medium text-green-700">{scenarios.best.quality_score}</td>
                    <td className="p-3 text-center text-sm font-medium text-blue-700">{scenarios.expected.quality_score}</td>
                    <td className="p-3 text-center text-sm font-medium text-red-700">{scenarios.worst.quality_score}</td>
                    <td className="p-3 text-center text-sm font-medium text-purple-700">{scenarios.conflict.quality_score}</td>
                  </tr>
                  <tr className="border-t border-slate-100 bg-slate-50/50">
                    <td className="p-3 text-sm text-slate-600">Probability</td>
                    <td className="p-3 text-center text-sm font-medium text-green-700">{scenarios.best.probability}%</td>
                    <td className="p-3 text-center text-sm font-medium text-blue-700">{scenarios.expected.probability}%</td>
                    <td className="p-3 text-center text-sm font-medium text-red-700">{scenarios.worst.probability}%</td>
                    <td className="p-3 text-center text-sm font-medium text-purple-700">{scenarios.conflict.probability}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== RISK LIST VIEW ==================== */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search risks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[150px] bg-white border-slate-200">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Risk Cards */}
          {filteredRisks.map((risk) => {
            const colors = getRiskColor(risk.level);
            const isExpanded = expandedRisk === risk.id;
            
            return (
              <div
                key={risk.id}
                className={`bg-white border ${colors.border} rounded-lg shadow-sm overflow-hidden transition-all`}
              >
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedRisk(isExpanded ? null : risk.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                        <AlertTriangle className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div>
                        <h3 className="text-slate-800 font-medium">{risk.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{risk.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-heading uppercase ${colors.bg} ${colors.text}`}>
                        {risk.level}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-mono bg-slate-100 text-slate-700">
                        Score: {risk.risk_score}
                      </span>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600">{risk.description}</p>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">P:</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(v => (
                          <div
                            key={v}
                            className={`w-4 h-4 rounded text-[9px] flex items-center justify-center ${
                              v <= risk.probability ? `${colors.bar} text-white` : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {v}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">I:</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(v => (
                          <div
                            key={v}
                            className={`w-4 h-4 rounded text-[9px] flex items-center justify-center ${
                              v <= risk.impact ? `${colors.bar} text-white` : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {v}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50 space-y-4">
                    {risk.mitigation_plan && (
                      <div>
                        <p className="text-xs font-heading text-slate-500 uppercase mb-2">Mitigation Plan</p>
                        <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">{risk.mitigation_plan}</p>
                      </div>
                    )}
                    
                    {risk.contingency_plan && (
                      <div>
                        <p className="text-xs font-heading text-slate-500 uppercase mb-2">Contingency Plan</p>
                        <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">{risk.contingency_plan}</p>
                      </div>
                    )}

                    {risk.triggers && risk.triggers.length > 0 && (
                      <div>
                        <p className="text-xs font-heading text-slate-500 uppercase mb-2">Risk Triggers</p>
                        <div className="flex flex-wrap gap-2">
                          {risk.triggers.map((trigger, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">
                              {trigger}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {risk.affected_tasks && risk.affected_tasks.length > 0 && (
                      <div>
                        <p className="text-xs font-heading text-slate-500 uppercase mb-2">Affected Tasks</p>
                        <div className="flex flex-wrap gap-2">
                          {risk.affected_tasks.map(taskId => {
                            const task = tasks.find(t => t.id === taskId);
                            return task ? (
                              <span key={taskId} className={`text-xs px-2 py-1 rounded ${
                                task.is_critical ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {task.name} {task.is_critical && '⚡'}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
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
                      >
                        <ArrowUp className="w-3 h-3 mr-1" />
                        Escalate
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredRisks.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No risks found matching your criteria</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}