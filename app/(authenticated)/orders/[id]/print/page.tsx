import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/Order";
import Settings from "@/models/Settings";
import PrintView from "./PrintView";

export default async function OrderPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await dbConnect();
  const { id } = await params;
  const order = await Order.findById(id)
    .populate("clientId", "name mobile")
    .populate("orderOptionId", "name")
    .lean();

  if (!order) return <div className="p-8">Order not found</div>;

  const settings = await Settings.findOne().lean();
  const heading = settings
    ? {
        storeName: settings.storeName,
        storeAddress: settings.storeAddress,
        proprietorName: settings.proprietorName,
        mobile: settings.mobile,
        watermark: settings.watermark,
      }
    : {};

  return (
    <PrintView order={JSON.parse(JSON.stringify(order))} heading={heading} />
  );
}
