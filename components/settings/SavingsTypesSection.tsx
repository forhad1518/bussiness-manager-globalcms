"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Trash2, DollarSign } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function SavingsTypesSection() {
  const [types, setTypes] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    const res = await axios.get("/api/savings-types");
    setTypes(res.data);
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const addType = async () => {
    if (!newName.trim()) return;
    try {
      await axios.post("/api/savings-types", { name: newName.trim() });
      toast.success("Savings type added");
      setNewName("");
      fetchTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const deleteType = async (id: string) => {
    try {
      await axios.delete(`/api/savings-types/${id}`);
      toast.success("Savings type deleted");
      fetchTypes();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center">
          <DollarSign size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Savings Types</h3>
          <p className="text-sm text-gray-500">
            Manage your savings categories
          </p>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="New savings type"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addType()}
          className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
        />
        <button
          onClick={addType}
          className="bg-linear-to-r from-teal-500 to-teal-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition"
        >
          <Plus size={18} />
        </button>
      </div>
      <ul className="space-y-2">
        {types.map((t) => (
          <li
            key={t._id}
            className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            <span className="font-medium">{t.name}</span>
            <button
              onClick={() => setConfirmDelete(t._id)}
              className="text-gray-400 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Savings Type"
        message="Are you sure you want to delete this savings type?"
        onConfirm={() => {
          if (confirmDelete) deleteType(confirmDelete);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
