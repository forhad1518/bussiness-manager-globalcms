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
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/Skeleton";
import Drawer from "@/components/ui/Drawer";
import FormField from "@/components/ui/FormField";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useRouter } from "next/navigation";

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
  totalWork: number;
  profit: number;
  createdAt: string;
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

// ---------- Terminate/Reactivate Modal ----------
function StatusModal({
  open,
  onClose,
  action,
  clientName,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  action: "terminate" | "reactivate";
  clientName: string;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    onConfirm(reason);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h3 className="text-lg font-bold mb-2">
                {action === "terminate" ? "Terminate" : "Reactivate"}{" "}
                {clientName}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for{" "}
                {action === "terminate" ? "termination" : "reactivation"}.
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                rows={3}
                placeholder="Reason..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-primary text-white rounded-lg"
                >
                  {action === "terminate" ? "Terminate" : "Reactivate"}
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
  const router = useRouter();

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
            className="fixed inset-0 bg-black/50 z-50"
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
                <button onClick={() => setOpen(false)}>
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
                  className="bg-primary text-white px-4 py-2 rounded"
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
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id} className="border-b hover:bg-gray-50">
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
      toast.error("Name & mobile required");
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
    <Drawer open={open} onClose={() => setOpen(false)} title="Add Client">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Client Name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </FormField>
        <FormField label="Father's Name">
          <input
            type="text"
            value={form.fatherName}
            onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </FormField>
        <FormField label="Mobile">
          <input
            type="text"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </FormField>
        <FormField label="Secondary Mobile">
          <input
            type="text"
            value={form.secondaryMobile}
            onChange={(e) =>
              setForm({ ...form, secondaryMobile: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </FormField>
        <FormField label="Address">
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
          />
        </FormField>
        <button
          type="submit"
          className="w-full bg-primary text-white py-2.5 rounded-lg"
        >
          Add Client
        </button>
      </form>
    </Drawer>
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
        mobile,
        secondaryMobile,
      });
      toast.success("Mobile updated");
      setOpen(false);
      refresh();
    } catch {
      toast.error("Failed");
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
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h3 className="text-lg font-semibold mb-4">Edit Mobile</h3>
              <FormField label="Primary Mobile">
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </FormField>
              <FormField label="Secondary Mobile">
                <input
                  type="text"
                  value={secondaryMobile}
                  onChange={(e) => setSecondaryMobile(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </FormField>
              <div className="flex gap-2 justify-end mt-4">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary text-white rounded-lg"
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

// ---------- Pay Row (with profit/totalWork) ----------
function PayRow({
  client,
  onPay,
  onStatusChange,
  onEditMobile,
  onViewLogs,
}: {
  client: Client;
  onPay: (id: string, amount: number, nextDueDate?: string) => void;
  onStatusChange: (
    action: "terminate" | "reactivate",
    id: string,
    reason: string,
  ) => void;
  onEditMobile: () => void;
  onViewLogs: () => void;
}) {
  const [payInput, setPayInput] = useState("");
  const [loadingPay, setLoadingPay] = useState(false);
  const [nextDueDate, setNextDueDate] = useState("");
  const [showDueDate, setShowDueDate] = useState(false);
  const router = useRouter();

  const handlePay = async () => {
    const amt = parseFloat(payInput);
    if (!amt || amt <= 0) {
      toast.error("Invalid amount");
      return;
    }
    setLoadingPay(true);
    try {
      await onPay(client._id, amt, showDueDate ? nextDueDate : undefined);
      setPayInput("");
      setNextDueDate("");
      setShowDueDate(false);
    } finally {
      setLoadingPay(false);
    }
  };

  const handleOrderFilter = () => {
    router.push(`/orders?search=${encodeURIComponent(client.name)}`);
  };

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
            className="text-blue-500 hover:text-blue-700"
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
      <td className="p-3">৳ {client.totalWork}</td>
      <td className="p-3 font-semibold text-green-600">৳ {client.profit}</td>
      <td className="p-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              placeholder="Pay"
              value={payInput}
              onChange={(e) => setPayInput(e.target.value)}
              className="w-20 px-2 py-1 border rounded text-sm"
            />
            <button
              onClick={handlePay}
              disabled={loadingPay}
              className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
            >
              <DollarSign size={14} />
            </button>
          </div>
          {parseFloat(payInput) > 0 &&
            client.dueAmount - parseFloat(payInput) > 0 && (
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
                <span className="text-gray-500">Next due</span>
              </div>
            )}
        </div>
      </td>
      <td className="p-3">
        <div className="flex gap-2">
          <button
            onClick={handleOrderFilter}
            title="View Orders"
            className="text-indigo-600 hover:text-indigo-800"
          >
            <ShoppingCart size={16} />
          </button>
          <button
            onClick={onViewLogs}
            title="View Logs"
            className="text-blue-600 hover:text-blue-800"
          >
            <Eye size={16} />
          </button>
          {client.status === "active" ? (
            <button
              onClick={() => onStatusChange("terminate", client._id, "")}
              title="Terminate"
              className="text-red-500 hover:text-red-700"
            >
              <Ban size={16} />
            </button>
          ) : (
            <button
              onClick={() => onStatusChange("reactivate", client._id, "")}
              title="Reactivate"
              className="text-green-600 hover:text-green-800"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------- Main Page ----------
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMobileOpen, setEditMobileOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsClientId, setLogsClientId] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<"terminate" | "reactivate">(
    "terminate",
  );
  const [statusTargetId, setStatusTargetId] = useState<string>("");
  const [statusClientName, setStatusClientName] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mutating, setMutating] = useState(false);
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
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handlePay = async (id: string, amount: number, dueDate?: string) => {
    setMutating(true);
    try {
      await axios.patch(`/api/clients/${id}`, {
        action: "pay",
        amount,
        nextDueDate: dueDate,
      });
      toast.success("Payment recorded");
      fetchClients();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Payment failed");
    } finally {
      setMutating(false);
    }
  };

  const handleStatusAction = (
    action: "terminate" | "reactivate",
    id: string,
  ) => {
    const client = clients.find((c) => c._id === id);
    setStatusAction(action);
    setStatusTargetId(id);
    setStatusClientName(client?.name || "");
    setStatusModalOpen(true);
  };

  const handleStatusConfirm = async (reason: string) => {
    setMutating(true);
    try {
      await axios.patch(`/api/clients/${statusTargetId}`, {
        action: statusAction,
        reason,
      });
      toast.success(`${statusAction} successful`);
      setStatusModalOpen(false);
      fetchClients();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    } finally {
      setMutating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Clients</h2>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
        >
          <Plus size={18} /> Add Client
        </button>
      </div>

      <ClientCards summary={summary} />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-50">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Search..."
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
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={12} />
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
                  <th className="p-3 text-left">Work</th>
                  <th className="p-3 text-left">Profit</th>
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
                    onStatusChange={(action, id) =>
                      handleStatusAction(action, id)
                    }
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

      <div className="flex justify-between mt-4">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 bg-gray-100 rounded"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 bg-gray-100 rounded"
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
      <StatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        action={statusAction}
        clientName={statusClientName}
        onConfirm={handleStatusConfirm}
      />
      <LoadingOverlay loading={mutating} />
    </div>
  );
}
