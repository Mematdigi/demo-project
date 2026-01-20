import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import {
  ListTodo, Plus, Search, ChevronDown, ChevronRight,
  Clock, CheckCircle2, AlertCircle, Pause, MoreVertical,
  Shield, Radio, CheckSquare, CornerDownRight, Wifi, WifiOff
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedTasks, setExpandedTasks] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false); // Simulate Offline Mode

  const [formData, setFormData] = useState({
    project_id: "", wbs_code: "", name: "", description: "",
    priority: "medium", start_date: "", end_date: "",
    estimated_hours: 0, assigned_unit: "", acceptance_criteria: "",
    classification: "public"
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        axios.get(`${API}/tasks`),
        axios.get(`${API}/projects`)
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      // Auto-expand top level tasks
      const initialExpand = {};
      tasksRes.data.forEach(t => { if (!t.parent_task_id) initialExpand[t.id] = true; });
      setExpandedTasks(initialExpand);
    } catch (error) { toast.error("Failed to load tasks"); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tasks`, formData);
      toast.success("Task order created successfully");
      setIsDialogOpen(false);
      fetchData();
      setFormData({
        project_id: "", wbs_code: "", name: "", description: "",
        priority: "medium", start_date: "", end_date: "",
        estimated_hours: 0, assigned_unit: "", acceptance_criteria: "",
        classification: "public"
      });
    } catch (error) { toast.error("Failed to create task"); }
  };

  // --- WORKFLOW ACTIONS ---
  const handleAcceptTask = async (taskId) => {
    try {
      await axios.post(`${API}/tasks/${taskId}/accept`, { status: "accepted" });
      toast.success("Task Accepted & Started");
      fetchData();
    } catch (e) { toast.error("Acceptance failed"); }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      // Logic: Move to 'review' for manager to close, or 'completed' if self-closing
      await axios.put(`${API}/tasks/${taskId}`, { status: "review", progress: 100 });
      toast.success("Submitted for Review");
      fetchData();
    } catch (e) { toast.error("Update failed"); }
  };

  const handleVerifyClose = async (taskId) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, { 
        status: "completed", 
        closure_notes: "Verified and closed by Command." 
      });
      toast.success("Task Verified & Closed");
      fetchData();
    } catch (e) { toast.error("Closure failed"); }
  };

  const toggleExpand = (taskId) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Helper: Hierarchical Sort
  const getSortedTasks = () => {
    // Simple sort by WBS code to keep 1.1 near 1.1.1
    return [...tasks].sort((a, b) => a.wbs_code.localeCompare(b.wbs_code, undefined, { numeric: true }));
  };

  const filteredTasks = getSortedTasks().filter(t =>
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.wbs_code.includes(searchTerm)) &&
    (statusFilter === "all" || t.status === statusFilter)
  );

  // Helper: Get visual indentation based on WBS level
  const getIndent = (level) => (level - 1) * 24; 

  if (loading) return <div className="flex justify-center h-96 items-center text-blue-600 animate-pulse">Loading Operations...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase">Work Breakdown Structure</h1>
          <p className="text-slate-500 text-sm mt-1">Operational Task Orders & Status</p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Offline Mode Toggle (Simulation) */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg cursor-pointer" onClick={() => setIsOffline(!isOffline)}>
            {isOffline ? <WifiOff className="w-4 h-4 text-slate-400"/> : <Wifi className="w-4 h-4 text-green-600"/>}
            <span className="text-xs font-bold text-slate-600 uppercase">{isOffline ? "Offline Mode" : "System Online"}</span>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase">
                <Plus className="w-4 h-4 mr-2" /> Create Task Order
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white max-w-2xl">
              <DialogHeader><DialogTitle>Issue New Task Order</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-heading text-slate-500 uppercase">Project</label>
                    <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select Project" /></SelectTrigger>
                      <SelectContent className="bg-white">{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-heading text-slate-500 uppercase">WBS Code</label>
                    <Input value={formData.wbs_code} onChange={e => setFormData({...formData, wbs_code: e.target.value})} placeholder="e.g., 1.2.1" className="font-mono"/>
                  </div>
                </div>
                
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Task Name" required />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-heading text-slate-500 uppercase">Classification</label>
                    <Select value={formData.classification} onValueChange={(v) => setFormData({...formData, classification: v})}>
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
                    <label className="text-xs font-heading text-slate-500 uppercase">Assigned Unit</label>
                    <Input value={formData.assigned_unit} onChange={e => setFormData({...formData, assigned_unit: e.target.value})} placeholder="e.g. Bravo Squad" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
                  <Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} required />
                </div>

                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm" 
                  placeholder="Acceptance Criteria (Definition of Done)" 
                  rows={2} 
                  value={formData.acceptance_criteria}
                  onChange={e => setFormData({...formData, acceptance_criteria: e.target.value})}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 text-white">Issue Order</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search WBS or Task..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">Pending Acceptance</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="review">Under Review</SelectItem>
            <SelectItem value="completed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* WBS Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="tactical-table">
          <thead>
            <tr>
              <th className="w-24">WBS</th>
              <th>Task Details</th>
              <th>Classification</th>
              <th>Assigned Unit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => {
              const isParent = tasks.some(t => t.parent_task_id === task.id);
              return (
                <tr key={task.id} className="group hover:bg-slate-50">
                  <td className="font-mono text-xs text-slate-500 align-top pt-4">
                    <div style={{ marginLeft: `${getIndent(task.wbs_level)}px` }} className="flex items-center">
                      {task.wbs_level > 1 && <CornerDownRight className="w-3 h-3 text-slate-300 mr-1" />}
                      {task.wbs_code}
                    </div>
                  </td>
                  
                  <td className="py-3">
                    <div style={{ marginLeft: `${getIndent(task.wbs_level)}px` }}>
                      <p className={`font-medium ${task.wbs_level === 1 ? 'text-slate-800 text-base uppercase' : 'text-slate-700 text-sm'}`}>
                        {task.name}
                      </p>
                      {task.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</p>}
                      
                      {/* Acceptance Criteria Badge */}
                      {task.acceptance_criteria && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded border border-blue-100">
                          <CheckSquare className="w-3 h-3" /> Criteria Defined
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    {task.classification && task.classification !== 'public' && (
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${
                        task.classification === 'top_secret' ? 'text-red-700 border-red-200 bg-red-50' :
                        task.classification === 'secret' ? 'text-amber-700 border-amber-200 bg-amber-50' :
                        'text-blue-700 border-blue-200 bg-blue-50'
                      }`}>
                        <Shield className="w-3 h-3" /> {task.classification.replace('_', ' ')}
                      </span>
                    )}
                  </td>

                  <td className="text-sm text-slate-600">
                    {task.assigned_unit || <span className="text-slate-400 italic">Unassigned</span>}
                  </td>

                  <td>
                    <span className={`px-2 py-1 rounded text-[10px] font-heading uppercase ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'review' ? 'bg-purple-100 text-purple-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {task.status?.replace('_', ' ')}
                    </span>
                  </td>

                  <td>
                    {/* WORKFLOW BUTTONS */}
                    <div className="flex gap-2">
                      {/* 1. Accept Task */}
                      {task.status === 'todo' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => handleAcceptTask(task.id)}>
                          <Radio className="w-3 h-3 mr-1" /> Accept
                        </Button>
                      )}

                      {/* 2. Complete Task */}
                      {task.status === 'in_progress' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs border-green-200 text-green-600 hover:bg-green-50" onClick={() => handleCompleteTask(task.id)}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                        </Button>
                      )}

                      {/* 3. Verify & Close (Admin Only ideally, but open for demo) */}
                      {task.status === 'review' && (
                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => handleVerifyClose(task.id)}>
                          Verify & Close
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTasks.length === 0 && <div className="p-8 text-center text-slate-500">No tasks found</div>}
      </div>
    </div>
  );
}