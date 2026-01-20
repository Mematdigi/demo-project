import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import {
  Shield, Lock, Users, Smartphone, Globe, AlertOctagon, 
  Search, Filter, History, Key, CheckCircle2, Ban,
  FileText // <--- ADDED THIS IMPORT
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export default function Security() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersRes = await axios.get(`${API}/users`);
      setUsers(usersRes.data);
      
      // Simulated Audit Logs
      setLogs([
        { id: 1, user: "Col. Rajesh Kumar", action: "ACCESS_GRANTED", resource: "ADS-2024 Budget", level: "top_secret", ip: "10.24.1.5", location: "New Delhi HQ", device: "Secure Terminal 01", time: "2 mins ago" },
        { id: 2, user: "Maj. Priya Singh", action: "ACCESS_DENIED", resource: "Nuclear Codes", level: "top_secret", ip: "192.168.1.105", location: "Remote VPN", device: "Laptop-77", time: "15 mins ago" },
        { id: 3, user: "Capt. Amit Sharma", action: "LOGIN", resource: "System", level: "public", ip: "10.24.2.10", location: "Mumbai Base", device: "Mobile-Secure", time: "1 hour ago" },
        { id: 4, user: "Col. Rajesh Kumar", action: "EDIT", resource: "Project Charter", level: "secret", ip: "10.24.1.5", location: "New Delhi HQ", device: "Secure Terminal 01", time: "2 hours ago" },
        { id: 5, user: "Unknown", action: "BLOCKED_IP", resource: "Firewall", level: "n/a", ip: "45.22.11.9", location: "External", device: "Unknown", time: "4 hours ago" },
      ]);
    } catch (error) { toast.error("Failed to load security protocols"); } 
    finally { setLoading(false); }
  };

  const handleUpdateClearance = async (userId, newLevel) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, clearance_level: newLevel } : u);
    setUsers(updatedUsers);
    toast.success("Clearance Level Updated", { description: "Propagating changes to access control lists..." });
  };

  const getClearanceColor = (level) => {
    switch (level) {
      case 'top_secret': return "bg-red-100 text-red-800 border-red-200";
      case 'secret': return "bg-orange-100 text-orange-800 border-orange-200";
      case 'confidential': return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (loading) return <div className="flex justify-center h-96 items-center text-blue-600 animate-pulse">Initializing Security Protocols...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800 uppercase">Security Command</h1>
          <p className="text-slate-500 text-sm mt-1">Access Control, Classification & Governance</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg">
          <Shield className="w-4 h-4 text-green-400" />
          <span className="text-xs font-mono font-bold tracking-wider">DEFCON 5: NORMAL</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Active Users</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-heading">{users.length}</p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Top Secret Cleared</span>
            <Lock className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-red-600">
            {users.filter(u => u.clearance_level === 'top_secret').length}
          </p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Access Violations</span>
            <AlertOctagon className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-heading text-amber-500">
            {logs.filter(l => l.action === 'ACCESS_DENIED' || l.action === 'BLOCKED_IP').length}
          </p>
        </div>
        <div className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-heading uppercase">Secure Devices</span>
            <Smartphone className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-green-600">142</p>
        </div>
      </div>

      <Tabs defaultValue="access" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="access"><Key className="w-4 h-4 mr-2"/> Access Control</TabsTrigger>
          <TabsTrigger value="audit"><History className="w-4 h-4 mr-2"/> Audit Logs</TabsTrigger>
          <TabsTrigger value="rules"><Globe className="w-4 h-4 mr-2"/> Geo-Fencing</TabsTrigger>
        </TabsList>

        {/* ACCESS CONTROL TAB */}
        <TabsContent value="access">
          <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-heading text-sm font-bold uppercase">Personnel Clearance Matrix</h3>
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search personnel..." 
                  className="pl-8 h-9 bg-white" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-heading text-slate-500">Personnel</th>
                  <th className="text-left p-4 font-heading text-slate-500">Role</th>
                  <th className="text-left p-4 font-heading text-slate-500">Clearance Level</th>
                  <th className="text-left p-4 font-heading text-slate-500">Status</th>
                  <th className="text-left p-4 font-heading text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                  <tr key={u.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">
                      {u.name}
                      <p className="text-xs text-slate-500 font-normal">{u.email}</p>
                    </td>
                    <td className="p-4 capitalize text-slate-600">{u.role}</td>
                    <td className="p-4">
                      <Select 
                        defaultValue={u.clearance_level} 
                        onValueChange={(v) => handleUpdateClearance(u.id, v)}
                        disabled={user?.role !== 'admin'}
                      >
                        <SelectTrigger className={`h-8 w-40 border ${getClearanceColor(u.clearance_level)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="confidential">Confidential</SelectItem>
                          <SelectItem value="secret">Secret</SelectItem>
                          <SelectItem value="top_secret">Top Secret</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm" className="h-8 text-blue-600">Audit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* AUDIT LOGS TAB */}
        <TabsContent value="audit">
          <div className="bg-white border rounded-lg p-5 shadow-sm">
            <h3 className="font-heading text-sm font-bold uppercase mb-4">Real-time Access Logs</h3>
            <div className="space-y-0">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      log.action === 'ACCESS_DENIED' || log.action === 'BLOCKED_IP' ? 'bg-red-100 text-red-600' : 
                      log.action === 'EDIT' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {log.action === 'ACCESS_DENIED' ? <Ban className="w-4 h-4"/> : 
                       log.action === 'EDIT' ? <FileText className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {log.action.replace('_', ' ')} <span className="font-normal text-slate-500">by {log.user}</span>
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {log.device} • {log.ip} • {log.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`mb-1 ${getClearanceColor(log.level)}`}>
                      {log.level.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <p className="text-xs text-slate-400">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* RULES TAB */}
        <TabsContent value="rules">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="font-heading text-sm font-bold uppercase">Geo-Fencing Rules</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Restrict access to specific physical locations for high-clearance data.</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
                  <div>
                    <p className="font-bold text-sm">HQ (New Delhi)</p>
                    <p className="text-xs text-slate-500">Allowed: All Levels</p>
                  </div>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
                  <div>
                    <p className="font-bold text-sm">Remote VPN (India)</p>
                    <p className="text-xs text-slate-500">Allowed: Up to Secret</p>
                  </div>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg">
                  <div>
                    <p className="font-bold text-sm">International IP</p>
                    <p className="text-xs text-slate-500">Allowed: None</p>
                  </div>
                  <Badge variant="destructive">Blocked</Badge>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <h3 className="font-heading text-sm font-bold uppercase">Device Policy</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Enforce device-level authentication and biometrics.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Require Biometrics for Top Secret</span>
                  <input type="checkbox" checked readOnly className="toggle" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Block Unknown Devices</span>
                  <input type="checkbox" checked readOnly className="toggle" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Session Timeout (15 mins)</span>
                  <input type="checkbox" checked readOnly className="toggle" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}