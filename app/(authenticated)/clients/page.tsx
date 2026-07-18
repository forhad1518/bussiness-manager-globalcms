"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Fade, Slide } from "react-awesome-reveal";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  DollarSign,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/Skeleton";

// Types
interface Client {
  _id: string;
  name: string;
  fatherName: string;
  mobile: string;
  secondaryMobile: string;
  address: string;
  dueAmount: number;
  status: "active" | "terminated";
  nextDueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- Card Section ----------
function ClientCards({ summary }: { summary: any }) {
  const cards = [
    {
      label: "Total Clients",
      value: summary?.totalClients ?? 0,
      color: "bg-blue-500",
    },
    {
      label: "Non-Paid",
      value: summary?.nonPaidClients ?? 0,
      color: "bg-orange-500",
    },
    { label: "Paid", value: summary?.paidClients ?? 0, color: "bg-green-500" },
    {
      label: "Terminated",
      value: summary?.terminatedClients ?? 0,
      color: "bg-gray-500",
    },
    {
      label: "Total Due",
      value: `৳ ${summary?.totalDue ?? 0}`,
      color: "bg-red-500",
    },
  ];

  return (
    <Fade cascade damping={0.1} triggerOnce>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn("text-white p-4 rounded-xl shadow-lg", card.color)}
          >
            <p className="text-sm opacity-90">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>
    </Fade>
  );
}

