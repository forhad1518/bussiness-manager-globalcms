"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Fade } from "react-awesome-reveal";
import toast from "react-hot-toast";
import {
  Save,
  Plus,
  X,
  GripVertical,
  Trash2,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  Key,
  Edit,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ==================== Confirm Modal ====================
function ConfirmModal({
  open,
  setOpen,
  title,
  message,
  onConfirm,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  title: string;
  message: string;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
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
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{message}</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="px-6 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    setOpen(false);
                  }}
                  className="px-6 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition cursor-pointer"
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

// ==================== Print Heading ====================
function PrintHeadingForm() {
  const [form, setForm] = useState({
    storeName: "",
    storeAddress: "",
    proprietorName: "",
    mobile: "",
    watermark: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get("/api/settings").then((res) => {
      if (res.data) setForm(res.data);
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put("/api/settings", form);
      toast.success("Print heading saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-linear-to-br from-primary to-primary-dark flex items-center justify-center">
          <Save size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Print Heading</h3>
          <p className="text-sm text-gray-500">
            Customize your document header
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Store Name"
          value={form.storeName}
          onChange={(e) => setForm({ ...form, storeName: e.target.value })}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 transition"
        />
        <input
          type="text"
          placeholder="Store Address"
          value={form.storeAddress}
          onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 transition"
        />
        <input
          type="text"
          placeholder="Proprietor Name"
          value={form.proprietorName}
          onChange={(e) => setForm({ ...form, proprietorName: e.target.value })}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 transition"
        />
        <input
          type="text"
          placeholder="Mobile"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 transition"
        />
        <input
          type="text"
          placeholder="Watermark Text"
          value={form.watermark}
          onChange={(e) => setForm({ ...form, watermark: e.target.value })}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 transition md:col-span-2"
        />
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-linear-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
        >
          <Save size={18} /> {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}

// ==================== Cash Categories ====================
function CashCategories({ type }: { type: "in" | "out" }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    const res = await axios.get(`/api/cash-categories?type=${type}`);
    setCategories(res.data);
  }, [type]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      try {
        await axios.post("/api/cash-categories", { name: input.trim(), type });
        setInput("");
        fetchCategories();
        toast.success(
          `${type === "in" ? "Cash In" : "Cash Out"} category added`,
        );
      } catch {
        toast.error("Failed to add");
      }
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await axios.delete(`/api/cash-categories/${id}`);
      fetchCategories();
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center",
            type === "in"
              ? "bg-linear-to-br from-green-500 to-green-600"
              : "bg-linear-to-br from-red-500 to-red-600",
          )}
        >
          {type === "in" ? (
            <Plus size={20} className="text-white" />
          ) : (
            <Trash2 size={20} className="text-white" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Cash {type === "in" ? "In" : "Out"} Categories
          </h3>
          <p className="text-sm text-gray-500">Press Enter to add</p>
        </div>
      </div>
      <input
        type="text"
        placeholder={`Add ${type === "in" ? "in" : "out"} category...`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={addCategory}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 transition mb-4"
      />
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {categories.map((cat) => (
          <motion.li
            key={cat._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            <span className="text-gray-800 font-medium">{cat.name}</span>
            <button
              onClick={() => setConfirmDelete(cat._id)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </motion.li>
        ))}
      </ul>
      <ConfirmModal
        open={!!confirmDelete}
        setOpen={() => setConfirmDelete(null)}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        onConfirm={() => confirmDelete && deleteCategory(confirmDelete)}
      />
    </div>
  );
}

// ==================== Sortable Step ====================
function SortableStep({
  step,
  onDelete,
}: {
  step: string;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: step });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between bg-white border border-gray-200 px-4 py-3 rounded-xl shadow-sm"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="active:cursor-grabbing text-gray-400 hover:text-primary transition"
        >
          <GripVertical size={18} />
        </button>
        <span className="text-gray-800 font-medium">{step}</span>
      </div>
      <button
        onClick={onDelete}
        className="text-gray-400 hover:text-red-500 transition cursor-pointer"
      >
        <X size={18} />
      </button>
    </div>
  );
}

// ==================== Order Options ====================
function OrderOptionsSection() {
  const [options, setOptions] = useState<any[]>([]);
  const [newOption, setNewOption] = useState("");
  const [processInputs, setProcessInputs] = useState<Record<string, string>>(
    {},
  );
  const [confirmDeleteOption, setConfirmDeleteOption] = useState<string | null>(
    null,
  );

  const fetchOptions = useCallback(async () => {
    const res = await axios.get("/api/order-options");
    setOptions(res.data);
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const addOption = async () => {
    if (!newOption.trim()) return;
    try {
      await axios.post("/api/order-options", { name: newOption.trim() });
      setNewOption("");
      fetchOptions();
      toast.success("Order type added");
    } catch {
      toast.error("Failed to add");
    }
  };

  const addStep = async (optionId: string) => {
    const step = processInputs[optionId]?.trim();
    if (!step) return;
    const option = options.find((o) => o._id === optionId);
    if (!option) return;
    const updatedSteps = [...option.processSteps, step];
    try {
      await axios.put(`/api/order-options/${optionId}`, {
        processSteps: updatedSteps,
      });
      setProcessInputs({ ...processInputs, [optionId]: "" });
      fetchOptions();
      toast.success("Step added");
    } catch {
      toast.error("Failed to add step");
    }
  };

  const removeStep = async (optionId: string, stepIndex: number) => {
    const option = options.find((o) => o._id === optionId);
    if (!option) return;
    const updatedSteps = option.processSteps.filter(
      (_: any, i: number) => i !== stepIndex,
    );
    try {
      await axios.put(`/api/order-options/${optionId}`, {
        processSteps: updatedSteps,
      });
      fetchOptions();
      toast.success("Step removed");
    } catch {
      toast.error("Failed to remove step");
    }
  };

  const handleDragEnd = async (event: DragEndEvent, optionId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const option = options.find((o) => o._id === optionId);
    if (!option) return;
    const oldIndex = option.processSteps.indexOf(active.id);
    const newIndex = option.processSteps.indexOf(over.id);
    const newSteps = arrayMove(option.processSteps, oldIndex, newIndex);
    try {
      await axios.put(`/api/order-options/${optionId}`, {
        processSteps: newSteps,
      });
      fetchOptions();
      toast.success("Reordered");
    } catch {
      toast.error("Reorder failed");
    }
  };

  const deleteOption = async (id: string) => {
    try {
      await axios.delete(`/api/order-options/${id}`);
      fetchOptions();
      toast.success("Order type deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <GripVertical size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Order Options</h3>
          <p className="text-sm text-gray-500">
            Manage order types & process steps
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New order type"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addOption()}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 transition"
        />
        <button
          onClick={addOption}
          className="bg-linear-to-r from-primary to-primary-dark text-white px-5 py-3 rounded-xl hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {options.map((option) => (
          <motion.div
            key={option._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-50 rounded-2xl p-5 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg text-gray-900">{option.name}</h4>
              <button
                onClick={() => setConfirmDeleteOption(option._id)}
                className="text-gray-400 hover:text-red-500 transition cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add process step"
                value={processInputs[option._id] || ""}
                onChange={(e) =>
                  setProcessInputs({
                    ...processInputs,
                    [option._id]: e.target.value,
                  })
                }
                onKeyDown={(e) => e.key === "Enter" && addStep(option._id)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 transition"
              />
              <button
                onClick={() => addStep(option._id)}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
              >
                Add
              </button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, option._id)}
            >
              <SortableContext
                items={option.processSteps}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {option.processSteps.map((step: string, idx: number) => (
                    <SortableStep
                      key={step}
                      step={step}
                      onDelete={() => removeStep(option._id, idx)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </motion.div>
        ))}
      </div>

      <ConfirmModal
        open={!!confirmDeleteOption}
        setOpen={() => setConfirmDeleteOption(null)}
        title="Delete Order Type"
        message="This will permanently delete this order type and all its process steps. Are you sure?"
        onConfirm={() =>
          confirmDeleteOption && deleteOption(confirmDeleteOption)
        }
      />
    </motion.div>
  );
}

// ==================== User Management ====================
function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    fatherName: "",
    address: "",
  });

  const fetchUsers = useCallback(async () => {
    const res = await axios.get("/api/users");
    setUsers(res.data);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      mobile: "",
      fatherName: "",
      address: "",
    });
    setShowCreate(false);
    setEditUser(null);
  };

  const handleCreate = async () => {
    try {
      await axios.post("/api/users", form);
      toast.success("User created");
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    try {
      await axios.put(`/api/users/${editUser._id}`, {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        fatherName: form.fatherName,
        address: form.address,
      });
      toast.success("User updated");
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await axios.delete(`/api/users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Cannot delete");
    }
  };

  const resetPassword = async (id: string) => {
    try {
      await axios.patch(`/api/users/${id}/reset-password`, {
        newPassword: "pass1234",
      });
      toast.success("Password reset to 'pass1234'");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      mobile: user.mobile || "",
      fatherName: user.fatherName || "",
      address: user.address || "",
    });
    setShowCreate(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <UserPlus size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Users</h3>
            <p className="text-sm text-gray-500">Manage team members</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
          className="flex items-center gap-2 bg-linear-to-r from-primary to-primary-dark text-white px-5 py-3 rounded-xl text-sm font-medium hover:shadow-lg transition-all cursor-pointer"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <AnimatePresence>
        {(showCreate || editUser) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-linear-to-r from-gray-50 to-white p-6 rounded-2xl mb-6 border border-gray-200 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              <input
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              {showCreate && (
                <input
                  type="password"
                  placeholder="Password *"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              )}
              <input
                type="text"
                placeholder="Mobile"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              <input
                type="text"
                placeholder="Father's Name"
                value={form.fatherName}
                onChange={(e) =>
                  setForm({ ...form, fatherName: e.target.value })
                }
                className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              <input
                type="text"
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition md:col-span-2"
              />
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={resetForm}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-xl text-sm font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={editUser ? handleUpdate : handleCreate}
                className="px-6 py-2.5 bg-linear-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all cursor-pointer"
              >
                {editUser ? "Update User" : "Create User"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-4 text-left font-semibold text-gray-700">
                Name
              </th>
              <th className="p-4 text-left font-semibold text-gray-700">
                Email
              </th>
              <th className="p-4 text-left font-semibold text-gray-700">
                Mobile
              </th>
              <th className="p-4 text-left font-semibold text-gray-700">
                Role
              </th>
              <th className="p-4 text-left font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u._id}
                className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
              >
                <td className="p-4 font-medium text-gray-800">{u.name}</td>
                <td className="p-4 text-gray-600">{u.email}</td>
                <td className="p-4 text-gray-600">{u.mobile}</td>
                <td className="p-4">
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      u.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700",
                    )}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="text-blue-600 hover:text-blue-800 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmReset(u._id)}
                      className="text-yellow-600 hover:text-yellow-800 transition cursor-pointer"
                      title="Reset Password"
                    >
                      <Key size={16} />
                    </button>
                    {u.role !== "admin" && (
                      <button
                        onClick={() => setConfirmDelete(u._id)}
                        className="text-red-600 hover:text-red-800 transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        setOpen={() => setConfirmDelete(null)}
        title="Delete User"
        message="Are you sure you want to delete this user? They will lose access permanently."
        onConfirm={() => confirmDelete && deleteUser(confirmDelete)}
      />
      <ConfirmModal
        open={!!confirmReset}
        setOpen={() => setConfirmReset(null)}
        title="Reset Password"
        message="This will reset the user's password to 'pass1234'. They will need to change it on next login."
        onConfirm={() => confirmReset && resetPassword(confirmReset)}
      />
    </motion.div>
  );
}

// ==================== Change Password ====================
function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleChange = async () => {
    if (newPass !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await axios.patch("/api/auth/change-password", {
        currentPassword: current,
        newPassword: newPass,
      });
      toast.success("Password changed successfully");
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to change password");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-linear-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
          <Key size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Change Your Password
          </h3>
          <p className="text-sm text-gray-500">Keep your account secure</p>
        </div>
      </div>
      <div className="space-y-4 max-w-lg">
        <input
          type="password"
          placeholder="Current password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
        />
        <input
          type="password"
          placeholder="New password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
        />
        <button
          onClick={handleChange}
          className="bg-linear-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer"
        >
          Update Password
        </button>
      </div>
    </motion.div>
  );
}

// ==================== Main Settings Page ====================
const tabs = [
  { key: "print", label: "Print Heading", icon: Save },
  { key: "cash", label: "Cash Categories", icon: Trash2 },
  { key: "orders", label: "Order Options", icon: GripVertical },
  { key: "users", label: "Users", icon: UserPlus },
  { key: "password", label: "Password", icon: Key },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("print");

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">Settings</h2>
        <p className="text-gray-500 mt-1">
          Manage your application preferences
        </p>
      </div>

      {/* Modern Tab Bar */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer",
                activeTab === tab.key
                  ? "bg-linear-to-r from-primary to-primary-dark text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "print" && <PrintHeadingForm />}
          {activeTab === "cash" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CashCategories type="in" />
              <CashCategories type="out" />
            </div>
          )}
          {activeTab === "orders" && <OrderOptionsSection />}
          {activeTab === "users" && <UserManagement />}
          {activeTab === "password" && <ChangePassword />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
