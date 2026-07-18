import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Notification from "@/models/Notification";
import Order from "@/models/Order";
import Client from "@/models/Client";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  await dbConnect();
  const user = await getAuthUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // প্রথমে মিসিং নোটিফিকেশন তৈরি করি
  await checkAndCreateNotifications(user.userId);

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "1";
  const limit = parseInt(searchParams.get("limit") || "20");

  const filter: any = { recipient: new mongoose.Types.ObjectId(user.userId) };
  if (unreadOnly) filter.read = false;

  const notifications = await Notification.find(filter)
    .sort({ scheduledAt: -1, createdAt: -1 })
    .limit(limit);

  const unreadCount = await Notification.countDocuments({
    recipient: user.userId,
    read: false,
  });

  return NextResponse.json({ notifications, unreadCount });
}

// Helper function to create missing notifications
async function checkAndCreateNotifications(userId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  // সব অ্যাডমিন ইউজারকে পাঠাব
  const admins = await User.find({ role: "admin" }).select("_id");
  const adminIds = admins.map((a) => a._id);

  // --- Order delivery reminders: যেসব অর্ডারের deliveryDate আজ বা আগামীকাল এবং status != successful/cancel
  const upcomingOrders = await Order.find({
    deliveryDate: { $exists: true, $ne: null, $lte: tomorrow },
    status: { $nin: ["successful", "cancel"] },
  });

  for (const order of upcomingOrders) {
    const deliveryDate = order.deliveryDate!;
    // চেক করি ২ দিন আগে থেকে ডেলিভারি দিন পর্যন্ত প্রতিদিনের জন্য নোটিফিকেশন
    const reminderStart = new Date(deliveryDate);
    reminderStart.setDate(reminderStart.getDate() - 2);
    const currentReminderDate = new Date(reminderStart);
    while (currentReminderDate <= deliveryDate) {
      if (currentReminderDate.toDateString() === today.toDateString()) {
        // আজকের জন্য নোটিফিকেশন তৈরি করি যদি না থাকে
        for (const adminId of adminIds) {
          const exists = await Notification.findOne({
            recipient: adminId,
            relatedOrder: order._id,
            type: "order_delivery_reminder",
            scheduledAt: {
              $gte: new Date(today),
              $lt: new Date(tomorrow),
            },
          });
          if (!exists) {
            await Notification.create({
              recipient: adminId,
              type: "order_delivery_reminder",
              title: "Order Delivery Reminder",
              message: `Order ${order.uniqueId} delivery is ${deliveryDate.toLocaleDateString()}`,
              relatedOrder: order._id,
              scheduledAt: today,
            });
          }
        }
        break; // আজকের জন্য হয়ে গেলে পরবর্তী দিনের দরকার নেই, আগামীকাল আবার চেক হবে
      }
      currentReminderDate.setDate(currentReminderDate.getDate() + 1);
    }
  }

  // --- Order overdue: deliveryDate past and status not successful/cancel
  const overdueOrders = await Order.find({
    deliveryDate: { $lt: today },
    status: { $nin: ["successful", "cancel"] },
  });
  for (const order of overdueOrders) {
    for (const adminId of adminIds) {
      const exists = await Notification.findOne({
        recipient: adminId,
        relatedOrder: order._id,
        type: "order_overdue",
        scheduledAt: { $gte: today, $lt: tomorrow },
      });
      if (!exists) {
        await Notification.create({
          recipient: adminId,
          type: "order_overdue",
          title: "Order Overdue",
          message: `Order ${order.uniqueId} was due on ${order.deliveryDate!.toLocaleDateString()}. Reschedule required.`,
          relatedOrder: order._id,
          scheduledAt: today,
        });
      }
    }
  }

  // --- Client due reminders: dueDate today
  const dueClients = await Client.find({
    nextDueDate: { $lte: tomorrow },
    dueAmount: { $gt: 0 },
    status: "active",
  });
  for (const client of dueClients) {
    if (client.nextDueDate!.toDateString() === today.toDateString()) {
      for (const adminId of adminIds) {
        const exists = await Notification.findOne({
          recipient: adminId,
          relatedClient: client._id,
          type: "client_due_reminder",
          scheduledAt: { $gte: today, $lt: tomorrow },
        });
        if (!exists) {
          await Notification.create({
            recipient: adminId,
            type: "client_due_reminder",
            title: "Client Due Reminder",
            message: `${client.name} has due ৳${client.dueAmount}. Payment date: ${client.nextDueDate!.toLocaleDateString()}`,
            relatedClient: client._id,
            scheduledAt: today,
          });
        }
      }
    }
  }

  // --- Client due overdue: nextDueDate past and dueAmount>0
  const overdueClients = await Client.find({
    nextDueDate: { $lt: today },
    dueAmount: { $gt: 0 },
    status: "active",
  });
  for (const client of overdueClients) {
    for (const adminId of adminIds) {
      const exists = await Notification.findOne({
        recipient: adminId,
        relatedClient: client._id,
        type: "client_due_overdue",
        scheduledAt: { $gte: today, $lt: tomorrow },
      });
      if (!exists) {
        await Notification.create({
          recipient: adminId,
          type: "client_due_overdue",
          title: "Client Due Overdue",
          message: `${client.name}'s payment of ৳${client.dueAmount} was due on ${client.nextDueDate!.toLocaleDateString()}.`,
          relatedClient: client._id,
          scheduledAt: today,
        });
      }
    }
  }
}
