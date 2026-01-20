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
  Trash2,
  X,
  Award,
  Calendar,
  BarChart3,
  Clock,
  TrendingUp,
  Target,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  Activity
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
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [clearanceFilter, setClearanceFilter] = useState("all");
  const [burnoutFilter, setBurnoutFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showCapacityPlanning, setShowCapacityPlanning] = useState(false);
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
  const [certInput, setCertInput] = useState("");
  const [allocationData, setAllocationData] = useState({
    project_id: "",
    hours: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resourcesRes, conflictsRes, projectsRes] = await Promise.all([
        axios.get(`${API}/resources`),
        axios.get(`${API}/resources/conflicts/check`),
        axios.get(`${API}/projects`)
      ]);
      setResources(resourcesRes.data);
      setConflicts(conflictsRes.data);
      setProjects(projectsRes.data);
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
      resetForm();
    } catch (error) {
      toast.error("Failed to create resource");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/resources/${selectedResource.id}`, formData);
      toast.success("Resource updated successfully");
      setIsEditDialogOpen(false);
      fetchData();
      resetForm();
    } catch (error) {
      toast.error("Failed to update resource");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/resources/${selectedResource.id}`);
      toast.success("Resource deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedResource(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete resource");
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      const resource = selectedResource;
      const newAllocatedHours = (resource.allocated_hours || 0) + allocationData.hours;
      const newAllocatedProjects = [...(resource.allocated_projects || [])];
      if (!newAllocatedProjects.includes(allocationData.project_id)) {
        newAllocatedProjects.push(allocationData.project_id);
      }
      
      await axios.put(`${API}/resources/${resource.id}`, {
        allocated_hours: newAllocatedHours,
        allocated_projects: newAllocatedProjects
      });
      
      toast.success("Resource allocated successfully");
      setIsAllocationDialogOpen(false);
      setAllocationData({ project_id: "", hours: 0 });
      fetchData();
    } catch (error) {
      toast.error("Failed to allocate resource");
    }
  };

  const handleDeallocate = async (resourceId, projectId) => {
    try {
      const resource = resources.find(r => r.id === resourceId);
      if (!resource) return;
      
      const newAllocatedProjects = (resource.allocated_projects || []).filter(p => p !== projectId);
      // Estimate hours to remove (divide equally among projects)
      const hoursPerProject = resource.allocated_hours / (resource.allocated_projects?.length || 1);
      const newAllocatedHours = Math.max(0, (resource.allocated_hours || 0) - hoursPerProject);
      
      await axios.put(`${API}/resources/${resourceId}`, {
        allocated_hours: newAllocatedHours,
        allocated_projects: newAllocatedProjects
      });
      
      toast.success("Resource deallocated");
      fetchData();
    } catch (error) {
      toast.error("Failed to deallocate resource");
    }
  };

  const resetForm = () => {
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
    setSkillInput("");
    setCertInput("");
  };

  const openEditDialog = (resource) => {
    setSelectedResource(resource);
    setFormData({
      name: resource.name,
      type: resource.type,
      department: resource.department || "",
      unit: resource.unit || "",
      skills: resource.skills || [],
      certifications: resource.certifications || [],
      clearance_level: resource.clearance_level || "public",
      capacity_hours: resource.capacity_hours || 160,
      hourly_rate: resource.hourly_rate || 0
    });
    setIsEditDialogOpen(true);
  };

  const openAllocationDialog = (resource) => {
    setSelectedResource(resource);
    setAllocationData({ project_id: "", hours: 0 });
    setIsAllocationDialogOpen(true);
  };

  const openDeleteDialog = (resource) => {
    setSelectedResource(resource);
    setIsDeleteDialogOpen(true);
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

  const addCertification = () => {
    if (certInput.trim() && !formData.certifications.includes(certInput.trim())) {
      setFormData({ ...formData, certifications: [...formData.certifications, certInput.trim()] });
      setCertInput("");
    }
  };

  const removeCertification = (cert) => {
    setFormData({ ...formData, certifications: formData.certifications.filter(c => c !== cert) });
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
    return `₹${(value || 0).toLocaleString('en-IN')}`;
  };

  const getClearanceColor = (level) => {
    switch (level) {
      case 'top_secret': return 'text-red-700 border-red-200 bg-red-50';
      case 'secret': return 'text-amber-700 border-amber-200 bg-amber-50';
      case 'confidential': return 'text-blue-700 border-blue-200 bg-blue-50';
      default: return 'text-slate-700 border-slate-200 bg-slate-50';
    }
  };

  const getBurnoutColor = (risk) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : projectId;
  };

  // Apply filters
  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.department && r.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.skills && r.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesType = typeFilter === "all" || r.type === typeFilter;
    const matchesClearance = clearanceFilter === "all" || r.clearance_level === clearanceFilter;
    const matchesBurnout = burnoutFilter === "all" || r.burnout_risk === burnoutFilter;
    return matchesSearch && matchesType && matchesClearance && matchesBurnout;
  });

  const resourcesByType = {
    human: resources.filter(r => r.type === 'human'),
    equipment: resources.filter(r => r.type === 'equipment'),
    facility: resources.filter(r => r.type === 'facility')
  };

  // Capacity Planning Stats
  const capacityStats = {
    totalCapacity: resources.reduce((sum, r) => sum + (r.capacity_hours || 0), 0),
    totalAllocated: resources.reduce((sum, r) => sum + (r.allocated_hours || 0), 0),
    avgUtilization: resources.length > 0 
      ? Math.round(resources.reduce((sum, r) => sum + (r.utilization || 0), 0) / resources.length)
      : 0,
    overAllocated: resources.filter(r => (r.utilization || 0) > 100).length,
    highBurnoutRisk: resources.filter(r => r.burnout_risk === 'high' || r.burnout_risk === 'critical').length,
    available: resources.filter(r => (r.utilization || 0) < 70).length
  };

  // Skills Summary
  const allSkills = [...new Set(resources.flatMap(r => r.skills || []))];
  const skillCounts = allSkills.reduce((acc, skill) => {
    acc[skill] = resources.filter(r => r.skills?.includes(skill)).length;
    return acc;
  }, {});

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
            Resource & Manpower Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {resources.length} total resources • {resourcesByType.human.length} personnel • {capacityStats.available} available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCapacityPlanning(!showCapacityPlanning)}
            className="border-slate-300"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Capacity Planning
            {showCapacityPlanning ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchData}
            className="border-slate-300"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase tracking-wider" data-testid="create-resource-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-slate-800 uppercase tracking-wider">
                  Add New Resource
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                      Resource Name *
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
                      Type *
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
                      Clearance Level *
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
                      onChange={(e) => setFormData({ ...formData, capacity_hours: parseFloat(e.target.value) || 0 })}
                      className="bg-slate-50 border-slate-200 font-mono"
                    />
                  </div>
                </div>
                
                {/* Skills */}
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
                          <button type="button" onClick={() => removeSkill(skill)} className="text-blue-400 hover:text-blue-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certifications */}
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Certifications
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      className="bg-slate-50 border-slate-200"
                      placeholder="Add certification..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    />
                    <Button type="button" onClick={addCertification} variant="outline" className="border-slate-300">
                      Add
                    </Button>
                  </div>
                  {formData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded flex items-center gap-1"
                        >
                          <Award className="w-3 h-3" />
                          {cert}
                          <button type="button" onClick={() => removeCertification(cert)} className="text-green-400 hover:text-green-600">
                            <X className="w-3 h-3" />
                          </button>
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
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
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
      </div>

      {/* Capacity Planning Section */}
      {showCapacityPlanning && (
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="font-heading text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Load & Capacity Planning
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Capacity</p>
              <p className="text-2xl font-bold font-mono text-slate-800">{capacityStats.totalCapacity.toLocaleString()}</p>
              <p className="text-xs text-slate-400">hours/month</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Allocated</p>
              <p className="text-2xl font-bold font-mono text-blue-600">{capacityStats.totalAllocated.toLocaleString()}</p>
              <p className="text-xs text-slate-400">hours/month</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Avg Utilization</p>
              <p className="text-2xl font-bold font-mono text-slate-800">{capacityStats.avgUtilization}%</p>
              <Progress value={capacityStats.avgUtilization} className="h-1.5 mt-2" />
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Over-Allocated</p>
              <p className="text-2xl font-bold font-mono text-red-600">{capacityStats.overAllocated}</p>
              <p className="text-xs text-slate-400">resources</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">High Burnout Risk</p>
              <p className="text-2xl font-bold font-mono text-orange-600">{capacityStats.highBurnoutRisk}</p>
              <p className="text-xs text-slate-400">resources</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Available</p>
              <p className="text-2xl font-bold font-mono text-green-600">{capacityStats.available}</p>
              <p className="text-xs text-slate-400">&lt;70% utilized</p>
            </div>
          </div>
          
          {/* Skills Distribution */}
          {allSkills.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Skills Distribution</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(skillCounts).slice(0, 10).map(([skill, count]) => (
                  <span key={skill} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-600">
                    {skill} <span className="font-mono text-blue-600">({count})</span>
                  </span>
                ))}
                {allSkills.length > 10 && (
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-500">
                    +{allSkills.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-heading text-sm font-bold text-amber-800 uppercase">Resource Conflicts Detected ({conflicts.length})</h3>
          </div>
          <div className="space-y-2">
            {conflicts.slice(0, 5).map((conflict) => (
              <div key={conflict.resource_id} className="flex items-center justify-between text-sm">
                <p className="text-amber-700">
                  <span className="font-medium">{conflict.resource_name}</span> is over-allocated at {conflict.utilization}%
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-amber-300 text-amber-700 h-7 text-xs"
                  onClick={() => {
                    const resource = resources.find(r => r.id === conflict.resource_id);
                    if (resource) openEditDialog(resource);
                  }}
                >
                  Resolve
                </Button>
              </div>
            ))}
            {conflicts.length > 5 && (
              <p className="text-xs text-amber-600">+{conflicts.length - 5} more conflicts</p>
            )}
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by name, department, or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200"
            data-testid="search-resources-input"
          />
        </div>
        <Select value={clearanceFilter} onValueChange={setClearanceFilter}>
          <SelectTrigger className="w-[160px] bg-white border-slate-200">
            <Shield className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Clearance" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all">All Clearance</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="confidential">Confidential</SelectItem>
            <SelectItem value="secret">Secret</SelectItem>
            <SelectItem value="top_secret">Top Secret</SelectItem>
          </SelectContent>
        </Select>
        <Select value={burnoutFilter} onValueChange={setBurnoutFilter}>
          <SelectTrigger className="w-[160px] bg-white border-slate-200">
            <Zap className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Burnout Risk" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        {(typeFilter !== "all" || clearanceFilter !== "all" || burnoutFilter !== "all" || searchTerm) && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setTypeFilter("all");
              setClearanceFilter("all");
              setBurnoutFilter("all");
              setSearchTerm("");
            }}
            className="text-slate-500"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        )}
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
                    <DropdownMenuItem onClick={() => openAllocationDialog(resource)} className="text-slate-700">
                      <Briefcase className="w-4 h-4 mr-2" /> Allocate to Project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => openEditDialog(resource)} className="text-slate-700">
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDeleteDialog(resource)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Clearance */}
              {resource.clearance_level && resource.clearance_level !== 'public' && (
                <div className="mb-3">
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${getClearanceColor(resource.clearance_level)}`}>
                    <Shield className="w-3 h-3" />
                    {resource.clearance_level.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              )}

              {/* Skills */}
              {resource.skills && resource.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
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

              {/* Certifications */}
              {resource.certifications && resource.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {resource.certifications.slice(0, 2).map((cert) => (
                    <span key={cert} className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] rounded flex items-center gap-1">
                      <Award className="w-2.5 h-2.5" />
                      {cert}
                    </span>
                  ))}
                  {resource.certifications.length > 2 && (
                    <span className="px-2 py-0.5 bg-green-50 text-green-500 text-[10px] rounded">
                      +{resource.certifications.length - 2}
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
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getBurnoutColor(resource.burnout_risk)}`}>
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
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{resource.allocated_hours || 0} / {resource.capacity_hours || 160} hrs</span>
                </div>
              </div>

              {/* Allocated Projects */}
              {resource.allocated_projects && resource.allocated_projects.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Allocated Projects</p>
                  <div className="flex flex-wrap gap-1">
                    {resource.allocated_projects.slice(0, 2).map((projectId) => (
                      <span 
                        key={projectId} 
                        className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded flex items-center gap-1 group/project"
                      >
                        {getProjectName(projectId).slice(0, 15)}...
                        <button 
                          onClick={() => handleDeallocate(resource.id, projectId)}
                          className="opacity-0 group-hover/project:opacity-100 text-blue-400 hover:text-blue-600"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    {resource.allocated_projects.length > 2 && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-500 text-[10px] rounded">
                        +{resource.allocated_projects.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  {resource.allocated_projects?.length || 0} projects
                </span>
                <span className="text-slate-600 font-mono">
                  {formatCurrency(resource.hourly_rate)}/hr
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
          {(typeFilter !== "all" || clearanceFilter !== "all" || burnoutFilter !== "all" || searchTerm) && (
            <Button 
              variant="link" 
              className="text-blue-600 mt-2"
              onClick={() => {
                setTypeFilter("all");
                setClearanceFilter("all");
                setBurnoutFilter("all");
                setSearchTerm("");
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-slate-800 uppercase tracking-wider">
              Edit Resource
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Resource Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-50 border-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Type *
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
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
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Clearance Level *
                </label>
                <Select
                  value={formData.clearance_level}
                  onValueChange={(value) => setFormData({ ...formData, clearance_level: value })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
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
                  onChange={(e) => setFormData({ ...formData, capacity_hours: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-50 border-slate-200 font-mono"
                />
              </div>
            </div>
            
            {/* Skills */}
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
                    <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded flex items-center gap-1">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="text-blue-400 hover:text-blue-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                Certifications
              </label>
              <div className="flex gap-2">
                <Input
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                  placeholder="Add certification..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <Button type="button" onClick={addCertification} variant="outline" className="border-slate-300">
                  Add
                </Button>
              </div>
              {formData.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.certifications.map((cert) => (
                    <span key={cert} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {cert}
                      <button type="button" onClick={() => removeCertification(cert)} className="text-green-400 hover:text-green-600">
                        <X className="w-3 h-3" />
                      </button>
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
                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                className="bg-slate-50 border-slate-200 font-mono"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-slate-300">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Allocation Dialog */}
      <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-slate-800 uppercase tracking-wider">
              Allocate Resource to Project
            </DialogTitle>
          </DialogHeader>
          {selectedResource && (
            <form onSubmit={handleAllocate} className="space-y-4 mt-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="font-medium text-slate-800">{selectedResource.name}</p>
                <p className="text-xs text-slate-500">
                  Available: {(selectedResource.capacity_hours || 160) - (selectedResource.allocated_hours || 0)} hrs/month
                </p>
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Select Project *
                </label>
                <Select
                  value={allocationData.project_id}
                  onValueChange={(value) => setAllocationData({ ...allocationData, project_id: value })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Choose project" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 max-h-60">
                    {projects
                      .filter(p => !selectedResource.allocated_projects?.includes(p.id))
                      .map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Hours to Allocate *
                </label>
                <Input
                  type="number"
                  value={allocationData.hours}
                  onChange={(e) => setAllocationData({ ...allocationData, hours: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-50 border-slate-200 font-mono"
                  min="1"
                  max={(selectedResource.capacity_hours || 160) - (selectedResource.allocated_hours || 0)}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAllocationDialogOpen(false)} className="border-slate-300">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!allocationData.project_id || !allocationData.hours}
                >
                  Allocate
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-slate-800 uppercase tracking-wider">
              Delete Resource
            </DialogTitle>
          </DialogHeader>
          {selectedResource && (
            <div className="space-y-4 mt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Warning</span>
                </div>
                <p className="text-sm text-red-600">
                  Are you sure you want to delete <strong>{selectedResource.name}</strong>? This action cannot be undone.
                </p>
                {selectedResource.allocated_projects?.length > 0 && (
                  <p className="text-xs text-red-500 mt-2">
                    This resource is currently allocated to {selectedResource.allocated_projects.length} project(s).
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-slate-300">
                  Cancel
                </Button>
                <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                  Delete Resource
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}