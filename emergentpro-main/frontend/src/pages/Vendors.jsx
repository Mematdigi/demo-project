import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import {
  Building2,
  Plus,
  Search,
  Star,
  AlertTriangle,
  CheckCircle2,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  Shield
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";

const vendorCategories = ["Hardware", "Software", "Services", "Consulting", "Logistics", "Construction", "Security"];

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contact_email: "",
    contact_phone: "",
    category: "Hardware"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vendorsRes, contractsRes] = await Promise.all([
        axios.get(`${API}/vendors`),
        axios.get(`${API}/contracts`)
      ]);
      setVendors(vendorsRes.data);
      setContracts(contractsRes.data);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
      toast.error("Failed to load vendor data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/vendors`, formData);
      toast.success("Vendor created successfully");
      setIsDialogOpen(false);
      fetchData();
      setFormData({
        name: "",
        code: "",
        contact_email: "",
        contact_phone: "",
        category: "Hardware"
      });
    } catch (error) {
      toast.error("Failed to create vendor");
    }
  };

  const handleDueDiligence = async (vendorId) => {
    try {
      await axios.post(`${API}/vendors/${vendorId}/due-diligence`, { status: "completed" });
      toast.success("Due diligence completed");
      fetchData();
    } catch (error) {
      toast.error("Failed to update due diligence status");
    }
  };

  const handleBlacklist = async (vendorId) => {
    const reason = window.prompt("Enter reason for blacklisting:");
    if (reason) {
      try {
        await axios.post(`${API}/vendors/${vendorId}/blacklist`, { reason, flags: ["compliance_issue"] });
        toast.success("Vendor blacklisted");
        fetchData();
      } catch (error) {
        toast.error("Failed to blacklist vendor");
      }
    }
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  const getVendorContracts = (vendorId) => {
    return contracts.filter(c => c.vendor_id === vendorId);
  };

  const filteredVendors = vendors.filter(v =>
    (v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.code.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (categoryFilter === "all" || v.category === categoryFilter) &&
    (statusFilter === "all" || v.status === statusFilter)
  );

  const vendorsByStatus = {
    active: vendors.filter(v => v.status === 'active'),
    inactive: vendors.filter(v => v.status === 'inactive'),
    blacklisted: vendors.filter(v => v.status === 'blacklisted')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-blue-600 font-heading text-lg uppercase tracking-wider animate-pulse">
          Loading Vendors...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="vendors-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase tracking-wide">
            Vendors & Contracts
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {vendors.length} registered vendors • {contracts.length} active contracts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase tracking-wider" data-testid="create-vendor-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-slate-800 uppercase tracking-wider">
                Register New Vendor
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Vendor Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    placeholder="Bharat Electronics Ltd"
                    required
                    data-testid="vendor-name-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Vendor Code
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="bg-slate-50 border-slate-200 font-mono"
                    placeholder="BEL-001"
                    required
                    data-testid="vendor-code-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200" data-testid="vendor-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    {vendorCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Contact Email
                  </label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    placeholder="contact@vendor.com"
                    required
                    data-testid="vendor-email-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-slate-500 uppercase tracking-wider mb-2">
                    Contact Phone
                  </label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="bg-slate-50 border-slate-200"
                    placeholder="+91 98765 43210"
                    data-testid="vendor-phone-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="submit-vendor-btn">
                  Register Vendor
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { status: 'active', label: 'Active Vendors', icon: CheckCircle2, color: 'green' },
          { status: 'inactive', label: 'Inactive', icon: AlertTriangle, color: 'amber' },
          { status: 'blacklisted', label: 'Blacklisted', icon: Ban, color: 'red' },
        ].map(({ status, label, icon: Icon, color }) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={`bg-white border rounded-lg p-4 text-left transition-all shadow-sm hover:shadow ${
              statusFilter === status ? `border-${color}-400 ring-2 ring-${color}-100` : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-5 h-5 text-${color}-600`} />
              <span className={`text-xs px-2 py-0.5 rounded font-heading uppercase bg-${color}-100 text-${color}-700`}>
                {label}
              </span>
            </div>
            <p className="text-2xl font-heading font-bold text-slate-800">{vendorsByStatus[status]?.length || 0}</p>
            <p className="text-xs text-slate-500 mt-1">
              {formatCurrency(vendorsByStatus[status]?.reduce((sum, v) => sum + (v.total_value || 0), 0) || 0)} total value
            </p>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200"
            data-testid="search-vendors-input"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px] bg-white border-slate-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="all">All Categories</SelectItem>
            {vendorCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vendors Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => {
          const vendorContracts = getVendorContracts(vendor.id);
          return (
            <div
              key={vendor.id}
              className={`bg-white border rounded-lg p-5 transition-all duration-200 group hover:shadow-md ${
                vendor.status === 'blacklisted' ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
              }`}
              data-testid={`vendor-card-${vendor.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    vendor.status === 'blacklisted' ? 'bg-red-100 text-red-600' :
                    vendor.status === 'active' ? 'bg-blue-50 text-blue-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-medium">{vendor.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{vendor.code}</p>
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
                    <DropdownMenuItem 
                      className="text-green-600"
                      onClick={() => handleDueDiligence(vendor.id)}
                    >
                      <Shield className="w-4 h-4 mr-2" /> Complete Due Diligence
                    </DropdownMenuItem>
                    {vendor.status !== 'blacklisted' && (
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleBlacklist(vendor.id)}
                      >
                        <Ban className="w-4 h-4 mr-2" /> Blacklist
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status & Category */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-heading uppercase ${
                  vendor.status === 'active' ? 'bg-green-100 text-green-700' :
                  vendor.status === 'blacklisted' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {vendor.status}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-heading uppercase bg-blue-100 text-blue-700">
                  {vendor.category}
                </span>
                {vendor.due_diligence_status === 'completed' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-heading uppercase bg-green-100 text-green-700">
                    Verified
                  </span>
                )}
              </div>

              {/* Risk Flags */}
              {vendor.risk_flags && vendor.risk_flags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {vendor.risk_flags.map((flag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] rounded border border-red-200">
                      {flag.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= (vendor.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                  />
                ))}
                <span className="text-xs text-slate-500 ml-2">
                  {vendor.sla_compliance || 100}% SLA
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500">Active Contracts</p>
                  <p className="text-lg font-heading font-bold text-slate-800">{vendor.contracts_active || vendorContracts.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Value</p>
                  <p className="text-lg font-heading font-bold text-slate-800">{formatCurrency(vendor.total_value || 0)}</p>
                </div>
              </div>

              {/* Contact */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">{vendor.contact_email}</p>
                {vendor.contact_phone && (
                  <p className="text-xs text-slate-500">{vendor.contact_phone}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No vendors found</p>
        </div>
      )}
    </div>
  );
}
