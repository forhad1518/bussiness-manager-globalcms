"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Fade } from "react-awesome-reveal";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Printer,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ---------- Types ----------
interface CashCategory {
  _id: string;
  name: string;
  type: "in" | "out";
}

interface CashTransaction {
  _id: string;
  type: "in" | "out";
  categoryId: { _id: string; name: string };
  amount: number;
  description: string;
  user: { name: string };
  createdAt: string;
}

// ---------- Today In Card ----------
function TodayCard({ amount }: { amount: number }) {
  return (
    <Fade triggerOnce>
      <div className="bg-green-600 text-white p-4 rounded-xl shadow-lg mb-6">
        <p className="text-sm opacity-90">Today In</p>
        <p className="text-3xl font-bold">৳ {amount}</p>
      </div>
    </Fade>
  );
}

// ---------- Add Cash In Drawer ----------
function AddCashDrawer({
  open,
  setOpen,
  refresh,
  type,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  refresh: () => void;
  type: "in" | "out";
}) {
  const [categories, setCategories] = useState<CashCategory[]>([]);
  const [form, setForm] = useState({
    categoryId: "",
    amount: "",
    description: "",
  });

  useEffect(() => {
    if (open) {
      axios
        .get(`/api/cash-categories?type=${type}`)
        .then((res) => setCategories(res.data));
    }
  }, [open, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.amount) {
      toast.error("Category and amount required");
      return;
    }
    try {
      await axios.post("/api/cash", {
        type,
        categoryId: form.categoryId,
        amount: parseFloat(form.amount),
        description: form.description,
      });
      toast.success(`Cash ${type === "in" ? "In" : "Out"} added`);
      setForm({ categoryId: "", amount: "", description: "" });
      setOpen(false);
      refresh();
    } catch {
      toast.error("Failed to add");
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
              <h2 className="text-xl font-bold">
                Add Cash {type === "in" ? "In" : "Out"}
              </h2>
              <button onClick={() => setOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
              <button
                type="submit"
                className="w-full bg-primary text-on-primary py-2.5 rounded-lg hover:bg-primary-dark transition"
              >
                Add
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- Edit Cash Modal ----------
function EditCashModal({
  open,
  setOpen,
  transaction,
  refresh,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  transaction: CashTransaction | null;
  refresh: () => void;
}) {
  const [form, setForm] = useState({ amount: "", description: "" });

  useEffect(() => {
    if (transaction) {
      setForm({
        amount: transaction.amount.toString(),
        description: transaction.description,
      });
    }
  }, [transaction]);

  const handleUpdate = async () => {
    if (!transaction) return;
    try {
      await axios.put(`/api/cash/${transaction._id}`, {
        amount: parseFloat(form.amount),
        description: form.description,
      });
      toast.success("Updated");
      setOpen(false);
      refresh();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <AnimatePresence>
      {open && transaction && (
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
              <h3 className="text-lg font-semibold mb-4">Edit Transaction</h3>
              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg mb-3"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
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

// ---------- Main Cash In Page ----------
export default function CashInPage() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [todayIn, setTodayIn] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<CashTransaction | null>(null);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("");

  const fetchTransactions = useCallback(async () => {
    const params: any = { page, limit: 10, type: "in" };
    if (search) params.search = search;
    if (from) params.from = from;
    if (to) params.to = to;
    if (category) params.category = category;

    const [listRes, summaryRes] = await Promise.all([
      axios.get("/api/cash", { params }),
      axios.get("/api/cash?type=in&summary=1"),
    ]);
    setTransactions(listRes.data.transactions);
    setTotalPages(listRes.data.pagination.totalPages);
    setTodayIn(summaryRes.data.todayTotal);
  }, [page, search, from, to, category]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await axios.delete(`/api/cash/${id}`);
    toast.success("Deleted");
    fetchTransactions();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Cash In</h2>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-dark"
        >
          <Plus size={18} /> Add Cash In
        </button>
      </div>

      <TodayCard amount={todayIn} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-50">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Categories</option>
          {/* We could load categories dynamically, but for now leave static */}
        </select>
      </div>

      {/* Table */}
      <Fade direction="up" triggerOnce>
        <div className="overflow-x-auto bg-white rounded-2xl shadow">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    {format(new Date(txn.createdAt), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="p-3">{txn.categoryId?.name || "-"}</td>
                  <td className="p-3 font-semibold text-green-600">
                    ৳ {txn.amount}
                  </td>
                  <td className="p-3 max-w-50 truncate">
                    {txn.description || "-"}
                  </td>
                  <td className="p-3">{txn.user?.name || "-"}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedTxn(txn);
                        setEditModal(true);
                      }}
                      className="text-blue-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(txn._id)}
                      className="text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Fade>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="p-2 bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <AddCashDrawer
        open={drawerOpen}
        setOpen={setDrawerOpen}
        refresh={fetchTransactions}
        type="in"
      />
      <EditCashModal
        open={editModal}
        setOpen={setEditModal}
        transaction={selectedTxn}
        refresh={fetchTransactions}
      />
    </div>
  );
}
