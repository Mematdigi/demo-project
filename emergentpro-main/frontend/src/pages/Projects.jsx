import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Link, useSearchParams } from "react-router-dom";
import {
  FolderKanban,
  Plus,
  Search,
  Grid,
  List,
  Calendar,
  IndianRupee,
  AlertCircle,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Filter
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";

const projectTemplates = [
  { value: "R&D", label: "R&D" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Weapon Systems", label: "Weapon Systems" },
  { value: "IT", label: "IT" },
  { value: "Logistics", label: "Logistics" }
];

export default function Projects() {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState(searchParams.get('program') || "all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    program_id: "",
    name: "",
    code: "",
    description: "",
    template: "IT",
    start_date: "",
    end_date: "",
    budget_allocated: 0,
    buffer_days: 0,
    contingency_budget: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, programsRes] = await Promise.all([
        axios.get(`${API}/projects`),
        axios.get(`${API}/programs`)
      ]);
      setProjects(projectsRes.data);
      setPrograms(programsRes.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/projects`, formData);
      toast.success("Project created successfully");
      setIsDialogOpen(false);
      fetchData();
      setFormData({
        program_id: "",
        name: "",
        code: "",
        description: "",
        template: "IT",
        start_date: "",
        end_date: "",
        budget_allocated: 0,
        buffer_days: 0,
        contingency_budget: 0
      });
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await axios.delete(`${API}/projects/${projectId}`);
        toast.success("Project deleted");
        fetchData();
      } catch (error) {
        toast.error("Failed to delete project");
      }
    }
  };

  const getProgramName = (programId) => {
    const program = programs.find(p => p.id === programId);
    return program?.name || "Unknown";
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  const filteredProjects = projects.filter(p =>
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "all" || p.status === statusFilter) &&
    (programFilter === "all" || p.program_id === programFilter)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-blue-600 font-heading text-lg uppercase tracking-wider animate-pulse">
          Loading Projects...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="projects-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase tracking-wide">
            Projects
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {projects.length} total projects across {programs.length} programmes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase tracking-wider" data-testid="create-project-btn">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-slate-800 uppercase tracking-wider">
                Create New Project
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Programme
                </label>
                <Select
                  value={formData.program_id}
                  onValueChange={(value) => setFormData({ ...formData, program_id: value })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200" data-testid="project-program-select">
                    <SelectValue placeholder="Select programme" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Project Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    placeholder="Radar Integration Phase 1"
                    required
                    data-testid="project-name-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Project Code
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="bg-slate-50 border-slate-200 font-mono"
                    placeholder="ADS-RAD-001"
                    required
                    data-testid="project-code-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Template
                </label>
                <Select
                  value={formData.template}
                  onValueChange={(value) => setFormData({ ...formData, template: value })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200" data-testid="project-template-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {projectTemplates.map((template) => (
                      <SelectItem key={template.value} value={template.value}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Integration of coastal radar systems into unified network"
                  rows={3}
                  data-testid="project-description-input"
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
                    data-testid="project-start-date-input"
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
                    data-testid="project-end-date-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Budget (₹)
                  </label>
                  <Input
                    type="number"
                    value={formData.budget_allocated}
                    onChange={(e) => setFormData({ ...formData, budget_allocated: parseFloat(e.target.value) })}
                    className="bg-slate-50 border-slate-200 font-mono"
                    data-testid="project-budget-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Buffer Days
                  </label>
                  <Input
                    type="number"
                    value={formData.buffer_days}
                    onChange={(e) => setFormData({ ...formData, buffer_days: parseInt(e.target.value) })}
                    className="bg-slate-50 border-slate-200 font-mono"
                    data-testid="project-buffer-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Contingency (₹)
                  </label>
                  <Input
                    type="number"
                    value={formData.contingency_budget}
                    onChange={(e) => setFormData({ ...formData, contingency_budget: parseFloat(e.target.value) })}
                    className="bg-slate-50 border-slate-200 font-mono"
                    data-testid="project-contingency-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="submit-project-btn">
                  Create Project
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
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200"
            data-testid="search-projects-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-white border-slate-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200">
            <SelectValue placeholder="Programme" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all">All Programmes</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 group"
              data-testid={`project-card-${project.id}`}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-heading uppercase ${
                        project.template === 'Weapon Systems' ? 'bg-red-100 text-red-700' :
                        project.template === 'R&D' ? 'bg-purple-100 text-purple-700' :
                        project.template === 'Infrastructure' ? 'bg-green-100 text-green-700' :
                        project.template === 'IT' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {project.template}
                      </span>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">{project.code}</p>
                  </div>
                  {/* Health Score */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                    (project.health_score || 0) >= 80 ? 'bg-green-100 text-green-700 border-2 border-green-300' :
                    (project.health_score || 0) >= 60 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' :
                    'bg-red-100 text-red-700 border-2 border-red-300'
                  }`}>
                    {project.health_score || 0}
                  </div>
                </div>
                <p className="text-sm text-slate-500">{getProgramName(project.program_id)}</p>
              </div>

              {/* Progress & Budget */}
              <div className="p-5 bg-slate-50">
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-slate-700 font-mono">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-2 bg-slate-200" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Budget</p>
                    <p className="font-mono text-slate-800">{formatCurrency(project.budget_allocated || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Spent</p>
                    <p className="font-mono text-slate-800">{formatCurrency(project.budget_spent || 0)}</p>
                  </div>
                </div>

                {/* Dates & Status */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>{project.start_date}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span>{project.end_date}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-heading uppercase ${
                    project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    project.status === 'completed' ? 'bg-green-100 text-green-700' :
                    project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' :
                    project.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {project.status?.replace('_', ' ') || 'planning'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="tactical-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Programme</th>
                <th>Template</th>
                <th>Progress</th>
                <th>Budget</th>
                <th>Health</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id} className="group" data-testid={`project-row-${project.id}`}>
                  <td>
                    <Link to={`/projects/${project.id}`} className="text-slate-800 hover:text-blue-600 font-medium">
                      {project.name}
                    </Link>
                    <p className="text-xs text-slate-500 font-mono">{project.code}</p>
                  </td>
                  <td className="text-sm text-slate-600">{getProgramName(project.program_id)}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-heading uppercase ${
                      project.template === 'Weapon Systems' ? 'bg-red-100 text-red-700' :
                      project.template === 'R&D' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {project.template}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress || 0} className="h-1.5 w-16 bg-slate-200" />
                      <span className="text-xs font-mono text-slate-600">{project.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="font-mono text-sm text-slate-700">{formatCurrency(project.budget_allocated || 0)}</td>
                  <td>
                    <span className={`text-sm font-bold ${
                      (project.health_score || 0) >= 80 ? 'text-green-600' :
                      (project.health_score || 0) >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {project.health_score || 0}
                    </span>
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded font-heading uppercase ${
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      project.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {project.status?.replace('_', ' ') || 'planning'}
                    </span>
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white border-slate-200">
                        <DropdownMenuItem asChild>
                          <Link to={`/projects/${project.id}`} className="text-slate-700">
                            <Edit className="w-4 h-4 mr-2" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(project.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <FolderKanban className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No projects found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
