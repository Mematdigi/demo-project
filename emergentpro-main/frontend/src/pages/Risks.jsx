import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import {
  AlertTriangle, Plus, Search, Shield, MoreVertical, TrendingUp,
  ArrowUp, LayoutGrid, List, Network, AlertOctagon, CheckCircle2,
  Siren, CornerDownRight, Activity
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";

const riskCategories = ["Technical", "Financial", "Supply Chain", "Administrative", "Environmental", "Security", "Operational"];

export default function Risks() {
  const { user } = useAuth();
  const [risks, setRisks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("matrix"); // matrix, list
  
  // Forms
  const [isRiskOpen, setIsRiskOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  
  const [riskForm, setRiskForm] = useState({
    project_id: "", title: "", description: "", category: "Technical",
    probability: 3, impact: 3, mitigation_plan: "", contingency_plan: "",
    related_dependencies: []
  });

  const [issueForm, setIssueForm] = useState({
    project_id: "", title: "", description: "", category: "Technical",
    severity: "medium", assigned_to: ""
  });

  useEffect(() => { fetchData(); }, []);

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
    } catch (error) { toast.error("Failed to load intelligence data"); } 
    finally { setLoading(false); }
  };

  // --- ACTIONS ---

  const handleCreateRisk = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/risks`, riskForm);
      toast.success("Risk Logged");
      setIsRiskOpen(false);
      fetchData();
      setRiskForm({
        project_id: "", title: "", description: "", category: "Technical",
        probability: 3, impact: 3, mitigation_plan: "", contingency_plan: "", related_dependencies: []
      });
    } catch (error) { toast.error("Failed to log risk"); }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/issues`, issueForm);
      toast.success("Issue Reported");
      setIsIssueOpen(false);
      fetchData();
    } catch (error) { toast.error("Failed to report issue"); }
  };

  const handleEscalateRisk = async (risk) => {
    try {
      await axios.post(`${API}/risks/${risk.id}/escalate`, { level: risk.escalation_level + 1, reason: "Manual Command Escalation" });
      toast.success("Risk Escalated to Command");
      fetchData();
    } catch (e) { toast.error("Escalation failed"); }
  };

  const handleResolveIssue = async (issueId) => {
    try {
      await axios.put(`${API}/issues/${issueId}`, { status: "resolved" });
      toast.success("Issue Resolved");
      fetchData();
    } catch (e) { toast.error("Update failed"); }
  };

  // --- HELPERS ---

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || "Unknown";
  
  const getRiskScoreColor = (score) => {
    if (score >= 15) return "bg-red-500 text-white";
    if (score >= 10) return "bg-orange-500 text-white";
    if (score >= 5) return "bg-amber-400 text-slate-900";
    return "bg-green-500 text-white";
  };

  // Dependency Mapping Logic
  const getAllDependencies = () => {
    let deps = [];
    projects.forEach(p => {
      if (p.dependencies) {
        p.dependencies.forEach(d => {
          // Check if this dependency has an active risk
          const linkedRisk = risks.find(r => r.related_dependencies?.includes(d.id));
          deps.push({
            ...d,
            project_name: p.name,
            project_id: p.id,
            risk_status: linkedRisk ? "at_risk" : "secure",
            linked_risk: linkedRisk
          });
        });
      }
    });
    return deps;
  };

  const allDependencies = getAllDependencies();

  // Matrix Data Gen
  const riskMatrix = [];
  for (let i = 5; i >= 1; i--) { // Impact
    for (let p = 1; p <= 5; p++) { // Probability
      riskMatrix.push({
        prob: p, impact: i,
        score: p * i,
        risks: risks.filter(r => r.probability === p && r.impact === i)
      });
    }
  }

  if (loading) return <div className="flex justify-center h-96 items-center text-blue-600 animate-pulse">Loading Intelligence...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase">Risk & Issue Intelligence</h1>
          <p className="text-slate-500 text-sm mt-1">Proactive Threat Management & Escalation Matrix</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="font-heading uppercase">
                <Siren className="w-4 h-4 mr-2" /> Report Issue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Report Operational Issue</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateIssue} className="space-y-4 mt-2">
                <Select onValueChange={v => setIssueForm({...issueForm, project_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Affected Project" /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Issue Title" onChange={e => setIssueForm({...issueForm, title: e.target.value})} required />
                <Select onValueChange={v => setIssueForm({...issueForm, severity: v})} defaultValue="medium">
                  <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">Escalate Issue</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isRiskOpen} onOpenChange={setIsRiskOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase">
                <Plus className="w-4 h-4 mr-2" /> Log Risk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Identify New Risk</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateRisk} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <Select onValueChange={v => setRiskForm({...riskForm, project_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
                    <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select onValueChange={v => setRiskForm({...riskForm, category: v})} defaultValue="Technical">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{riskCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input placeholder="Risk Title" onChange={e => setRiskForm({...riskForm, title: e.target.value})} required />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase text-slate-500">Probability (1-5)</label>
                    <Input type="number" min="1" max="5" value={riskForm.probability} onChange={e => setRiskForm({...riskForm, probability: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-slate-500">Impact (1-5)</label>
                    <Input type="number" min="1" max="5" value={riskForm.impact} onChange={e => setRiskForm({...riskForm, impact: parseInt(e.target.value)})} />
                  </div>
                </div>
                <Input placeholder="Mitigation Strategy" onChange={e => setRiskForm({...riskForm, mitigation_plan: e.target.value})} />
                <Button type="submit" className="w-full bg-blue-600 text-white">Log Risk</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="matrix"><LayoutGrid className="w-4 h-4 mr-2"/> Risk Matrix</TabsTrigger>
          <TabsTrigger value="issues"><Siren className="w-4 h-4 mr-2"/> Escalation Board</TabsTrigger>
          <TabsTrigger value="dependencies"><Network className="w-4 h-4 mr-2"/> Dependency Map</TabsTrigger>
        </TabsList>

        {/* 1. RISK MATRIX VIEW */}
        <TabsContent value="matrix" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Heatmap */}
            <div className="lg:col-span-2 bg-white border rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-heading text-sm font-bold uppercase">Probability × Impact Heatmap</h3>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Critical</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded-sm"></div> High</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-400 rounded-sm"></div> Medium</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Low</span>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col justify-center mr-2"><span className="text-xs font-bold uppercase -rotate-90">Impact</span></div>
                <div className="flex-1">
                  <div className="grid grid-cols-5 gap-1 mb-1">
                    {[1,2,3,4,5].map(p => <div key={p} className="text-center text-xs text-slate-400">{p}</div>)}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {riskMatrix.map((cell, idx) => (
                      <div key={idx} className={`aspect-square rounded border p-1 transition-all hover:scale-105 ${getRiskScoreColor(cell.score)} bg-opacity-90`}>
                        <div className="h-full flex flex-col items-center justify-center">
                          {cell.risks.length > 0 ? (
                            <>
                              <span className="text-lg font-bold">{cell.risks.length}</span>
                              <span className="text-[10px] opacity-80">risks</span>
                            </>
                          ) : <span className="text-xs opacity-30">{cell.score}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-xs font-bold uppercase mt-2">Probability</div>
                </div>
              </div>
            </div>

            {/* Top Risks List */}
            <div className="bg-white border rounded-lg p-5 shadow-sm overflow-y-auto max-h-[500px]">
              <h3 className="font-heading text-sm font-bold uppercase mb-4">Critical Threats</h3>
              <div className="space-y-3">
                {risks.filter(r => r.risk_score >= 10).sort((a,b) => b.risk_score - a.risk_score).map(risk => (
                  <div key={risk.id} className="p-3 border rounded-lg hover:bg-slate-50 transition-colors group relative">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getRiskScoreColor(risk.risk_score)}`}>
                        Score: {risk.risk_score}
                      </span>
                      {user?.role === 'admin' && (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEscalateRisk(risk)}>
                          <ArrowUp className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">{risk.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{getProjectName(risk.project_id)}</p>
                    
                    {risk.mitigation_plan && (
                      <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                        <strong>Mitigation:</strong> {risk.mitigation_plan}
                      </div>
                    )}
                  </div>
                ))}
                {risks.filter(r => r.risk_score >= 10).length === 0 && (
                  <div className="text-center py-8 text-slate-400">No critical threats detected</div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. ISSUE ESCALATION MATRIX */}
        <TabsContent value="issues" className="space-y-6">
          <div className="grid grid-cols-4 gap-4 h-[600px]">
            {['open', 'escalated_L1', 'escalated_L2', 'resolved'].map(status => (
              <div key={status} className="bg-slate-100 rounded-lg p-3 flex flex-col">
                <div className="flex justify-between items-center mb-3 px-1">
                  <h4 className="font-heading font-bold uppercase text-sm text-slate-600">
                    {status.replace('_', ' ')}
                  </h4>
                  <Badge variant="secondary">{issues.filter(i => (status === 'escalated_L1' ? i.escalation_level === 1 : status === 'escalated_L2' ? i.escalation_level === 2 : i.status === status)).length}</Badge>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3">
                  {issues.filter(i => {
                    if (status === 'open') return i.status === 'open' && i.escalation_level === 0;
                    if (status === 'escalated_L1') return i.escalation_level === 1 && i.status !== 'resolved';
                    if (status === 'escalated_L2') return i.escalation_level >= 2 && i.status !== 'resolved';
                    if (status === 'resolved') return i.status === 'resolved';
                    return false;
                  }).map(issue => (
                    <div key={issue.id} className="bg-white p-3 rounded shadow-sm border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                          issue.severity === 'critical' ? 'bg-red-100 text-red-700' : 
                          issue.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {issue.severity}
                        </span>
                        {issue.status !== 'resolved' && (
                          <Button size="icon" variant="ghost" className="h-5 w-5 text-green-600" onClick={() => handleResolveIssue(issue.id)}>
                            <CheckCircle2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 mb-1">{issue.title}</p>
                      <p className="text-xs text-slate-500 mb-2">{getProjectName(issue.project_id)}</p>
                      
                      {issue.escalated_to && (
                        <div className="flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          <CornerDownRight className="w-3 h-3" /> Escalated to Command
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 3. DEPENDENCY INTELLIGENCE */}
        <TabsContent value="dependencies" className="space-y-6">
          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <h3 className="font-heading text-sm font-bold uppercase mb-4">Critical Dependency Chain</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allDependencies.map((dep, idx) => (
                <div key={idx} className={`p-4 border rounded-lg relative overflow-hidden ${
                  dep.risk_status === 'at_risk' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
                }`}>
                  {dep.risk_status === 'at_risk' && (
                    <div className="absolute top-0 right-0 p-1 bg-red-100 text-red-600 rounded-bl-lg">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${dep.type === 'vendor' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      <Network className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{dep.description}</p>
                      <p className="text-xs text-slate-500 uppercase">{dep.type} Dependency</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Linked Project:</span>
                      <span className="font-medium">{dep.project_name}</span>
                    </div>
                    
                    {dep.linked_risk ? (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-xs font-bold text-red-700 uppercase mb-1 flex items-center gap-1">
                          <Activity className="w-3 h-3" /> Active Threat Detected
                        </p>
                        <p className="text-xs text-red-600 line-clamp-1">{dep.linked_risk.title}</p>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs font-bold text-green-600 uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Chain Secure
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {allDependencies.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  No dependencies mapped in active projects
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}