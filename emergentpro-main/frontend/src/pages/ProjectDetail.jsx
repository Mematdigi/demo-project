import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API } from "../App";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Calendar, IndianRupee, AlertTriangle, CheckCircle2,
  Clock, Target, Play, Pause, Plus, Link as LinkIcon, Network,
  Lock, Shield, Zap, TrendingUp, Shuffle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [program, setProgram] = useState(null);
  const [subProjects, setSubProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [risks, setRisks] = useState([]);
  const [budgetEntries, setBudgetEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [milestoneForm, setMilestoneForm] = useState({ name: "", date: "", status: "pending" });
  const [depForm, setDepForm] = useState({ type: "technical", description: "", id: "external" });
  const [subProjectForm, setSubProjectForm] = useState({ name: "", code: "", template: "IT", budget: 0 });
  const [scenarioForm, setScenarioForm] = useState({ name: "", end_date: "", budget: 0 });
  const [bufferForm, setBufferForm] = useState({ buffer_days: 0, contingency_budget: 0 });

  useEffect(() => { fetchProjectData(); }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes, risksRes, budgetRes, subProjectsRes] = await Promise.all([
        axios.get(`${API}/projects/${id}`),
        axios.get(`${API}/tasks?project_id=${id}`),
        axios.get(`${API}/risks?project_id=${id}`),
        axios.get(`${API}/budget?project_id=${id}`),
        axios.get(`${API}/projects?parent_project_id=${id}`)
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setRisks(risksRes.data);
      setBudgetEntries(budgetRes.data);
      setSubProjects(subProjectsRes.data);
      setBufferForm({ 
        buffer_days: projectRes.data.buffer_days || 0, 
        contingency_budget: projectRes.data.contingency_budget || 0 
      });

      if (projectRes.data.program_id) {
        const progRes = await axios.get(`${API}/programs/${projectRes.data.program_id}`);
        setProgram(progRes.data);
      }
    } catch (error) { toast.error("Failed to load project details"); } 
    finally { setLoading(false); }
  };

  const handleUpdateProject = async (updates) => {
    try {
      const res = await axios.put(`${API}/projects/${id}`, updates);
      setProject(res.data);
      toast.success("Project updated");
    } catch (e) { toast.error("Update failed"); }
  };

  const handleUpdateBuffers = async () => {
    await handleUpdateProject(bufferForm);
  };

  const handleAddScenario = async () => {
    try {
      await axios.post(`${API}/projects/${id}/scenarios`, scenarioForm);
      toast.success("Scenario created");
      fetchProjectData();
    } catch (e) { toast.error("Failed to create scenario"); }
  };

  const handleCreateSubProject = async () => {
    try {
      await axios.post(`${API}/projects`, {
        ...subProjectForm,
        program_id: project.program_id,
        parent_project_id: project.id,
        start_date: project.start_date,
        end_date: project.end_date,
        budget_allocated: parseFloat(subProjectForm.budget)
      });
      toast.success("Sub-project created");
      fetchProjectData();
    } catch (e) { toast.error("Failed to create sub-project"); }
  };

  const handleGoNoGo = async (status) => {
    try {
      await axios.post(`${API}/projects/${id}/go-no-go`, { status });
      toast.success(`Project marked as ${status.toUpperCase()}`);
      fetchProjectData();
    } catch (error) { toast.error("Failed to update status"); }
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    return `₹${(value || 0).toLocaleString()}`;
  };

  if (loading || !project) return <div className="flex justify-center h-96 items-center text-blue-600 animate-pulse">Loading Project...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link to="/projects" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-2"><ArrowLeft className="w-4 h-4" /> Back</Link>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase">{project.name}</h1>
          <p className="text-slate-500 text-sm mt-1 font-mono">{project.code} {program && `• ${program.name}`}</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right mr-2">
             <p className="text-xs text-slate-500 font-heading uppercase">Schedule Variance</p>
             <p className={`font-mono font-bold ${project.schedule_variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
               {project.schedule_variance > 0 ? '+' : ''}{project.schedule_variance}%
             </p>
           </div>
           <div className={`px-4 py-2 rounded-lg border font-bold ${project.health_score >= 80 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
             HS: {project.health_score}
           </div>
        </div>
      </div>

      <Tabs defaultValue="gantt" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="gantt"><Calendar className="w-4 h-4 mr-2"/> Schedule (Gantt)</TabsTrigger>
          <TabsTrigger value="scenarios"><Shuffle className="w-4 h-4 mr-2"/> Scenarios</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dependencies"><LinkIcon className="w-4 h-4 mr-2"/> Dependencies</TabsTrigger>
        </TabsList>

        {/* 1. GANTT CHART & CRITICAL PATH */}
        <TabsContent value="gantt" className="space-y-4">
          <div className="bg-white border rounded-lg p-5 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-sm font-bold uppercase">Master Schedule & Critical Path</h3>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Critical Path</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Standard Task</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Completed</div>
                <div className="flex items-center gap-1"><Lock className="w-3 h-3 text-amber-500"/> Classified</div>
              </div>
            </div>
            
            <GanttChart tasks={tasks} projectStart={project.start_date} projectEnd={project.end_date} />
            
            <div className="mt-6 p-4 bg-slate-50 border rounded-lg">
              <h4 className="text-xs font-heading font-bold uppercase text-slate-500 mb-2">Schedule Analysis</h4>
              <div className="flex gap-8">
                <div>
                  <span className="text-xs text-slate-500 block">Total Duration</span>
                  <span className="font-mono font-bold text-slate-800">
                    {Math.ceil((new Date(project.end_date) - new Date(project.start_date)) / (1000 * 60 * 60 * 24))} Days
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Buffer Remaining</span>
                  <span className="font-mono font-bold text-green-600">{project.buffer_days} Days</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Tasks on Critical Path</span>
                  <span className="font-mono font-bold text-red-600">
                    {tasks.filter(t => t.is_critical_path).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. SCENARIO PLANNING */}
        <TabsContent value="scenarios" className="space-y-4">
          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-heading text-sm font-bold uppercase">Scenario Planning</h3>
                <p className="text-sm text-slate-500">Simulate Best/Worst case outcomes</p>
              </div>
              <Dialog>
                <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Scenario</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create New Scenario</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-4">
                    <Input placeholder="Scenario Name (e.g., Budget Cut 10%)" value={scenarioForm.name} onChange={e => setScenarioForm({...scenarioForm, name: e.target.value})} />
                    <label className="text-xs text-slate-500">Projected End Date</label>
                    <Input type="date" value={scenarioForm.end_date} onChange={e => setScenarioForm({...scenarioForm, end_date: e.target.value})} />
                    <Input type="number" placeholder="Projected Budget" value={scenarioForm.budget} onChange={e => setScenarioForm({...scenarioForm, budget: parseFloat(e.target.value)})} />
                    <Button onClick={handleAddScenario} className="w-full">Simulate</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Baseline Card */}
              <div className="border-2 border-blue-100 bg-blue-50/50 rounded-lg p-4 relative">
                <span className="absolute top-2 right-2 text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-bold uppercase">Baseline</span>
                <h4 className="font-bold text-slate-800 mb-2">Current Plan</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>End:</span> <span className="font-mono">{project.end_date}</span></div>
                  <div className="flex justify-between"><span>Budget:</span> <span className="font-mono">{formatCurrency(project.budget_allocated)}</span></div>
                </div>
              </div>

              {/* Scenarios */}
              {project.scenarios?.map((scenario, i) => (
                <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-slate-800 mb-2">{scenario.name}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>End:</span> 
                      <span className={`font-mono ${new Date(scenario.end_date) > new Date(project.end_date) ? 'text-red-600' : 'text-green-600'}`}>
                        {scenario.end_date}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Budget:</span> 
                      <span className={`font-mono ${scenario.budget > project.budget_allocated ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(scenario.budget)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 3. OVERVIEW (BUFFER & CONTINGENCY) */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="font-heading text-sm font-bold uppercase">Phase Gate & Status</h3>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-slate-100 rounded text-sm uppercase">Phase: {project.phase}</span>
                <span className={`px-3 py-1 rounded text-sm uppercase ${project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`}>{project.status}</span>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={() => handleGoNoGo('go')} className="bg-green-600 hover:bg-green-700 w-full"><Play className="w-4 h-4 mr-2"/> GO</Button>
                <Button onClick={() => handleGoNoGo('no_go')} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 w-full"><Pause className="w-4 h-4 mr-2"/> NO-GO</Button>
              </div>
            </div>
            
            {/* Buffer Management */}
            <div className="bg-white border rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-heading text-sm font-bold uppercase">Buffers & Reserves</h3>
                <Button size="sm" variant="ghost" onClick={handleUpdateBuffers}><CheckCircle2 className="w-4 h-4 text-green-600"/></Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase">Schedule Buffer (Days)</label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400"/>
                    <Input 
                      type="number" 
                      value={bufferForm.buffer_days} 
                      onChange={e => setBufferForm({...bufferForm, buffer_days: parseInt(e.target.value)})}
                      className="h-8 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Contingency Budget (₹)</label>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400"/>
                    <Input 
                      type="number" 
                      value={bufferForm.contingency_budget} 
                      onChange={e => setBufferForm({...bufferForm, contingency_budget: parseFloat(e.target.value)})}
                      className="h-8 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dependencies">
          <div className="bg-white border rounded-lg p-5 shadow-sm">
             <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-sm font-bold uppercase">Dependency Mapping</h3>
              <p className="text-xs text-slate-500">External factors blocking project execution</p>
            </div>
            <div className="space-y-2">
              {project.dependencies?.map((dep, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50">
                  <div className={`p-2 rounded ${dep.type === 'vendor' ? 'bg-amber-100 text-amber-700' : dep.type === 'approval' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {dep.type === 'vendor' ? <Network className="w-4 h-4" /> : dep.type === 'approval' ? <Shield className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{dep.description}</p>
                    <p className="text-xs text-slate-500 uppercase">{dep.type} Dependency</p>
                  </div>
                </div>
              ))}
              {(!project.dependencies || project.dependencies.length === 0) && <div className="text-center py-8 text-slate-400">No dependencies mapped</div>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- CUSTOM GANTT CHART COMPONENT ---
const GanttChart = ({ tasks, projectStart, projectEnd }) => {
  const startDate = new Date(projectStart);
  const endDate = new Date(projectEnd);
  const totalDuration = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const pxPerDay = 40; // Scale

  return (
    <div className="overflow-x-auto border-t border-slate-100 relative">
      <div className="min-w-full relative" style={{ width: `${totalDuration * pxPerDay + 200}px` }}>
        
        {/* Timeline Header */}
        <div className="flex border-b h-10 bg-slate-50 sticky top-0 z-10">
          <div className="w-48 flex-shrink-0 border-r p-2 text-xs font-bold text-slate-600 bg-slate-50 sticky left-0 z-20">Task Name</div>
          {Array.from({ length: Math.ceil(totalDuration / 7) }).map((_, i) => (
            <div key={i} className="border-r text-[10px] text-slate-400 p-1 truncate" style={{ width: `${pxPerDay * 7}px` }}>
              Wk {i + 1}
            </div>
          ))}
        </div>

        {/* Task Rows */}
        <div className="relative">
          {tasks.map((task) => {
            const taskStart = new Date(task.start_date);
            const taskEnd = new Date(task.end_date);
            const duration = (taskEnd - taskStart) / (1000 * 60 * 60 * 24);
            const offset = (taskStart - startDate) / (1000 * 60 * 60 * 24);
            
            return (
              <div key={task.id} className="flex border-b h-12 hover:bg-slate-50 group">
                <div className="w-48 flex-shrink-0 border-r p-2 text-xs flex flex-col justify-center sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                  <span className="font-medium truncate">{task.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{task.start_date}</span>
                </div>
                <div className="relative flex-grow">
                  {/* Grid Lines */}
                  {Array.from({ length: Math.ceil(totalDuration / 7) }).map((_, i) => (
                    <div key={i} className="absolute h-full border-r border-slate-50" style={{ left: `${i * pxPerDay * 7}px`, width: `${pxPerDay * 7}px` }} />
                  ))}
                  
                  {/* Task Bar */}
                  <div 
                    className={`absolute top-3 h-6 rounded-md shadow-sm flex items-center px-2 text-[10px] text-white whitespace-nowrap transition-all hover:brightness-110 cursor-pointer
                      ${task.is_critical_path ? 'bg-red-500 ring-2 ring-red-200' : task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}
                    `}
                    style={{ 
                      left: `${offset * pxPerDay}px`, 
                      width: `${Math.max(duration * pxPerDay, 40)}px` 
                    }}
                    title={`${task.name} (${duration} days)`}
                  >
                    {task.clearance_level === 'top_secret' && <Lock className="w-3 h-3 mr-1" />}
                    <span className="truncate">{task.progress}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};