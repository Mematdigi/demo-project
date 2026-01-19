import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import {
  Users,
  Plus,
  Search,
  UserCircle,
  Cpu,
  Building,
  MoreVertical,
  Shield,
  AlertTriangle,
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

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "human",
    department: "",
    unit: "",
    skills: [],
    certifications: [],
    clearance_level: "public",
    capacity_hours: 160,
    hourly_rate: 0
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resourcesRes, conflictsRes] = await Promise.all([
        axios.get(`${API}/resources`),
        axios.get(`${API}/resources/conflicts/check`)
      ]);
      setResources(resourcesRes.data);
      setConflicts(conflictsRes.data);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/resources`, formData);
      toast.success("Resource created successfully");
      setIsDialogOpen(false);
      fetchData();
      setFormData({
        name: "",
        type: "human",
        department: "",
        unit: "",
        skills: [],
        certifications: [],
        clearance_level: "public",
        capacity_hours: 160,
        hourly_rate: 0
      });
    } catch (error) {
      toast.error("Failed to create resource");
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'human': return UserCircle;
      case 'equipment': return Cpu;
      case 'facility': return Building;
      default: return Users;
    }
  };

  const formatCurrency = (value) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const filteredResources = resources.filter(r =>
    (r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.department && r.department.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (typeFilter === "all" || r.type === typeFilter)
  );

  const resourcesByType = {
    human: resources.filter(r => r.type === 'human'),
    equipment: resources.filter(r => r.type === 'equipment'),
    facility: resources.filter(r => r.type === 'facility')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-blue-600 font-heading text-lg uppercase tracking-wider animate-pulse">
          Loading Resources...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="resources-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase tracking-wide">
            Resources
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {resources.length} total resources • {resourcesByType.human.length} personnel
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase tracking-wider" data-testid="create-resource-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-slate-800 uppercase tracking-wider">
                Add New Resource
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Resource Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    placeholder="Lt. Col. Sharma"
                    required
                    data-testid="resource-name-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Type
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200" data-testid="resource-type-select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="human">Personnel</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="facility">Facility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Department
                  </label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    placeholder="Engineering"
                    data-testid="resource-department-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Unit
                  </label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    placeholder="Radar Division"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Clearance Level
                  </label>
                  <Select
                    value={formData.clearance_level}
                    onValueChange={(value) => setFormData({ ...formData, clearance_level: value })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200" data-testid="resource-clearance-select">
                      <SelectValue placeholder="Select clearance" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="confidential">Confidential</SelectItem>
                      <SelectItem value="secret">Secret</SelectItem>
                      <SelectItem value="top_secret">Top Secret</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Capacity (hrs/month)
                  </label>
                  <Input
                    type="number"
                    value={formData.capacity_hours}
                    onChange={(e) => setFormData({ ...formData, capacity_hours: parseFloat(e.target.value) })}
                    className="bg-slate-50 border-slate-200 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Skills / Capabilities
                </label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="bg-slate-50 border-slate-200"
                    placeholder="Add skill..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill} variant="outline" className="border-slate-300">
                    Add
                  </Button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded flex items-center gap-1"
                      >
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="text-blue-400 hover:text-blue-600">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Hourly Rate (₹)
                </label>
                <Input
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
                  className="bg-slate-50 border-slate-200 font-mono"
                  data-testid="resource-rate-input"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="submit-resource-btn">
                  Add Resource
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-heading text-sm font-bold text-amber-800 uppercase">Resource Conflicts Detected</h3>
          </div>
          <div className="space-y-2">
            {conflicts.slice(0, 3).map((conflict) => (
              <p key={conflict.resource_id} className="text-sm text-amber-700">
                <span className="font-medium">{conflict.resource_name}</span> is over-allocated at {conflict.utilization}%
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { type: 'human', label: 'Personnel', icon: UserCircle, color: 'blue' },
          { type: 'equipment', label: 'Equipment', icon: Cpu, color: 'amber' },
          { type: 'facility', label: 'Facilities', icon: Building, color: 'green' },
        ].map(({ type, label, icon: Icon, color }) => (
          <button
            key={type}
            onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
            className={`bg-white border rounded-lg p-4 text-left transition-all shadow-sm hover:shadow ${
              typeFilter === type ? `border-${color}-400 ring-2 ring-${color}-100` : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-5 h-5 text-${color}-600`} />
              <span className="text-xs text-slate-500">
                {Math.round(resourcesByType[type].reduce((sum, r) => sum + (r.utilization || 0), 0) / (resourcesByType[type].length || 1))}% avg util
              </span>
            </div>
            <p className="text-2xl font-heading font-bold text-slate-800">{resourcesByType[type].length}</p>
            <p className="text-xs text-slate-500 font-heading uppercase tracking-wider">{label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200"
            data-testid="search-resources-input"
          />
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((resource) => {
          const Icon = getTypeIcon(resource.type);
          return (
            <div
              key={resource.id}
              className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-all duration-200 group"
              data-testid={`resource-card-${resource.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    resource.type === 'human' ? 'bg-blue-50 text-blue-600' :
                    resource.type === 'equipment' ? 'bg-amber-50 text-amber-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-medium">{resource.name}</h3>
                    <p className="text-xs text-slate-500">{resource.department || resource.type}</p>
                    {resource.unit && <p className="text-xs text-slate-400">{resource.unit}</p>}
                  </div>
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
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Clearance */}
              {resource.clearance_level && resource.clearance_level !== 'public' && (
                <div className="mb-3">
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${
                    resource.clearance_level === 'top_secret' ? 'text-red-700 border-red-200 bg-red-50' :
                    resource.clearance_level === 'secret' ? 'text-amber-700 border-amber-200 bg-amber-50' :
                    'text-blue-700 border-blue-200 bg-blue-50'
                  }`}>
                    <Shield className="w-3 h-3" />
                    {resource.clearance_level.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              )}

              {/* Skills */}
              {resource.skills && resource.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {resource.skills.slice(0, 3).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">
                      {skill}
                    </span>
                  ))}
                  {resource.skills.length > 3 && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded">
                      +{resource.skills.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Utilization */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Utilisation</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono ${
                      (resource.utilization || 0) > 100 ? 'text-red-600' :
                      (resource.utilization || 0) > 85 ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      {resource.utilization || 0}%
                    </span>
                    {resource.burnout_risk && resource.burnout_risk !== 'low' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        resource.burnout_risk === 'critical' ? 'bg-red-100 text-red-700' :
                        resource.burnout_risk === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {resource.burnout_risk} risk
                      </span>
                    )}
                  </div>
                </div>
                <Progress 
                  value={Math.min(resource.utilization || 0, 100)} 
                  className={`h-1.5 ${
                    (resource.utilization || 0) > 100 ? 'bg-red-100' :
                    (resource.utilization || 0) > 85 ? 'bg-amber-100' :
                    'bg-slate-100'
                  }`} 
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  {resource.allocated_projects?.length || 0} projects
                </span>
                <span className="text-slate-600 font-mono">
                  {formatCurrency(resource.hourly_rate || 0)}/hr
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No resources found</p>
        </div>
      )}
    </div>
  );
}
