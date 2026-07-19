"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Fade } from "react-awesome-reveal";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import Drawer from "@/components/ui/Drawer";
import FormField from "@/components/ui/FormField";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

// ---------- Types ----------
interface CashCategory {
  _id: string;
  name: string;
}

interface CashTransaction {
  _id: string;
  categoryId: { _id: string; name: string } | null;
  amount: number;
  description: string;
  user: { name: string };
  createdAt: string;
}

interface SavingsType {
  _id: string;
  name: string;
  balance: number;
}

export default function CashOutPage() {
  // Data states
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // UI states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<CashTransaction | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Data for dropdowns & balances
  const [categories, setCategories] = useState<CashCategory[]>([]);
  const [savingsTypes, setSavingsTypes] = useState<SavingsType[]>([]);

  // Balances
  const [todayInAmount, setTodayInAmount] = useState(0);
  const [todayOutAmount, setTodayOutAmount] = useState(0);
  const [totalInAmount, setTotalInAmount] = useState(0);
  const [totalOutAmount, setTotalOutAmount] = useState(0);
  const [profitAmount, setProfitAmount] = useState(0);

  // Global loading overlay for mutations
  const [mutating, setMutating] = useState(false);

  // Source selection for Cash Out
  const [sourceType, setSourceType] = useState<string>("lastCash"); // "lastCash" or savingsType._id

  // Derived last cash
  const lastCash = totalInAmount - totalOutAmount;

  // 1 hour delete check
  const canDelete = (txn: CashTransaction) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(txn.createdAt) > oneHourAgo;
  };

  // Get available balance for selected source
  const getAvailableBalance = (): number => {
    if (sourceType === "lastCash") return lastCash;
    const st = savingsTypes.find((s) => s._id === sourceType);
    return st ? st.balance : 0;
  };

  // ---------- Fetch Functions ----------
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get("/api/cash-categories?type=out");
      setCategories(res.data);
    } catch {}
  }, []);

  const fetchSavingsTypes = useCallback(async () => {
    try {
      const res = await axios.get("/api/savings-types");
      setSavingsTypes(res.data);
    } catch {}
  }, []);

  const fetchBalances = useCallback(async () => {
    try {
      const [inSummary, outSummary, profitRes] = await Promise.all([
        axios.get("/api/cash?type=in&summary=1"),
        axios.get("/api/cash?type=out&summary=1"),
        axios.get("/api/orders/profit"),
      ]);
      setTodayInAmount(inSummary.data.todayTotal);
      setTotalInAmount(inSummary.data.allTimeTotal);
      setTodayOutAmount(outSummary.data.todayTotal);
      setTotalOutAmount(outSummary.data.allTimeTotal);
      setProfitAmount(profitRes.data.profit ?? 0);
    } catch {}
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10, type: "out" };
      if (search) params.search = search;
      if (from) params.from = from;
      if (to) params.to = to;
      if (categoryFilter) params.category = categoryFilter;

      const res = await axios.get("/api/cash", { params });
      setTransactions(res.data.transactions);
      setTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [page, search, from, to, categoryFilter]);

  // Initial loads
  useEffect(() => {
    fetchCategories();
    fetchSavingsTypes();
    fetchBalances();
  }, [fetchCategories, fetchSavingsTypes, fetchBalances]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ---------- Handlers ----------
  const handleDelete = async (id: string) => {
    setMutating(true);
    try {
      await axios.delete(`/api/cash/${id}`);
      toast.success("Deleted");
      fetchTransactions();
      fetchBalances();
    } catch {
      toast.error("Delete failed");
    } finally {
      setMutating(false);
    }
  };

  const handleEdit = (txn: CashTransaction) => {
    setSelectedTxn(txn);
    setEditModalOpen(true);
  };

  const handleEditSave = async (amount: number, description: string) => {
    if (!selectedTxn) return;
    setMutating(true);
    try {
      await axios.put(`/api/cash/${selectedTxn._id}`, { amount, description });
      toast.success("Updated");
      setEditModalOpen(false);
      fetchTransactions();
      fetchBalances();
    } catch {
      toast.error("Update failed");
    } finally {
      setMutating(false);
    }
  };

  const handleAddCashOut = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const categoryId = form.get("categoryId") as string;
    const amount = parseFloat(form.get("amount") as string);
    const description = form.get("description") as string;

    if (!categoryId || !amount || amount <= 0) {
      toast.error("Category and amount required");
      return;
    }

    const available = getAvailableBalance();
    if (amount > available) {
      toast.error(`Insufficient balance. Available: ৳${available}`);
      return;
    }

    setMutating(true);
    try {
      if (sourceType === "lastCash") {
        // Regular cash out from last cash
        await axios.post("/api/cash", {
          type: "out",
          categoryId,
          amount,
          description,
        });
      } else {
        // Withdraw from savings
        await axios.post("/api/savings", {
          savingsTypeId: sourceType,
          type: "withdraw",
          amount,
          description: description || "",
        });
      }
      toast.success("Cash Out added");
      setDrawerOpen(false);
      fetchTransactions();
      fetchBalances();
      fetchSavingsTypes(); // refresh savings balances
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    } finally {
      setMutating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Cash Out</h2>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-dark transition cursor-pointer"
        >
          <Plus size={18} /> Add Cash Out
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
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
              <p className="text-sm">Last Cash</p>
              <p className="text-2xl font-bold">৳ {lastCash}</p>
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
      )}

      {/* Filters */}
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
          className="px-3 py-2 border rounded-lg cursor-pointer"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 border rounded-lg cursor-pointer"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border rounded-lg cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table or Skeleton */}
      {loading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : (
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
                  <tr
                    key={txn._id}
                    className="border-b hover:bg-gray-50 transition cursor-pointer"
                  >
                    <td className="p-3">
                      {format(new Date(txn.createdAt), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="p-3">
                      {txn.categoryId?.name || "Withdraw"}
                    </td>
                    <td className="p-3 font-semibold text-red-600">
                      ৳ {txn.amount}
                    </td>
                    <td className="p-3 max-w-50 truncate">
                      {txn.description || "-"}
                    </td>
                    <td className="p-3">{txn.user?.name || "-"}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(txn)}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        <Pencil size={16} />
                      </button>
                      {canDelete(txn) && (
                        <button
                          onClick={() => {
                            setDeleteId(txn._id);
                            setDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Fade>
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

      {/* Add Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Cash Out"
      >
        <form onSubmit={handleAddCashOut} className="space-y-4">
          <FormField label="From">
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg cursor-pointer"
            >
              <option value="lastCash">Last Cash (৳ {lastCash})</option>
              {savingsTypes.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} (৳ {st.balance})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Category">
            <select
              name="categoryId"
              className="w-full px-3 py-2 border rounded-lg cursor-pointer"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
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
              rows={3}
            />
          </FormField>
          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-2.5 rounded-lg hover:bg-primary-dark transition cursor-pointer"
          >
            Add Cash Out
          </button>
        </form>
      </Drawer>

      {/* Edit Modal */}
      <EditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        transaction={selectedTxn}
        onSave={handleEditSave}
      />

      {/* Delete Confirm */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
          setDeleteModalOpen(false);
        }}
      />

      <LoadingOverlay loading={mutating} message="Processing..." />
    </div>
  );
}

// ---------- Edit Modal Component ----------
function EditModal({
  open,
  onClose,
  transaction,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  transaction: CashTransaction | null;
  onSave: (amount: number, desc: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setDesc(transaction.description || "");
    }
  }, [transaction]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
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
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h3 className="text-lg font-semibold mb-4">Edit Transaction</h3>
              <FormField label="Amount">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </FormField>
              <FormField label="Description">
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </FormField>
              <div className="flex gap-2 justify-end mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSave(Number(amount), desc)}
                  className="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer"
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
