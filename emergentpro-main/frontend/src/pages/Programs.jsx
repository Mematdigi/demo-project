import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Link } from "react-router-dom";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  IndianRupee,
  Target,
  MoreVertical,
  Edit,
  Trash2
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    start_date: "",
    end_date: "",
    budget_total: 0,
    objectives: []
  });
  const [objectiveInput, setObjectiveInput] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [programsRes, projectsRes] = await Promise.all([
        axios.get(`${API}/programs`),
        axios.get(`${API}/projects`)
      ]);
      setPrograms(programsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error("Failed to fetch programs:", error);
      toast.error("Failed to load programmes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/programs`, formData);
      toast.success("Programme created successfully");
      setIsDialogOpen(false);
      fetchData();
      setFormData({ name: "", code: "", description: "", start_date: "", end_date: "", budget_total: 0, objectives: [] });
    } catch (error) {
      toast.error("Failed to create programme");
    }
  };

  const handleDelete = async (programId) => {
    if (window.confirm("Are you sure you want to delete this programme?")) {
      try {
        await axios.delete(`${API}/programs/${programId}`);
        toast.success("Programme deleted");
        fetchData();
      } catch (error) {
        toast.error("Failed to delete programme");
      }
    }
  };

  const addObjective = () => {
    if (objectiveInput.trim() && !formData.objectives.includes(objectiveInput.trim())) {
      setFormData({ ...formData, objectives: [...formData.objectives, objectiveInput.trim()] });
      setObjectiveInput("");
    }
  };

  const removeObjective = (obj) => {
    setFormData({ ...formData, objectives: formData.objectives.filter(o => o !== obj) });
  };

  const getProjectCount = (programId) => {
    return projects.filter(p => p.program_id === programId).length;
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  const filteredPrograms = programs.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-blue-600 font-heading text-lg uppercase tracking-wider animate-pulse">
          Loading Programmes...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="programs-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase tracking-wide">
            Programmes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {programs.length} active programmes across all departments
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase tracking-wider" data-testid="create-program-btn">
              <Plus className="w-4 h-4 mr-2" />
              New Programme
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-slate-800 uppercase tracking-wider">
                Create New Programme
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Programme Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    placeholder="AEGIS Defence Shield"
                    required
                    data-testid="program-name-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Programme Code
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="bg-slate-50 border-slate-200 font-mono"
                    placeholder="ADS-2024"
                    required
                    data-testid="program-code-input"
                  />
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
                  placeholder="Multi-layered air defence system integration programme"
                  rows={3}
                  data-testid="program-description-input"
                />
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Objectives
                </label>
                <div className="flex gap-2">
                  <Input
                    value={objectiveInput}
                    onChange={(e) => setObjectiveInput(e.target.value)}
                    className="bg-slate-50 border-slate-200"
                    placeholder="Add objective..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                  />
                  <Button type="button" onClick={addObjective} variant="outline" className="border-slate-300">
                    Add
                  </Button>
                </div>
                {formData.objectives.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.objectives.map((obj) => (
                      <span
                        key={obj}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded flex items-center gap-1"
                      >
                        {obj}
                        <button type="button" onClick={() => removeObjective(obj)} className="text-blue-400 hover:text-blue-600">×</button>
                      </span>
                    ))}
                  </div>
                )}
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
                    data-testid="program-start-date-input"
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
                    data-testid="program-end-date-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Total Budget (₹)
                </label>
                <Input
                  type="number"
                  value={formData.budget_total}
                  onChange={(e) => setFormData({ ...formData, budget_total: parseFloat(e.target.value) })}
                  className="bg-slate-50 border-slate-200 font-mono"
                  data-testid="program-budget-input"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="submit-program-btn">
                  Create Programme
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search programmes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200"
            data-testid="search-programs-input"
          />
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => (
          <div
            key={program.id}
            className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 group"
            data-testid={`program-card-${program.id}`}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-heading font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {program.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">{program.code}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border-slate-200">
                    <DropdownMenuItem className="text-slate-700">
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleDelete(program.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 min-h-[40px]">
                {program.description || "No description provided"}
              </p>
            </div>

            {/* Stats */}
            <div className="p-5 bg-slate-50">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">Projects</p>
                  <p className="text-xl font-heading font-bold text-slate-800">{getProjectCount(program.id)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">Health</p>
                  <p className={`text-xl font-heading font-bold ${
                    (program.health_score || 0) >= 80 ? 'text-green-600' :
                    (program.health_score || 0) >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {program.health_score || 0}%
                  </p>
                </div>
              </div>

              {/* Budget */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Budget Allocation</span>
                  <span className="text-slate-700 font-mono">
                    {formatCurrency(program.budget_allocated || 0)} / {formatCurrency(program.budget_total)}
                  </span>
                </div>
                <Progress 
                  value={program.budget_total > 0 ? ((program.budget_allocated || 0) / program.budget_total) * 100 : 0} 
                  className="h-2 bg-slate-200" 
                />
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>{program.start_date}</span>
                <ChevronRight className="w-3 h-3" />
                <span>{program.end_date}</span>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded font-heading uppercase ${
                  program.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  program.status === 'completed' ? 'bg-green-100 text-green-700' :
                  program.status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {program.status?.replace('_', ' ') || 'planning'}
                </span>
                <Link 
                  to={`/projects?program=${program.id}`}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View Projects <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12">
          <Boxes className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No programmes found</p>
        </div>
      )}
    </div>
  );
}