// ---------- Add Client Drawer ----------
function AddClientDrawer({
  open,
  setOpen,
  refresh,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  refresh: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    fatherName: "",
    mobile: "",
    secondaryMobile: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mobile) {
      toast.error("Name and mobile are required");
      return;
    }
    try {
      await axios.post("/api/clients", form);
      toast.success("Client added");
      setForm({
        name: "",
        fatherName: "",
        mobile: "",
        secondaryMobile: "",
        address: "",
      });
      setOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl p-6 overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Add Client</h2>
              <button
                onClick={() => setOpen(false)}
                className="hover:bg-gray-100 p-1 rounded"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Client Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Father's Name"
                value={form.fatherName}
                onChange={(e) =>
                  setForm({ ...form, fatherName: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Mobile *"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Secondary Mobile"
                value={form.secondaryMobile}
                onChange={(e) =>
                  setForm({ ...form, secondaryMobile: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
              <button
                type="submit"
                className="w-full bg-primary text-on-primary py-2.5 rounded-lg hover:bg-primary-dark transition cursor-pointer"
              >
                Add Client
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- Edit Mobile Modal ----------
function EditMobileModal({
  open,
  setOpen,
  client,
  refresh,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  client: Client | null;
  refresh: () => void;
}) {
  const [mobile, setMobile] = useState("");
  const [secondaryMobile, setSecondaryMobile] = useState("");
  const [type, setType] = useState<"mobile" | "secondary">("mobile");

  useEffect(() => {
    if (client) {
      setMobile(client.mobile);
      setSecondaryMobile(client.secondaryMobile);
    }
  }, [client]);

  const handleSave = async () => {
    if (!client) return;
    try {
      await axios.patch(`/api/clients/${client._id}`, {
        action: "update-mobile",
        mobile: type === "mobile" ? mobile : undefined,
        secondaryMobile: type === "secondary" ? secondaryMobile : undefined,
      });
      toast.success("Mobile updated");
      setOpen(false);
      refresh();
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <AnimatePresence>
      {open && client && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h3 className="text-lg font-semibold mb-4">Edit Mobile</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setType("mobile")}
                  className={cn(
                    "px-3 py-1 rounded cursor-pointer transition",
                    type === "mobile"
                      ? "bg-primary text-white"
                      : "bg-gray-200 hover:bg-gray-300",
                  )}
                >
                  Primary
                </button>
                <button
                  onClick={() => setType("secondary")}
                  className={cn(
                    "px-3 py-1 rounded cursor-pointer transition",
                    type === "secondary"
                      ? "bg-primary text-white"
                      : "bg-gray-200 hover:bg-gray-300",
                  )}
                >
                  Secondary
                </button>
              </div>
              <input
                type="text"
                value={type === "mobile" ? mobile : secondaryMobile}
                onChange={(e) =>
                  type === "mobile"
                    ? setMobile(e.target.value)
                    : setSecondaryMobile(e.target.value)
                }
                className="w-full px-3 py-2 border rounded-lg mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary-dark transition"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- View Logs Modal ----------
function ViewLogsModal({
  open,
  setOpen,
  clientId,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  clientId: string | null;
}) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchLogs = useCallback(async () => {
    if (!clientId) return;
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await axios.get(`/api/clients/${clientId}/transactions`, {
      params,
    });
    setTransactions(res.data.transactions);
  }, [clientId, from, to]);

  useEffect(() => {
    if (open) fetchLogs();
  }, [open, fetchLogs]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Client Logs</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="hover:bg-gray-100 p-1 rounded"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="px-3 py-2 border rounded"
                />
                <button
                  onClick={fetchLogs}
                  className="bg-primary text-white px-4 py-2 rounded cursor-pointer hover:bg-primary-dark transition"
                >
                  Filter
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Amount</th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-left">By</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr
                      key={t._id}
                      className="border-b hover:bg-gray-50 transition cursor-pointer"
                    >
                      <td className="p-2">
                        {format(new Date(t.createdAt), "dd/MM/yyyy")}
                      </td>
                      <td className="p-2 capitalize">
                        {t.type.replace("_", " ")}
                      </td>
                      <td className="p-2">
                        {t.amount ? `৳ ${t.amount}` : "-"}
                      </td>
                      <td className="p-2">{t.description}</td>
                      <td className="p-2">{t.createdBy?.name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- Pay Row (improved) ----------
function PayRow({
  client,
  onPay,
  onTerminate,
  onEditMobile,
  onViewLogs,
}: {
  client: Client;
  onPay: (id: string, amount: number) => void;
  onTerminate: (client: Client) => void;
  onEditMobile: () => void;
  onViewLogs: () => void;
}) {
  const [payInput, setPayInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDueDate, setShowDueDate] = useState(false);
  const [nextDueDate, setNextDueDate] = useState("");

  const handlePay = async () => {
    const amount = parseFloat(payInput);
    if (!amount || amount <= 0) return toast.error("Enter valid amount");
    setLoading(true);
    try {
      const payload: any = { action: "pay", amount };
      if (showDueDate && nextDueDate) {
        payload.nextDueDate = nextDueDate;
      }
      await axios.patch(`/api/clients/${client._id}`, payload);
      toast.success(`Paid ৳${amount}`);
      setPayInput("");
      setNextDueDate("");
      setShowDueDate(false);
      onPay(client._id, amount);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const remainingDue = client.dueAmount - parseFloat(payInput || "0");

  return (
    <tr className="border-b hover:bg-gray-50 transition cursor-pointer">
      <td className="p-3 font-mono text-xs">{client._id.slice(-6)}</td>
      <td className="p-3">{format(new Date(client.createdAt), "dd/MM/yy")}</td>
      <td className="p-3 font-medium">{client.name}</td>
      <td className="p-3">{client.fatherName || "-"}</td>
      <td className="p-3">
        <div className="flex items-center gap-1">
          <span>{client.mobile}</span>
          <button
            onClick={onEditMobile}
            className="text-blue-500 hover:text-blue-700 cursor-pointer"
          >
            <Pencil size={14} />
          </button>
        </div>
        {client.secondaryMobile && (
          <div className="text-xs text-gray-500">{client.secondaryMobile}</div>
        )}
      </td>
      <td className="p-3 max-w-37.5 truncate">{client.address || "-"}</td>
      <td className="p-3 font-semibold text-red-600">৳ {client.dueAmount}</td>
      <td className="p-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              placeholder="Amount"
              value={payInput}
              onChange={(e) => setPayInput(e.target.value)}
              className="w-20 px-2 py-1 border rounded text-sm"
              disabled={loading}
            />
            <button
              onClick={handlePay}
              disabled={loading}
              className="bg-green-500 text-white p-1 rounded hover:bg-green-600 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "..." : <DollarSign size={14} />}
            </button>
          </div>
          {parseFloat(payInput) > 0 && remainingDue > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => {
                  setNextDueDate(e.target.value);
                  setShowDueDate(true);
                }}
                className="border rounded px-1 py-0.5 w-28"
              />
              <span className="text-gray-500">Next due date</span>
            </div>
          )}
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onViewLogs}
            className="text-blue-600 hover:text-blue-800 cursor-pointer"
            title="View Logs"
          >
            <Eye size={18} />
          </button>
          {client.status === "active" && (
            <button
              onClick={() => onTerminate(client)}
              className="text-red-500 hover:text-red-700 cursor-pointer"
              title="Terminate"
            >
              <Ban size={18} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------- Main Clients Page ----------
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMobileOpen, setEditMobileOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsClientId, setLogsClientId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const [listRes, summaryRes] = await Promise.all([
        axios.get("/api/clients", { params }),
        axios.get("/api/clients?summary=1"),
      ]);
      setClients(listRes.data.clients);
      setTotalPages(listRes.data.pagination.totalPages);
      setSummary(summaryRes.data);
    } catch (err) {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handlePay = (clientId: string, amount: number) => {
    // Refresh list after payment (already handled in PayRow via onPay prop)
    fetchClients();
  };

  const handleTerminate = async (client: Client) => {
    if (!confirm(`Terminate ${client.name}?`)) return;
    try {
      await axios.patch(`/api/clients/${client._id}`, { action: "terminate" });
      toast.success(`${client.name} terminated`);
      fetchClients();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Clients</h2>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-dark transition cursor-pointer"
        >
          <Plus size={18} /> Add Client
        </button>
      </div>

      {/* Cards */}
      <ClientCards summary={summary} />

      {/* Filter & Search */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-50">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name, mobile, father..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded-lg cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Table or Skeleton */}
      {loading ? (
        <TableSkeleton rows={5} cols={9} />
      ) : (
        <Slide direction="up" triggerOnce>
          <div className="overflow-x-auto bg-white rounded-2xl shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Father</th>
                  <th className="p-3 text-left">Mobile</th>
                  <th className="p-3 text-left">Address</th>
                  <th className="p-3 text-left">Due</th>
                  <th className="p-3 text-left">Pay</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <PayRow
                    key={client._id}
                    client={client}
                    onPay={handlePay}
                    onTerminate={handleTerminate}
                    onEditMobile={() => {
                      setSelectedClient(client);
                      setEditMobileOpen(true);
                    }}
                    onViewLogs={() => {
                      setLogsClientId(client._id);
                      setLogsOpen(true);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Slide>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="p-2 bg-gray-100 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-gray-200 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 bg-gray-100 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-gray-200 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <AddClientDrawer
        open={drawerOpen}
        setOpen={setDrawerOpen}
        refresh={fetchClients}
      />
      <EditMobileModal
        open={editMobileOpen}
        setOpen={setEditMobileOpen}
        client={selectedClient}
        refresh={fetchClients}
      />
      <ViewLogsModal
        open={logsOpen}
        setOpen={setLogsOpen}
        clientId={logsClientId}
      />
    </div>
  );
}
