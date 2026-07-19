"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Fade } from "react-awesome-reveal";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Plus, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/Skeleton";
import Drawer from "@/components/ui/Drawer";
import FormField from "@/components/ui/FormField";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

interface SavingsType {
  _id: string;
  name: string;
  balance: number;
}

interface SavingsLog {
  _id: string;
  amount: number;
  type: "deposit" | "withdraw";
  description: string;
  createdAt: string;
}

export default function SavingsPage() {
  const [types, setTypes] = useState<SavingsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [mutating, setMutating] = useState(false);
  const [lastCash, setLastCash] = useState(0);

  // Logs state
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<SavingsLog[]>([]);
  const [viewingType, setViewingType] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, inRes, outRes] = await Promise.all([
        axios.get("/api/savings-types"),
        axios.get("/api/cash?type=in&summary=1"),
        axios.get("/api/cash?type=out&summary=1"),
      ]);
      setTypes(typesRes.data);
      const totalIn = inRes.data.allTimeTotal;
      const totalOut = outRes.data.allTimeTotal;
      setLastCash(totalIn - totalOut);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const amount = parseFloat(form.get("amount") as string);
    const description = form.get("description") as string;

    if (!selectedType || !amount || amount <= 0) {
      toast.error("All fields required");
      return;
    }

    setMutating(true);
    try {
      await axios.post("/api/savings", {
        savingsTypeId: selectedType,
        type: "deposit",
        amount,
        description,
      });
      toast.success("Deposited successfully");
      setDrawerOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    } finally {
      setMutating(false);
    }
  };

  const fetchLogs = async (typeId: string, typeName: string) => {
    try {
      const res = await axios.get(
        `/api/savings?limit=200&savingsTypeId=${typeId}`,
      );
      setLogs(res.data.transactions);
      setViewingType(typeName);
      setLogsOpen(true);
    } catch {
      toast.error("Failed to load logs");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Savings (জমা)</h2>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-dark transition cursor-pointer"
        >
          <Plus size={18} /> Add to Savings
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: types.length + 1 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <Fade cascade damping={0.1} triggerOnce>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Last Cash Card */}
            <div className="bg-purple-500 text-white p-4 rounded-xl shadow">
              <p className="text-sm">Last Cash</p>
              <p className="text-2xl font-bold">৳ {lastCash}</p>
            </div>

            {/* Savings Type Cards */}
            {types.map((t) => (
              <div
                key={t._id}
                className="bg-teal-500 text-white p-4 rounded-xl shadow relative group"
              >
                <p className="text-sm">{t.name}</p>
                <p className="text-2xl font-bold">৳ {t.balance}</p>
                <button
                  onClick={() => fetchLogs(t._id, t.name)}
                  className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 p-1 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  title="View Logs"
                >
                  <Eye size={16} />
                </button>
              </div>
            ))}
          </div>
        </Fade>
      )}

      {/* Drawer for deposit */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add to Savings"
      >
        <form onSubmit={handleDeposit} className="space-y-4">
          <FormField label="Savings Type">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg cursor-pointer"
              required
            >
              <option value="">Select</option>
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} (Balance: ৳{t.balance})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Amount">
            <input
              name="amount"
              type="number"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </FormField>
          <FormField label="Description">
            <textarea
              name="description"
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
          </FormField>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-dark transition cursor-pointer"
          >
            Deposit (জমা করুন)
          </button>
        </form>
      </Drawer>

      {/* Logs Modal */}
      <AnimatePresence>
        {logsOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogsOpen(false)}
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
                    {viewingType} - Transaction Logs
                  </h3>
                  <button
                    onClick={() => setLogsOpen(false)}
                    className="hover:bg-gray-100 p-1 rounded"
                  >
                    <X size={24} />
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
                    {logs.map((log) => (
                      <tr key={log._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm")}
                        </td>
                        <td className="p-2 capitalize">{log.type}</td>
                        <td
                          className={cn(
                            "p-2 font-semibold",
                            log.type === "deposit"
                              ? "text-green-600"
                              : "text-red-600",
                          )}
                        >
                          ৳ {log.amount}
                        </td>
                        <td className="p-2">{log.description || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LoadingOverlay loading={mutating} message="Processing..." />
    </div>
  );
}
