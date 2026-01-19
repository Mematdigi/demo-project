import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  IndianRupee,
  Boxes,
  FolderKanban,
  ListTodo,
  Users,
  Activity,
  ChevronRight,
  ArrowUpRight,
  FileCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { Progress } from "../components/ui/progress";

const statusColors = {
  planning: "#3b82f6",
  in_progress: "#06b6d4",
  on_hold: "#f59e0b",
  completed: "#10b981",
  cancelled: "#ef4444"
};

const riskColors = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444"
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [projects, setProjects] = useState([]);
  const [risks, setRisks] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, programsRes, projectsRes, risksRes, approvalsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/programs`),
        axios.get(`${API}/projects`),
        axios.get(`${API}/risks`),
        axios.get(`${API}/approvals?status=pending`)
      ]);
      setStats(statsRes.data);
      setPrograms(programsRes.data);
      setProjects(projectsRes.data);
      setRisks(risksRes.data);
      setApprovals(approvalsRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-blue-600 font-heading text-lg uppercase tracking-wider animate-pulse">
          Loading Command Data...
        </div>
      </div>
    );
  }

  const budgetData = [
    { month: 'Jan', planned: 120, actual: 100 },
    { month: 'Feb', planned: 250, actual: 220 },
    { month: 'Mar', planned: 380, actual: 350 },
    { month: 'Apr', planned: 520, actual: 480 },
    { month: 'May', planned: 680, actual: 620 },
    { month: 'Jun', planned: 850, actual: 780 },
  ];

  const projectStatusData = Object.entries(stats?.projects?.status_breakdown || {}).map(([key, value]) => ({
    name: key.replace('_', ' ').toUpperCase(),
    value,
    color: statusColors[key]
  }));

  const riskData = Object.entries(stats?.risks || {}).map(([key, value]) => ({
    name: key.toUpperCase(),
    value,
    color: riskColors[key]
  }));

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase tracking-wide">
            Command Centre
          </h1>
          <p className="text-slate-500 text-sm mt-1">Portfolio health overview and operational status</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-700 font-heading tracking-wider">ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          label="Active Programmes"
          value={stats?.counts?.programs || 0}
          icon={Boxes}
          trend="+2"
          trendUp={true}
        />
        <KPICard
          label="Projects"
          value={stats?.counts?.projects || 0}
          icon={FolderKanban}
          trend="+5"
          trendUp={true}
        />
        <KPICard
          label="Active Tasks"
          value={stats?.counts?.tasks || 0}
          icon={ListTodo}
          trend="-3"
          trendUp={false}
        />
        <KPICard
          label="Resources"
          value={stats?.counts?.resources || 0}
          icon={Users}
        />
        <KPICard
          label="Pending Approvals"
          value={stats?.counts?.pending_approvals || 0}
          icon={FileCheck}
          highlight={true}
        />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Budget Overview */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">
              Budget Utilisation
            </h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-200 rounded-sm" />
                <span className="text-slate-500">Planned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                <span className="text-slate-500">Actual</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">Total Budget</p>
              <p className="text-2xl font-heading font-bold text-slate-800">{formatCurrency(stats?.projects?.total_budget || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">Spent</p>
              <p className="text-2xl font-heading font-bold text-blue-600">{formatCurrency(stats?.projects?.total_spent || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">Utilisation</p>
              <p className="text-2xl font-heading font-bold text-slate-800">{stats?.projects?.budget_utilization || 0}%</p>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={budgetData}>
                <defs>
                  <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}Cr`} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                  }}
                  labelStyle={{ color: '#64748b' }}
                />
                <Area type="monotone" dataKey="planned" stroke="#93c5fd" strokeOpacity={0.8} fillOpacity={1} fill="url(#colorPlanned)" />
                <Area type="monotone" dataKey="actual" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActual)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Health */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h2 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
            Portfolio Health
          </h2>
          
          <div className="flex items-center justify-center mb-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
              (stats?.projects?.avg_health_score || 0) >= 80 ? 'border-green-500 text-green-600 bg-green-50' :
              (stats?.projects?.avg_health_score || 0) >= 60 ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
              'border-red-500 text-red-600 bg-red-50'
            }`}>
              <span className="font-heading text-3xl font-bold">{stats?.projects?.avg_health_score || 0}</span>
            </div>
          </div>
          
          <p className="text-center text-sm text-slate-500 mb-6">Average Health Score</p>
          
          <div className="space-y-3">
            {projects.slice(0, 4).map((project) => (
              <div key={project.id} className="flex items-center justify-between">
                <span className="text-xs text-slate-600 truncate max-w-[140px]">{project.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16">
                    <Progress 
                      value={project.health_score} 
                      className="h-1.5 bg-slate-100"
                    />
                  </div>
                  <span className={`text-xs font-mono ${
                    project.health_score >= 80 ? 'text-green-600' :
                    project.health_score >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {project.health_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Project Status */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h2 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
            Project Status
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {projectStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-500">{item.name}</span>
                <span className="text-xs font-mono text-slate-700 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">
              Risk Matrix
            </h2>
            <Link to="/risks" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={60} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#ffffff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-700">
                {(stats?.risks?.critical || 0) + (stats?.risks?.high || 0)} high-priority risks require attention
              </span>
            </div>
          </div>
        </div>

        {/* Active Programs */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider">
              Active Programmes
            </h2>
            <Link to="/programs" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {programs.slice(0, 4).map((program) => (
              <div key={program.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-200 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-slate-800 font-medium truncate max-w-[180px]">{program.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{program.code}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-heading uppercase ${
                    program.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    program.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {program.status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Budget: {formatCurrency(program.budget_total)}</span>
                  <span className={`font-mono ${
                    program.health_score >= 80 ? 'text-green-600' :
                    program.health_score >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    HS: {program.health_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Risks & Issues */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Critical Risks & Issues
        </h2>
        <div className="space-y-3">
          {risks.filter(r => r.level === 'critical' || r.level === 'high').slice(0, 5).map((risk) => (
            <div key={risk.id} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                risk.level === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-800">{risk.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-heading uppercase flex-shrink-0 ${
                    risk.level === 'critical' ? 'bg-red-100 text-red-700 border border-red-200' : 
                    'bg-orange-100 text-orange-700 border border-orange-200'
                  }`}>
                    {risk.level}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{risk.category} • Score: {risk.risk_score}</p>
              </div>
            </div>
          ))}
          {risks.filter(r => r.level === 'critical' || r.level === 'high').length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">No critical risks at this time</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// KPI Card Component
const KPICard = ({ label, value, icon: Icon, trend, trendUp, highlight }) => (
  <div className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
    highlight ? 'border-amber-300 bg-amber-50' : 'border-slate-200'
  }`}>
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        highlight ? 'bg-amber-100' : 'bg-blue-50'
      }`}>
        <Icon className={`w-5 h-5 ${highlight ? 'text-amber-600' : 'text-blue-600'}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
    <div className="mt-3">
      <p className={`text-3xl font-heading font-bold ${highlight ? 'text-amber-700' : 'text-slate-800'}`}>{value}</p>
      <p className="text-xs text-slate-500 font-heading uppercase tracking-wider mt-1">{label}</p>
    </div>
  </div>
);
