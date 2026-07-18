"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Fade } from "react-awesome-reveal";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Printer,
  Pencil,
  Eye,
  Ban,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

interface Order {
  _id: string;
  uniqueId: string;
  clientId: { _id: string; name: string; mobile: string };
  orderOptionId: { _id: string; name: string; processSteps: string[] };
  amount: number;
  payAmount: number;
  status: string;
  currentStep: string;
  deliveryDate?: string;
  increases: any[];
  repayments: any[];
  statusHistory: any[];
  createdBy: { name: string };
  createdAt: string;
  updatedAt: string;
  successData?: any;
}

// ---------- OrderCards ----------
function OrderCards() {
  const [summary, setSummary] = useState<any>({});
  useEffect(() => {
    axios
      .get("/api/orders?summary=1")
      .then((res) => setSummary(res.data))
      .catch(() => {});
  }, []);

  const cards = [
    { label: "Total Orders", value: summary.totalOrders, color: "bg-blue-500" },
    { label: "Pending", value: summary.pendingOrders, color: "bg-yellow-500" },
    {
      label: "This Month Orders",
      value: summary.thisMonthOrders,
      color: "bg-indigo-500",
    },
    {
      label: "Month Success",
      value: summary.thisMonthSuccess,
      color: "bg-green-500",
    },
    {
      label: "Month Cancel",
      value: summary.thisMonthCancel,
      color: "bg-red-500",
    },
    {
      label: "Month Amount",
      value: `৳ ${summary.thisMonthAmount ?? 0}`,
      color: "bg-purple-500",
    },
    {
      label: "Month Profit",
      value: `৳ ${summary.thisMonthProfit ?? 0}`,
      color: "bg-teal-500",
    },
  ];

  return (
    <Fade cascade damping={0.1} triggerOnce>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn("text-white p-4 rounded-xl shadow", card.color)}
          >
            <p className="text-xs opacity-90">{card.label}</p>
            <p className="text-xl font-bold mt-1">{card.value ?? 0}</p>
          </div>
        ))}
      </div>
    </Fade>
  );
}

