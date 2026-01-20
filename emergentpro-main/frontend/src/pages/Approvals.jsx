import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import {
  FileCheck, AlertTriangle, Clock, ChevronRight, UserCog,
  Shield, CheckCircle2, XCircle, ArrowRight, History,
  Fingerprint, Zap, CornerUpRight
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";

export default function Approvals() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Forms
  const [delegateForm, setDelegateForm] = useState({ delegate_to: "", reason: "Field Duty" });
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [appRes, usersRes] = await Promise.all([
        axios.get(`${API}/approvals`),
        axios.get(`${API}/users`)
      ]);
      setApprovals(appRes.data);
      setUsers(usersRes.data);
    } catch (error) { toast.error("Failed to load governance data"); } 
    finally { setLoading(false); }
  };

  // --- ACTIONS ---

  const handleApprove = async (id) => {
    try {
      await axios.post(`${API}/approvals/${id}/approve`, { comments: "Digitally signed via Command Console" });
      toast.success("Request Approved", { description: "Digital signature attached." });
      fetchData();
    } catch (error) { toast.error("Approval failed"); }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`${API}/approvals/${id}/reject`, { reason: "Strategic Misalignment" });
      toast.success("Request Rejected");
      fetchData();
    } catch (error) { toast.error("Rejection failed"); }
  };

  const handleDelegate = async (id) => {
    try {
      await axios.post(`${API}/approvals/${id}/delegate`, delegateForm);
      toast.success("Authority Delegated");
      setDelegateOpen(false);
      fetchData();
    } catch (error) { toast.error("Delegation failed"); }
  };

  const handleEmergencyOverride = async () => {
    if (!overrideReason) return toast.error("Reason required for override");
    try {
      await axios.post(`${API}/approvals/${selectedRequest.id}/emergency-override`, { reason: overrideReason });
      toast.error("Emergency Override Executed", { description: "This action has been logged in the permanent audit trail." });
      fetchData();
      setSelectedRequest(null);
    } catch (error) { toast.error("Override failed"); }
  };

  // --- HELPERS ---

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const calculateSLA = (deadline) => {
    const now = new Date();
    const due = new Date(deadline);
    const diff = due - now;
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    
    if (hours < 0) return { text: `${Math.abs(hours)}h Overdue`, color: "text-red-600 bg-red-50 border-red-200" };
    if (hours < 24) return { text: `${hours}h Remaining`, color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { text: `${Math.ceil(hours/24)} Days Left`, color: "text-green-600 bg-green-50 border-green-200" };
  };

  if (loading) return <div className="flex justify-center h-96 items-center text-blue-600 animate-pulse">Loading Governance Engine...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase">Workflow Governance</h1>
          <p className="text-slate-500 text-sm mt-1">Approvals, Escalations & Chain of Command</p>
        </div>
        <div className="flex gap-2">
           <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-300">
                <UserCog className="w-4 h-4 mr-2" /> Proxy Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Set Approval Proxy</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-slate-500">Delegate your approval authority for a set duration.</p>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select Officer" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="date" placeholder="From" />
                  <Input type="date" placeholder="Until" />
                </div>
                <Button className="w-full">Activate Proxy</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Pending Action</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-heading">{approvals.filter(a => a.status === 'pending').length}</p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">SLA Breaches</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-red-600">
            {approvals.filter(a => a.status === 'pending' && new Date(a.sla_deadline) < new Date()).length}
          </p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Overrides</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-heading text-amber-500">{approvals.filter(a => a.is_emergency).length}</p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Avg Cycle Time</span>
            <History className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-green-600">1.2 <span className="text-sm font-normal text-slate-400">Days</span></p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="pending">My Actions</TabsTrigger>
          <TabsTrigger value="history">Governance Log</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {approvals.filter(a => a.status === 'pending').map((item) => {
            const sla = calculateSLA(item.sla_deadline);
            return (
              <div key={item.id} className="bg-white border rounded-lg p-6 shadow-sm relative overflow-hidden">
                {/* Left Border for status */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {item.entity_type.toUpperCase()} REQUEST
                      </Badge>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${sla.color}`}>
                        SLA: {sla.text}
                      </span>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-slate-800">{item.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold">Value</p>
                    <p className="text-xl font-heading font-bold text-slate-800">
                      {item.amount ? `₹${item.amount.toLocaleString()}` : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Chain of Command Visualizer */}
                <div className="pl-3 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-heading uppercase tracking-wider">
                    Chain of Command Status
                  </div>
                  <div className="flex items-center w-full max-w-2xl">
                    {/* Step 1: Requester */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">Initiated</span>
                    </div>
                    
                    <div className="h-0.5 flex-1 bg-green-500"></div>

                    {/* Step 2: Current Level (Active) */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                        <span className="text-xs font-bold text-blue-600">L{item.current_level}</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600">Reviewing</span>
                    </div>

                    <div className="h-0.5 flex-1 bg-slate-200"></div>

                    {/* Step 3: Final Approval */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-300">
                        <FileCheck className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Final</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pl-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Requested by: <span className="font-bold">{item.requested_by_name}</span>
                    </span>
                  </div>

                  <div className="flex gap-3">
                    {/* Admin Emergency Override */}
                    {user?.role === 'admin' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs">
                            <Zap className="w-3 h-3 mr-1" /> Emergency Override
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-red-200">
                          <DialogHeader>
                            <DialogTitle className="text-red-600 flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5"/> Emergency Override Protocol
                            </DialogTitle>
                            <DialogDescription>
                              This action bypasses all remaining approval levels. It will be logged in the permanent audit trail.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <label className="text-xs font-bold uppercase text-slate-500">Justification Required</label>
                            <Input 
                              placeholder="Enter operational reason..." 
                              value={overrideReason}
                              onChange={e => setOverrideReason(e.target.value)}
                              className="mt-2"
                            />
                          </div>
                          <Button onClick={() => { setSelectedRequest(item); handleEmergencyOverride(); }} className="w-full bg-red-600 hover:bg-red-700 text-white">
                            Execute Override
                          </Button>
                        </DialogContent>
                      </Dialog>
                    )}

                    <Button variant="outline" className="border-slate-300" onClick={() => handleReject(item.id)}>
                      Reject
                    </Button>
                    
                    <Dialog open={delegateOpen} onOpenChange={setDelegateOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-slate-300">Delegate</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Delegate Authority</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <Select onValueChange={v => setDelegateForm({...delegateForm, delegate_to: v})}>
                            <SelectTrigger><SelectValue placeholder="Select Officer" /></SelectTrigger>
                            <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                          </Select>
                          <Button onClick={() => handleDelegate(item.id)} className="w-full">Confirm Delegation</Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button onClick={() => handleApprove(item.id)} className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-100">
                      <Fingerprint className="w-4 h-4 mr-2" />
                      Digital Sign & Approve
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {approvals.filter(a => a.status === 'pending').length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No pending actions</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b font-heading text-slate-500">
                <tr>
                  <th className="p-4">Request Details</th>
                  <th className="p-4">Initiator</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Digital Signature</th>
                </tr>
              </thead>
              <tbody>
                {approvals.filter(a => a.status !== 'pending').map(item => (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                      {item.is_emergency && <span className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-1"><Zap className="w-3 h-3"/> EMERGENCY OVERRIDE</span>}
                    </td>
                    <td className="p-4 text-slate-600">{item.requested_by_name}</td>
                    <td className="p-4 font-mono">{item.amount ? `₹${item.amount.toLocaleString()}` : "-"}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {item.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {item.status === 'approved' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-slate-400">SIG: {item.id.substring(0, 8).toUpperCase()}...</span>
                          <span className="text-[10px] text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Verified</span>
                        </div>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}