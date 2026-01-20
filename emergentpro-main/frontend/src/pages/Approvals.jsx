import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { Check, X, Clock, FileCheck, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

export default function Approvals() {
  const { user } = useAuth(); // Get logged in user
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", amount: 0, entity_type: "budget", entity_id: "demo-id" });

  useEffect(() => { fetchApprovals(); }, []);

  const fetchApprovals = async () => {
    try {
      const res = await axios.get(`${API}/approvals`);
      setApprovals(res.data);
    } catch (error) { toast.error("Failed to load approvals"); } 
    finally { setLoading(false); }
  };

  const handleAction = async (id, action) => {
    try {
      await axios.post(`${API}/approvals/${id}/${action}`, action === 'reject' ? { reason: "Demo rejection" } : { comments: "Approved via dashboard" });
      toast.success(`Request ${action}ed`);
      fetchApprovals();
    } catch (e) { toast.error("Action failed"); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/approvals`, { ...formData, sla_hours: 48 });
      toast.success("Request submitted");
      setIsDialogOpen(false);
      fetchApprovals();
    } catch (e) { toast.error("Failed to submit request"); }
  };

  if (loading) return <div className="p-8 text-center text-blue-600">Loading Workflows...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase">Approval Workflow</h1>
          <p className="text-slate-500 text-sm">Pending actions and request history</p>
        </div>
        {/* Managers can create requests */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-heading uppercase">
              <Plus className="w-4 h-4 mr-2" /> New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle>Submit Approval Request</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input placeholder="Title (e.g. Emergency Funds)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <Input placeholder="Amount (₹)" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} required />
              <Button type="submit" className="w-full bg-blue-600 text-white">Submit for Approval</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {approvals.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex justify-between items-center">
            <div className="flex items-start gap-4">
              <div className={`mt-1 p-2 rounded-lg ${item.status === 'pending' ? 'bg-amber-100 text-amber-600' : item.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {item.status === 'pending' ? <Clock className="w-5 h-5" /> : item.status === 'approved' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-medium text-slate-800">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Requested by <span className="font-medium">{item.requested_by_name || "Unknown"}</span> • ₹{item.amount?.toLocaleString()}
                </p>
                {item.status === 'approved' && (
                  <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                    <FileCheck className="w-3 h-3" /> Digitally Signed
                  </p>
                )}
              </div>
            </div>

            {/* ONLY ADMINS SEE THESE BUTTONS */}
            {user?.role === 'admin' && item.status === 'pending' && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleAction(item.id, 'reject')}>Reject</Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(item.id, 'approve')}>Approve</Button>
              </div>
            )}
            
            {/* MANAGERS SEE STATUS ONLY */}
            {user?.role !== 'admin' && item.status === 'pending' && (
              <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">Awaiting Command</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}