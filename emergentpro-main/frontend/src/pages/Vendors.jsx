import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import {
  Building2, Plus, Search, Star, AlertTriangle, CheckCircle2,
  FileText, MoreVertical, Edit, Trash2, Ban, Shield,
  TrendingUp, DollarSign, Scale, FileCheck, XCircle, Clock
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter
} from "../components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const vendorCategories = ["Hardware", "Software", "Services", "Consulting", "Logistics", "Construction", "Security"];

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Forms
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", code: "", contact_email: "", contact_phone: "", category: "Hardware"
  });
  const [contractForm, setContractForm] = useState({
    title: "", contract_number: "", value: 0, start_date: "", end_date: ""
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [vendorsRes, contractsRes] = await Promise.all([
        axios.get(`${API}/vendors`),
        axios.get(`${API}/contracts`)
      ]);
      setVendors(vendorsRes.data);
      setContracts(contractsRes.data);
    } catch (error) { toast.error("Failed to load vendor data"); } 
    finally { setLoading(false); }
  };

  // --- ACTIONS ---

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/vendors`, formData);
      toast.success("Vendor onboarded successfully");
      setIsDialogOpen(false);
      fetchData();
    } catch (error) { toast.error("Failed to create vendor"); }
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/contracts`, { ...contractForm, vendor_id: selectedVendor.id });
      toast.success("Contract drafted");
      fetchData();
      // Close sheet or refresh local data
      const updatedContracts = await axios.get(`${API}/contracts`);
      setContracts(updatedContracts.data);
    } catch (error) { toast.error("Contract creation failed"); }
  };

  const handleDueDiligence = async (status) => {
    try {
      await axios.post(`${API}/vendors/${selectedVendor.id}/due-diligence`, { status });
      toast.success(`Due diligence marked as ${status}`);
      fetchData();
      setSelectedVendor(prev => ({...prev, due_diligence_status: status}));
    } catch (error) { toast.error("Update failed"); }
  };

  const handleBlacklist = async () => {
    const reason = window.prompt("Enter reason for blacklisting (Required for Audit):");
    if (reason) {
      try {
        await axios.post(`${API}/vendors/${selectedVendor.id}/blacklist`, { reason, flags: ["compliance_breach"] });
        toast.success("Vendor Blacklisted");
        fetchData();
        setIsSheetOpen(false);
      } catch (error) { toast.error("Failed to blacklist"); }
    }
  };

  // --- HELPERS ---

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString()}`;
  };

  const calculatePenalty = (vendor) => {
    // Logic: If SLA is below 90%, penalty is 5% of total contract value
    if ((vendor.sla_compliance || 100) < 90) {
      return (vendor.total_value * 0.05);
    }
    return 0;
  };

  const openVendorSheet = (vendor) => {
    setSelectedVendor(vendor);
    setIsSheetOpen(true);
  };

  const vendorContracts = selectedVendor ? contracts.filter(c => c.vendor_id === selectedVendor.id) : [];
  
  // KPIs
  const totalValue = vendors.reduce((sum, v) => sum + (v.total_value || 0), 0);
  const avgSla = Math.round(vendors.reduce((sum, v) => sum + (v.sla_compliance || 0), 0) / (vendors.length || 1));
  const riskVendors = vendors.filter(v => v.status === 'blacklisted' || (v.risk_flags && v.risk_flags.length > 0));

  if (loading) return <div className="flex justify-center h-96 items-center text-blue-600 animate-pulse">Loading Procurement Data...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase">Vendor Command</h1>
          <p className="text-slate-500 text-sm mt-1">Procurement, Compliance & Performance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase">
              <Plus className="w-4 h-4 mr-2" /> Onboard Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-lg">
            <DialogHeader><DialogTitle>Vendor Onboarding</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateVendor} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Vendor Name" onChange={e => setFormData({...formData, name: e.target.value})} required />
                <Input placeholder="Vendor Code" onChange={e => setFormData({...formData, code: e.target.value})} required />
              </div>
              <Select onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent className="bg-white">{vendorCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Email" onChange={e => setFormData({...formData, contact_email: e.target.value})} required />
                <Input placeholder="Phone" onChange={e => setFormData({...formData, contact_phone: e.target.value})} />
              </div>
              <Button type="submit" className="w-full bg-blue-600 text-white">Start Due Diligence</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Active Contracts</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-slate-800">{contracts.length}</p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Total Exposure</span>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-slate-800">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Avg SLA Score</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-slate-800">{avgSla}%</p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">At Risk</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-red-600">{riskVendors.length}</p>
        </div>
      </div>

      {/* Main Vendor Grid */}
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search vendors..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())).map(vendor => (
            <div key={vendor.id} onClick={() => openVendorSheet(vendor)} className="bg-white border hover:border-blue-300 rounded-lg p-5 cursor-pointer transition-all shadow-sm hover:shadow-md group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${vendor.status === 'blacklisted' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{vendor.name}</h3>
                    <p className="text-xs text-slate-500">{vendor.code} • {vendor.category}</p>
                  </div>
                </div>
                {vendor.status === 'blacklisted' && <Badge variant="destructive">BLACKLISTED</Badge>}
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">SLA Performance</span>
                  <span className={`font-bold ${(vendor.sla_compliance || 100) >= 90 ? 'text-green-600' : 'text-red-600'}`}>{vendor.sla_compliance || 100}%</span>
                </div>
                <Progress value={vendor.sla_compliance || 100} className="h-1.5" />
              </div>

              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <span className="text-xs text-slate-500">{vendor.contracts_active} Active Contracts</span>
                <span className="text-sm font-mono font-bold text-slate-700">{formatCurrency(vendor.total_value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VENDOR DETAIL SHEET (360 VIEW) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[600px] sm:w-[540px] overflow-y-auto bg-slate-50 p-0">
          {selectedVendor && (
            <>
              {/* Sheet Header */}
              <div className="p-6 bg-white border-b sticky top-0 z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-heading font-bold uppercase text-slate-800">{selectedVendor.name}</h2>
                    <p className="text-sm text-slate-500">{selectedVendor.category} Vendor</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedVendor.status !== 'blacklisted' && (
                      <Button size="sm" variant="destructive" onClick={handleBlacklist}>
                        <Ban className="w-4 h-4 mr-2" /> Blacklist
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Due Diligence Tracker */}
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                  <Shield className={`w-5 h-5 ${selectedVendor.due_diligence_status === 'completed' ? 'text-green-600' : 'text-amber-500'}`} />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-700 uppercase">Due Diligence Status</p>
                    <p className="text-xs text-slate-500 capitalize">{selectedVendor.due_diligence_status?.replace('_', ' ') || 'Pending'}</p>
                  </div>
                  {selectedVendor.due_diligence_status !== 'completed' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs bg-white" onClick={() => handleDueDiligence('completed')}>
                      Verify
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Performance Scorecard */}
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="font-heading text-sm font-bold uppercase mb-4">Performance Scorecard</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{selectedVendor.rating || 0}/5</div>
                      <div className="text-[10px] text-slate-500 uppercase">Quality Rating</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${(selectedVendor.sla_compliance || 100) >= 90 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedVendor.sla_compliance || 100}%
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase">SLA Compliance</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{selectedVendor.contracts_active}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Projects Delivered</div>
                    </div>
                  </div>
                </div>

                {/* Automated Penalty Calculation */}
                {(selectedVendor.sla_compliance || 100) < 90 && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
                    <Scale className="w-5 h-5 text-red-600 mt-1" />
                    <div>
                      <h4 className="text-sm font-bold text-red-800 uppercase">SLA Breach Detected</h4>
                      <p className="text-xs text-red-700 mt-1">
                        Compliance is below 90%. System has auto-calculated a penalty.
                      </p>
                      <div className="mt-2 text-lg font-mono font-bold text-red-700">
                        {formatCurrency(calculatePenalty(selectedVendor))} <span className="text-xs font-normal opacity-70">(5% of TV)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contracts Tab */}
                <Tabs defaultValue="contracts">
                  <TabsList className="w-full">
                    <TabsTrigger value="contracts" className="flex-1">Active Contracts</TabsTrigger>
                    <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="contracts" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-500 uppercase">Contracts</h4>
                      <Dialog>
                        <DialogTrigger asChild><Button size="sm" variant="ghost" className="text-blue-600 h-7"><Plus className="w-3 h-3 mr-1"/> New Contract</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Draft New Contract</DialogTitle></DialogHeader>
                          <form onSubmit={handleCreateContract} className="space-y-3 mt-3">
                            <Input placeholder="Contract Title" onChange={e => setContractForm({...contractForm, title: e.target.value})} />
                            <Input placeholder="Contract Number" onChange={e => setContractForm({...contractForm, contract_number: e.target.value})} />
                            <Input type="number" placeholder="Value (₹)" onChange={e => setContractForm({...contractForm, value: parseFloat(e.target.value)})} />
                            <div className="grid grid-cols-2 gap-3">
                              <Input type="date" onChange={e => setContractForm({...contractForm, start_date: e.target.value})} />
                              <Input type="date" onChange={e => setContractForm({...contractForm, end_date: e.target.value})} />
                            </div>
                            <Button type="submit" className="w-full">Create Contract</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {vendorContracts.length > 0 ? vendorContracts.map(contract => (
                      <div key={contract.id} className="bg-white border rounded-lg p-3">
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-sm text-slate-800">{contract.title}</span>
                          <span className="text-xs font-mono text-slate-500">{contract.contract_number}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mb-2">
                          <span>{contract.start_date} to {contract.end_date}</span>
                          <span className="text-blue-600 font-bold">{formatCurrency(contract.value)}</span>
                        </div>
                        {/* Mock Milestones */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Deliverables Progress</span>
                            <span>65%</span>
                          </div>
                          <Progress value={65} className="h-1" />
                        </div>
                      </div>
                    )) : <div className="text-center py-4 text-slate-400 text-sm">No active contracts</div>}
                  </TabsContent>
                </Tabs>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}