// ---------- AddOrderDrawer ----------
function AddOrderDrawer({
  open,
  setOpen,
  refresh,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  refresh: () => void;
}) {
  const [clients, setClients] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [form, setForm] = useState({
    clientId: "",
    orderOptionId: "",
    amount: "",
    payAmount: "",
    deliveryDate: "",
  });

  useEffect(() => {
    if (open) {
      Promise.all([
        axios.get("/api/clients?limit=1000"),
        axios.get("/api/order-options"),
      ]).then(([clRes, optRes]) => {
        setClients(clRes.data.clients || clRes.data);
        setOptions(optRes.data);
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.orderOptionId || !form.amount) {
      toast.error("Client, option, and amount required");
      return;
    }
    try {
      await axios.post("/api/orders", {
        clientId: form.clientId,
        orderOptionId: form.orderOptionId,
        amount: parseFloat(form.amount),
        payAmount: parseFloat(form.payAmount || "0"),
        deliveryDate: form.deliveryDate || null,
      });
      toast.success("Order created");
      setForm({
        clientId: "",
        orderOptionId: "",
        amount: "",
        payAmount: "",
        deliveryDate: "",
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">New Order</h2>
              <button
                onClick={() => setOpen(false)}
                className="hover:bg-gray-100 p-1 rounded"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg cursor-pointer"
                required
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} - {c.mobile}
                  </option>
                ))}
              </select>
              <select
                value={form.orderOptionId}
                onChange={(e) =>
                  setForm({ ...form, orderOptionId: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg cursor-pointer"
                required
              >
                <option value="">Select Order Type</option>
                {options.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Order Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                placeholder="Pay Amount (initial)"
                value={form.payAmount}
                onChange={(e) =>
                  setForm({ ...form, payAmount: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                placeholder="Delivery Date"
                value={form.deliveryDate}
                onChange={(e) =>
                  setForm({ ...form, deliveryDate: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg cursor-pointer"
              />
              <button
                type="submit"
                className="w-full bg-primary text-on-primary py-2.5 rounded-lg hover:bg-primary-dark transition cursor-pointer"
              >
                Create Order
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- StatusDialog ----------
function StatusDialog({
  open,
  setOpen,
  orderId,
  currentStatus,
  refresh,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  orderId: string;
  currentStatus: string;
  refresh: () => void;
}) {
  const [status, setStatus] = useState("");
  const [cause, setCause] = useState("");

  const handleChange = async () => {
    if (!status) return toast.error("Select a status");
    if ((status === "pending" || status === "cancel") && !cause)
      return toast.error("Cause is required");
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status, cause });
      toast.success(`Status changed to ${status}`);
      setOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const availableStatuses = ["process", "pending", "cancel"].filter(
    (s) => s !== currentStatus,
  );

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
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h3 className="text-lg font-semibold mb-4">Change Status</h3>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-3 cursor-pointer"
              >
                <option value="">-- Select --</option>
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {(status === "pending" || status === "cancel") && (
                <input
                  type="text"
                  placeholder="Cause / Reason"
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-3"
                />
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChange}
                  className="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary-dark transition"
                >
                  Change
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- SuccessDialog ----------
function SuccessDialog({
  open,
  setOpen,
  orderId,
  refresh,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  orderId: string;
  refresh: () => void;
}) {
  const [expense, setExpense] = useState("");
  const [paid, setPaid] = useState(true);
  const [lastAmount, setLastAmount] = useState(false);
  const [dueDate, setDueDate] = useState("");

  const handleSuccess = async () => {
    if (!expense) return toast.error("Enter expense");
    try {
      await axios.post(`/api/orders/${orderId}/success`, {
        expense: parseFloat(expense),
        paid,
        lastAmount,
        dueDate: dueDate || null,
      });
      toast.success("Order marked successful");
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
              <h3 className="text-lg font-semibold mb-4">Finalize Order</h3>
              <input
                type="number"
                placeholder="Order Expense"
                value={expense}
                onChange={(e) => setExpense(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-3"
              />
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={paid}
                    onChange={() => setPaid(true)}
                  />{" "}
                  Paid
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!paid}
                    onChange={() => setPaid(false)}
                  />{" "}
                  Not Paid
                </label>
              </div>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lastAmount}
                  onChange={(e) => setLastAmount(e.target.checked)}
                />{" "}
                Add due as receivable
              </label>
              {lastAmount && (
                <input
                  type="date"
                  placeholder="Expected payment date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-3"
                />
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuccess}
                  className="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary-dark transition"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- ViewLogsModal ----------
function ViewLogsModal({
  open,
  setOpen,
  order,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  order: Order | null;
}) {
  if (!order) return null;
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
                <h3 className="text-lg font-semibold">
                  Order Logs - {order.uniqueId}
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="hover:bg-gray-100 p-1 rounded"
                >
                  <X size={24} />
                </button>
              </div>
              <h4 className="font-medium mb-2">Status History</h4>
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Status</th>
                    <th className="p-2">Cause</th>
                    <th className="p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {order.statusHistory.map((h: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 capitalize">{h.status}</td>
                      <td className="p-2">{h.cause || "-"}</td>
                      <td className="p-2">
                        {format(new Date(h.changedAt), "dd/MM/yyyy HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h4 className="font-medium mb-2">Increases</h4>
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Amount</th>
                    <th className="p-2">Cause</th>
                    <th className="p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {order.increases.map((inc: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2">৳ {inc.amount}</td>
                      <td className="p-2">{inc.cause}</td>
                      <td className="p-2">
                        {format(new Date(inc.addedAt), "dd/MM/yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h4 className="font-medium mb-2">Repayments</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Amount</th>
                    <th className="p-2">Method</th>
                    <th className="p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {order.repayments.map((rep: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2">৳ {rep.amount}</td>
                      <td className="p-2">{rep.method}</td>
                      <td className="p-2">
                        {format(new Date(rep.addedAt), "dd/MM/yyyy")}
                      </td>
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

// ---------- EditDrawer (full functionality) ----------
function EditDrawer({
  open,
  setOpen,
  order,
  refresh,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  order: Order | null;
  refresh: () => void;
}) {
  if (!order) return null;
  const [tab, setTab] = useState<"process" | "increase" | "repayment">(
    "process",
  );
  const [processStep, setProcessStep] = useState(order.currentStep || "");
  const [incAmount, setIncAmount] = useState("");
  const [incCause, setIncCause] = useState("");
  const [incDesc, setIncDesc] = useState("");
  const [repAmount, setRepAmount] = useState("");
  const [repMethod, setRepMethod] = useState("cash");
  const [repDesc, setRepDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const processSteps = order.orderOptionId?.processSteps || [];

  const saveProcess = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/orders/${order._id}`, { currentStep: processStep });
      toast.success("Process updated");
      refresh();
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const addIncrease = async () => {
    if (!incAmount) return;
    setSaving(true);
    try {
      await axios.post(`/api/orders/${order._id}/increase`, {
        amount: parseFloat(incAmount),
        cause: incCause,
        description: incDesc,
      });
      toast.success("Increase added");
      setIncAmount("");
      setIncCause("");
      setIncDesc("");
      refresh();
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const addRepayment = async () => {
    if (!repAmount || !repMethod) return;
    setSaving(true);
    try {
      await axios.post(`/api/orders/${order._id}/repayment`, {
        amount: parseFloat(repAmount),
        method: repMethod,
        description: repDesc,
      });
      toast.success("Repayment added");
      setRepAmount("");
      setRepMethod("cash");
      setRepDesc("");
      refresh();
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
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
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl p-6 overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Order {order.uniqueId}</h2>
              <button
                onClick={() => setOpen(false)}
                className="hover:bg-gray-100 p-1 rounded"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex gap-2 mb-6">
              {(["process", "increase", "repayment"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium capitalize transition cursor-pointer",
                    tab === t
                      ? "bg-primary text-white"
                      : "bg-gray-200 hover:bg-gray-300",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "process" && (
              <div className="space-y-4">
                <label className="block font-medium">Current Step</label>
                <select
                  value={processStep}
                  onChange={(e) => setProcessStep(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg cursor-pointer"
                >
                  <option value="">-- Select --</option>
                  {processSteps.map((step: string) => (
                    <option key={step} value={step}>
                      {step}
                    </option>
                  ))}
                </select>
                <button
                  onClick={saveProcess}
                  disabled={saving}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 cursor-pointer"
                >
                  Save Process
                </button>
              </div>
            )}

            {tab === "increase" && (
              <div className="space-y-4">
                <input
                  type="number"
                  placeholder="Amount"
                  value={incAmount}
                  onChange={(e) => setIncAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Cause"
                  value={incCause}
                  onChange={(e) => setIncCause(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <textarea
                  placeholder="Description"
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <button
                  onClick={addIncrease}
                  disabled={saving}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 cursor-pointer"
                >
                  Add Increase
                </button>
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Previous Increases</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-1">Amount</th>
                        <th className="p-1">Cause</th>
                        <th className="p-1">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.increases?.map((inc: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-1">৳ {inc.amount}</td>
                          <td className="p-1">{inc.cause}</td>
                          <td className="p-1">
                            {format(new Date(inc.addedAt), "dd/MM/yyyy")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "repayment" && (
              <div className="space-y-4">
                <input
                  type="number"
                  placeholder="Amount"
                  value={repAmount}
                  onChange={(e) => setRepAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <select
                  value={repMethod}
                  onChange={(e) => setRepMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg cursor-pointer"
                >
                  <option value="cash">Cash</option>
                  <option value="bkash">bKash</option>
                  <option value="bank">Bank</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  placeholder="Description"
                  value={repDesc}
                  onChange={(e) => setRepDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <button
                  onClick={addRepayment}
                  disabled={saving}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 cursor-pointer"
                >
                  Add Repayment
                </button>
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Previous Repayments</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-1">Amount</th>
                        <th className="p-1">Method</th>
                        <th className="p-1">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.repayments?.map((rep: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-1">৳ {rep.amount}</td>
                          <td className="p-1">{rep.method}</td>
                          <td className="p-1">
                            {format(new Date(rep.addedAt), "dd/MM/yyyy")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- Main Orders Content ----------
export default function OrdersContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawer, setEditDrawer] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await axios.get("/api/orders", { params });
      setOrders(res.data.orders);
      setTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, from, to]);

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const dueAmount = (order: Order) => {
    const totalInc = order.increases.reduce((s, i) => s + i.amount, 0);
    const totalRep = order.repayments.reduce((s, r) => s + r.amount, 0);
    return order.amount + totalInc - (order.payAmount + totalRep);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Orders</h2>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-dark transition cursor-pointer"
        >
          <Plus size={18} /> New Order
        </button>
      </div>

      <OrderCards />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-50">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Search Order ID, client name..."
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
          {["submit", "process", "pending", "successful", "cancel"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 border rounded-lg cursor-pointer"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 border rounded-lg cursor-pointer"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={10} />
      ) : (
        <Fade direction="up" triggerOnce>
          <div className="overflow-x-auto bg-white rounded-2xl shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Client</th>
                  <th className="p-3 text-left">Option</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Pay</th>
                  <th className="p-3 text-left">Due</th>
                  <th className="p-3 text-left">Created By</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b hover:bg-gray-50 transition cursor-pointer"
                  >
                    <td className="p-3 font-mono">{order.uniqueId}</td>
                    <td className="p-3">
                      {format(new Date(order.createdAt), "dd/MM/yy")}
                    </td>
                    <td className="p-3">{order.clientId?.name}</td>
                    <td className="p-3">{order.orderOptionId?.name}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium relative group cursor-help",
                          order.status === "successful" &&
                            "bg-green-100 text-green-800",
                          order.status === "cancel" &&
                            "bg-red-100 text-red-800",
                          order.status === "pending" &&
                            "bg-yellow-100 text-yellow-800",
                          order.status === "process" &&
                            "bg-blue-100 text-blue-800",
                          order.status === "submit" &&
                            "bg-gray-100 text-gray-800",
                        )}
                      >
                        {order.status}
                        {order.status === "pending" &&
                          (() => {
                            const lastPending = [...order.statusHistory]
                              .reverse()
                              .find((h: any) => h.status === "pending");
                            return lastPending?.cause ? (
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 w-40 text-center z-10">
                                {lastPending.cause}
                              </span>
                            ) : null;
                          })()}
                      </span>
                    </td>
                    <td className="p-3">৳ {order.amount}</td>
                    <td className="p-3">৳ {order.payAmount}</td>
                    <td
                      className={cn(
                        "p-3 font-semibold",
                        dueAmount(order) > 0
                          ? "text-red-600"
                          : "text-green-600",
                      )}
                    >
                      ৳ {dueAmount(order)}
                    </td>
                    <td className="p-3">{order.createdBy?.name}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setLogsOpen(true);
                          }}
                          title="View Logs"
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>
                        {order.status !== "successful" &&
                          order.status !== "cancel" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setEditDrawer(true);
                                }}
                                title="Edit"
                                className="text-yellow-600 hover:text-yellow-800 cursor-pointer"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setStatusDialog(true);
                                }}
                                title="Change Status"
                                className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
                              >
                                <BadgeCheck size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setSuccessDialog(true);
                                }}
                                title="Mark Successful"
                                className="text-green-600 hover:text-green-800 cursor-pointer"
                              >
                                <Ban size={16} />
                              </button>
                            </>
                          )}
                        <button
                          onClick={() =>
                            window.open(`/orders/${order._id}/print`)
                          }
                          title="Print"
                          className="text-gray-600 hover:text-gray-800 cursor-pointer"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Fade>
      )}

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

      <AddOrderDrawer
        open={drawerOpen}
        setOpen={setDrawerOpen}
        refresh={fetchOrders}
      />
      <EditDrawer
        open={editDrawer}
        setOpen={setEditDrawer}
        order={selectedOrder}
        refresh={fetchOrders}
      />
      <StatusDialog
        open={statusDialog}
        setOpen={setStatusDialog}
        orderId={selectedOrder?._id || ""}
        currentStatus={selectedOrder?.status || ""}
        refresh={fetchOrders}
      />
      <SuccessDialog
        open={successDialog}
        setOpen={setSuccessDialog}
        orderId={selectedOrder?._id || ""}
        refresh={fetchOrders}
      />
      <ViewLogsModal
        open={logsOpen}
        setOpen={setLogsOpen}
        order={selectedOrder}
      />
    </div>
  );
}
