import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import {
  ListTodo,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  MoreVertical
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
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

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [expandedTasks, setExpandedTasks] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    project_id: "",
    wbs_code: "",
    name: "",
    description: "",
    priority: "medium",
    start_date: "",
    end_date: "",
    estimated_hours: 0,
    assigned_to: [],
    assigned_unit: "",
    acceptance_criteria: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        axios.get(`${API}/tasks`),
        axios.get(`${API}/projects`)
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tasks`, formData);
      toast.success("Task created successfully");
      setIsDialogOpen(false);
      fetchData();
      setFormData({
        project_id: "",
        wbs_code: "",
        name: "",
        description: "",
        priority: "medium",
        start_date: "",
        end_date: "",
        estimated_hours: 0,
        assigned_to: [],
        assigned_unit: "",
        acceptance_criteria: ""
      });
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, { status });
      toast.success("Task updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const toggleExpand = (taskId) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Unknown";
  };

  const getProjectCode = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.code || "";
  };

  const getChildTasks = (parentTaskId) => {
    return tasks.filter(t => t.parent_task_id === parentTaskId);
  };

  const getTopLevelTasks = () => {
    return tasks.filter(t => !t.parent_task_id);
  };

  const filteredTasks = getTopLevelTasks().filter(t =>
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.wbs_code.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "all" || t.status === statusFilter) &&
    (projectFilter === "all" || t.project_id === projectFilter)
  );

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    completed: tasks.filter(t => t.status === 'completed'),
    blocked: tasks.filter(t => t.status === 'blocked')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-blue-600 font-heading text-lg uppercase tracking-wider animate-pulse">
          Loading Tasks...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="tasks-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase tracking-wide">
            Tasks & WBS
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {tasks.length} total tasks across all projects
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase tracking-wider" data-testid="create-task-btn">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-slate-800 uppercase tracking-wider">
                Create New Task
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
                  <SelectTrigger className="bg-slate-50 border-slate-200" data-testid="task-project-select">
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
                    WBS Code
                  </label>
                  <Input
                    value={formData.wbs_code}
                    onChange={(e) => setFormData({ ...formData, wbs_code: e.target.value })}
                    className="bg-slate-50 border-slate-200 font-mono"
                    placeholder="1.2.3"
                    required
                    data-testid="task-wbs-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Task Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-50 border-slate-200"
                  placeholder="Site Survey - Northern Sector"
                  required
                  data-testid="task-name-input"
                />
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
                  data-testid="task-description-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Estimated Hours
                  </label>
                  <Input
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                    className="bg-slate-50 border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Assigned Unit
                  </label>
                  <Input
                    value={formData.assigned_unit}
                    onChange={(e) => setFormData({ ...formData, assigned_unit: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    placeholder="Engineering Division"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Acceptance Criteria
                </label>
                <textarea
                  value={formData.acceptance_criteria}
                  onChange={(e) => setFormData({ ...formData, acceptance_criteria: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Define completion criteria..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="submit-task-btn">
                  Create Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search tasks or WBS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200"
            data-testid="search-tasks-input"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { status: 'todo', label: 'To Do', icon: Clock, color: 'slate' },
          { status: 'in_progress', label: 'In Progress', icon: Clock, color: 'blue' },
          { status: 'review', label: 'Review', icon: AlertCircle, color: 'amber' },
          { status: 'completed', label: 'Completed', icon: CheckCircle2, color: 'green' },
          { status: 'blocked', label: 'Blocked', icon: Pause, color: 'red' },
        ].map(({ status, label, icon: Icon, color }) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`bg-white border rounded-lg p-3 text-left transition-all shadow-sm hover:shadow ${
              statusFilter === status ? `border-${color}-400 ring-2 ring-${color}-100` : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 text-${color}-600`} />
              <span className="text-xs text-slate-500 font-heading uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-xl font-heading font-bold text-slate-800">
              {tasksByStatus[status]?.length || 0}
            </p>
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="tactical-table">
          <thead>
            <tr>
              <th className="w-8"></th>
              <th>WBS</th>
              <th>Task</th>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Progress</th>
              <th>Due</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => {
              const childTasks = getChildTasks(task.id);
              const hasChildren = childTasks.length > 0;
              const isExpanded = expandedTasks[task.id];

              return (
                <React.Fragment key={task.id}>
                  <tr className="group" data-testid={`task-row-${task.id}`}>
                    <td className="w-8">
                      {hasChildren && (
                        <button onClick={() => toggleExpand(task.id)} className="text-slate-400 hover:text-slate-700">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                    <td className="font-mono text-xs text-slate-500">{task.wbs_code}</td>
                    <td>
                      <p className="text-slate-800 text-sm font-medium">{task.name}</p>
                      {task.description && (
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{task.description}</p>
                      )}
                    </td>
                    <td>
                      <p className="text-xs text-slate-600">{getProjectName(task.project_id)}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{getProjectCode(task.project_id)}</p>
                    </td>
                    <td>
                      <Select
                        value={task.status}
                        onValueChange={(value) => updateTaskStatus(task.id, value)}
                      >
                        <SelectTrigger className={`w-[110px] h-7 text-[10px] font-heading uppercase border-0 ${
                          task.status === 'completed' ? 'bg-green-100 text-green-700' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          task.status === 'blocked' ? 'bg-red-100 text-red-700' :
                          task.status === 'review' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-heading uppercase ${
                        task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Progress value={task.progress} className="h-1.5 w-12 bg-slate-100" />
                        <span className="text-xs font-mono text-slate-600">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="text-slate-500 text-xs font-mono">{task.end_date}</td>
                    <td>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-slate-400">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                  {/* Child tasks */}
                  {hasChildren && isExpanded && childTasks.map((child) => (
                    <tr key={child.id} className="bg-slate-50/50">
                      <td></td>
                      <td className="font-mono text-xs text-slate-400 pl-4">{child.wbs_code}</td>
                      <td>
                        <p className="text-slate-700 text-sm pl-4">{child.name}</p>
                      </td>
                      <td></td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-heading uppercase ${
                          child.status === 'completed' ? 'bg-green-100 text-green-700' :
                          child.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {child.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-heading uppercase ${
                          child.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          child.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {child.priority}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Progress value={child.progress} className="h-1 w-10 bg-slate-100" />
                          <span className="text-[10px] font-mono text-slate-500">{child.progress}%</span>
                        </div>
                      </td>
                      <td className="text-slate-400 text-xs font-mono">{child.end_date}</td>
                      <td></td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <ListTodo className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
}
