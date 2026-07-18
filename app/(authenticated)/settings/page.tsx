"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Save, Plus, X, GripVertical, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
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
import { cn } from "@/lib/utils";

// ---------- Print Heading Form ----------
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
      toast.success("Print heading saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Print Heading</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Store Name"
          value={form.storeName}
          onChange={(e) => setForm({ ...form, storeName: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Store Address"
          value={form.storeAddress}
          onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Proprietor Name"
          value={form.proprietorName}
          onChange={(e) => setForm({ ...form, proprietorName: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Mobile"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Watermark Text"
          value={form.watermark}
          onChange={(e) => setForm({ ...form, watermark: e.target.value })}
          className="px-3 py-2 border rounded-lg md:col-span-2"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={loading}
        className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-dark transition"
      >
        <Save size={16} /> Save
      </button>
    </div>
  );
}

// ---------- Cash Categories ----------
function CashCategories({ type }: { type: "in" | "out" }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [input, setInput] = useState("");

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
        toast.success("Category added");
      } catch {
        toast.error("Failed to add");
      }
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await axios.delete(`/api/cash-categories/${id}`);
      fetchCategories();
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder={`Add ${type === "in" ? "Cash In" : "Cash Out"} category...`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={addCategory}
        className="w-full px-3 py-2 border rounded-lg mb-3"
      />
      <ul className="space-y-2">
        {categories.map((cat) => (
          <li
            key={cat._id}
            className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg group"
          >
            <span>{cat.name}</span>
            <button
              onClick={() => deleteCategory(cat._id)}
              className="text-error opacity-0 group-hover:opacity-100 transition"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Sortable Process Step ----------
function SortableStep({
  step,
  onDelete,
}: {
  step: string;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: step });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between bg-white border px-3 py-2 rounded-lg"
    >
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab">
          <GripVertical size={16} className="text-gray-400" />
        </button>
        <span>{step}</span>
      </div>
      <button onClick={onDelete} className="text-error">
        <X size={16} />
      </button>
    </div>
  );
}

// ---------- Order Options ----------
function OrderOptionsSection() {
  const [options, setOptions] = useState<any[]>([]);
  const [newOption, setNewOption] = useState("");
  const [processInputs, setProcessInputs] = useState<Record<string, string>>(
    {},
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
    } catch {
      toast.error("Reorder failed");
    }
  };

  const deleteOption = async (id: string) => {
    if (!confirm("Delete this order type?")) return;
    try {
      await axios.delete(`/api/order-options/${id}`);
      fetchOptions();
      toast.success("Deleted");
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
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New order type"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <button
          onClick={addOption}
          className="bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-dark"
        >
          <Plus size={16} />
        </button>
      </div>
      {options.map((option) => (
        <div key={option._id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-lg">{option.name}</h4>
            <button
              onClick={() => deleteOption(option._id)}
              className="text-error"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <div className="flex gap-2 mb-3">
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
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              onClick={() => addStep(option._id)}
              className="bg-gray-200 px-3 py-2 rounded-lg hover:bg-gray-300"
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
        </div>
      ))}
    </div>
  );
}

// ---------- User Management Table ----------
function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
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
    if (!confirm("Delete this user?")) return;
    try {
      await axios.delete(`/api/users/${id}`);
      toast.success("Deleted");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Cannot delete");
    }
  };

  const resetPassword = async (id: string) => {
    const newPass = prompt("Enter new password (min 6 chars):");
    if (!newPass) return;
    try {
      await axios.patch(`/api/users/${id}/reset-password`, {
        newPassword: newPass,
      });
      toast.success("Password reset");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "", // not editable
      mobile: user.mobile || "",
      fatherName: user.fatherName || "",
      address: user.address || "",
    });
    setShowCreate(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Users</h3>
        <button
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
          className="flex items-center gap-1 bg-primary text-on-primary px-3 py-2 rounded-lg"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {(showCreate || editUser) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          {showCreate && (
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="px-3 py-2 border rounded"
            />
          )}
          <input
            type="text"
            placeholder="Mobile"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Father's Name"
            value={form.fatherName}
            onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <input
            type="text"
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="px-3 py-2 border rounded md:col-span-2"
          />
          <div className="md:col-span-2 flex gap-2">
            <button
              onClick={editUser ? handleUpdate : handleCreate}
              className="bg-primary text-on-primary px-4 py-2 rounded"
            >
              {editUser ? "Update" : "Create"}
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Mobile</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.mobile}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => openEdit(u)} className="text-blue-600">
                    Edit
                  </button>
                  <button
                    onClick={() => resetPassword(u._id)}
                    className="text-yellow-600"
                  >
                    Reset PW
                  </button>
                  {u.role !== "admin" && (
                    <button
                      onClick={() => deleteUser(u._id)}
                      className="text-error"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Change Password (own) ----------
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
      toast.success("Password changed");
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  return (
    <div className="space-y-3 max-w-md">
      <h3 className="text-lg font-semibold">Change Your Password</h3>
      <input
        type="password"
        placeholder="Current password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="password"
        placeholder="New password"
        value={newPass}
        onChange={(e) => setNewPass(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      />
      <button
        onClick={handleChange}
        className="bg-primary text-on-primary px-4 py-2 rounded"
      >
        Change Password
      </button>
    </div>
  );
}

// ---------- Main Settings Page with Tabs ----------
const tabs = [
  "Print Heading",
  "Cash Categories",
  "Order Options",
  "Users",
  "Password",
] as const;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("Print Heading");

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-t-lg transition",
              activeTab === tab
                ? "bg-primary text-on-primary"
                : "bg-gray-100 hover:bg-gray-200",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="bg-white p-6 rounded-2xl shadow">
        {activeTab === "Print Heading" && <PrintHeadingForm />}
        {activeTab === "Cash Categories" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Cash In Categories</h4>
              <CashCategories type="in" />
            </div>
            <div>
              <h4 className="font-medium mb-2">Cash Out Categories</h4>
              <CashCategories type="out" />
            </div>
          </div>
        )}
        {activeTab === "Order Options" && <OrderOptionsSection />}
        {activeTab === "Users" && <UserManagement />}
        {activeTab === "Password" && <ChangePassword />}
      </div>
    </div>
  );
}
