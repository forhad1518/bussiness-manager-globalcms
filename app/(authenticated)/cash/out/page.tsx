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
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface CashTransaction {
  _id: string;
  categoryId: { _id: string; name: string };
  amount: number;
  description: string;
  user: { name: string };
  createdAt: string;
}

export default function CashOutPage() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<CashTransaction | null>(null);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("");

  // কার্ড ডাটা
  const [profitAmount, setProfitAmount] = useState(0);
  const [todayInAmount, setTodayInAmount] = useState(0);
  const [totalInAmount, setTotalInAmount] = useState(0);
  const [todayOutAmount, setTodayOutAmount] = useState(0);
  const [totalOutAmount, setTotalOutAmount] = useState(0);

  const fetchData = useCallback(async () => {
    const params: any = { page, limit: 10, type: "out" };
    if (search) params.search = search;
    if (from) params.from = from;
    if (to) params.to = to;
    if (category) params.category = category;

    try {
      const [listRes, inSummary, outSummary, profitRes] = await Promise.all([
        axios.get("/api/cash", { params }),
        axios.get("/api/cash?type=in&summary=1"),
        axios.get("/api/cash?type=out&summary=1"),
        axios.get("/api/orders/profit"), // create this next
      ]);

      setTransactions(listRes.data.transactions);
      setTotalPages(listRes.data.pagination.totalPages);
      setTodayInAmount(inSummary.data.todayTotal);
      setTotalInAmount(inSummary.data.allTimeTotal);
      setTodayOutAmount(outSummary.data.todayTotal);
      setTotalOutAmount(outSummary.data.allTimeTotal);
      setProfitAmount(profitRes.data.profit ?? 0);
    } catch (error) {
      toast.error("Failed to fetch data");
    }
  }, [page, search, from, to, category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalAmount = profitAmount + totalInAmount; // Total Amount = Profit + Total Cash In

  // Delete, Edit handlers similar to Cash In (reuse same modal pattern)
  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    await axios.delete(`/api/cash/${id}`);
    toast.success("Deleted");
    fetchData();
  };

  // Edit modal component similar to Cash In's EditCashModal; we can reuse by importing, but I'll keep inline for simplicity.
  // I'll reuse the same EditCashModal component structure from CashInPage, but I'll copy here.

  const EditModal = ({ open, setOpen, txn, refresh }: any) => {
    const [form, setForm] = useState({ amount: "", description: "" });
    useEffect(() => {
      if (txn)
        setForm({
          amount: txn.amount.toString(),
          description: txn.description,
        });
    }, [txn]);

    const handleUpdate = async () => {
      await axios.put(`/api/cash/${txn._id}`, {
        amount: parseFloat(form.amount),
        description: form.description,
      });
      toast.success("Updated");
      setOpen(false);
      refresh();
    };

    return (
      <AnimatePresence>
        {open && txn && (
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
                <h3 className="text-lg font-semibold mb-4">Edit</h3>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg mb-3"
                />
                <textarea
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
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Cash Out</h2>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-dark"
        >
          <Plus size={18} /> Add Cash Out
        </button>
      </div>

      {/* Cards */}
      <Fade cascade damping={0.1} triggerOnce>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-500 text-white p-4 rounded-xl shadow">
            <p className="text-sm">Profit Amount</p>
            <p className="text-2xl font-bold">৳ {profitAmount}</p>
          </div>
          <div className="bg-green-500 text-white p-4 rounded-xl shadow">
            <p className="text-sm">Today In</p>
            <p className="text-2xl font-bold">৳ {todayInAmount}</p>
          </div>
          <div className="bg-purple-500 text-white p-4 rounded-xl shadow">
            <p className="text-sm">Total Amount</p>
            <p className="text-2xl font-bold">৳ {totalAmount}</p>
          </div>
          <div className="bg-red-500 text-white p-4 rounded-xl shadow">
            <p className="text-sm">Total Out</p>
            <p className="text-2xl font-bold">৳ {totalOutAmount}</p>
          </div>
          <div className="bg-orange-500 text-white p-4 rounded-xl shadow">
            <p className="text-sm">Today Out</p>
            <p className="text-2xl font-bold">৳ {todayOutAmount}</p>
          </div>
        </div>
      </Fade>

      {/* Filters (same as Cash In) */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-50">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search..."
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
                  <td className="p-3 font-semibold text-red-600">
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

      {/* Add Cash Out Drawer */}
      <AddCashDrawer
        open={drawerOpen}
        setOpen={setDrawerOpen}
        refresh={fetchData}
        type="out"
      />
      {/* Edit Modal */}
      <EditModal
        open={editModal}
        setOpen={setEditModal}
        txn={selectedTxn}
        refresh={fetchData}
      />
    </div>
  );
}

// Reuse the same AddCashDrawer component (import or duplicate)
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
  const [categories, setCategories] = useState<any[]>([]);
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
                placeholder="Description"
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
