"use client";
import { format } from "date-fns";

interface PrintViewProps {
  order: any;
  heading: {
    storeName?: string;
    storeAddress?: string;
    proprietorName?: string;
    mobile?: string;
    watermark?: string;
  };
}

export default function PrintView({ order, heading }: PrintViewProps) {
  const handlePrint = () => window.print();

  const totalIncreases = (order.increases ?? []).reduce(
    (s: number, i: any) => s + (i.amount || 0),
    0
  );
  const totalRepayments = (order.repayments ?? []).reduce(
    (s: number, r: any) => s + (r.amount || 0),
    0
  );

  return (
    <div className="p-8 max-w-4xl mx-auto print:mx-0 print:max-w-none print:p-4 text-sm">
      <div className="print:hidden mb-4">
        <button
          onClick={handlePrint}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Print
        </button>
      </div>

      {/* হেডিং */}
      <div className="text-center mb-6 border-b pb-4 relative">
        {heading.watermark && (
          <div className="absolute inset-0 flex items-center justify-center text-6xl text-gray-200 opacity-20 -rotate-12 select-none pointer-events-none">
            {heading.watermark}
          </div>
        )}
        <h1 className="text-2xl font-bold">{heading.storeName || "Store"}</h1>
        {heading.storeAddress && <p>{heading.storeAddress}</p>}
        <p>
          {heading.proprietorName && `Proprietor: ${heading.proprietorName}`}
          {heading.mobile && ` | Mobile: ${heading.mobile}`}
        </p>
      </div>

      {/* অর্ডার ডিটেইল */}
      <h2 className="text-lg font-bold mb-2">Order: {order.uniqueId}</h2>
      <table className="w-full mb-4 text-sm border">
        <tbody>
          <tr>
            <td className="font-medium pr-2 border p-1">Client</td>
            <td className="border p-1">{order.clientId?.name}</td>
          </tr>
          <tr>
            <td className="font-medium border p-1">Mobile</td>
            <td className="border p-1">{order.clientId?.mobile}</td>
          </tr>
          <tr>
            <td className="font-medium border p-1">Order Type</td>
            <td className="border p-1">{order.orderOptionId?.name}</td>
          </tr>
          <tr>
            <td className="font-medium border p-1">Amount</td>
            <td className="border p-1">৳ {order.amount}</td>
          </tr>
          <tr>
            <td className="font-medium border p-1">Pay Amount</td>
            <td className="border p-1">৳ {order.payAmount}</td>
          </tr>
          <tr>
            <td className="font-medium border p-1">Due</td>
            <td className="border p-1 font-semibold">
              ৳ {order.amount + totalIncreases - (order.payAmount + totalRepayments)}
            </td>
          </tr>
          <tr>
            <td className="font-medium border p-1">Status</td>
            <td className="border p-1 capitalize">{order.status}</td>
          </tr>
          <tr>
            <td className="font-medium border p-1">Date</td>
            <td className="border p-1">
              {format(new Date(order.createdAt), "dd/MM/yyyy")}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Status History */}
      <h3 className="font-bold mb-1">Status History</h3>
      <table className="w-full text-xs mb-4 border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-left">Status</th>
            <th className="border p-1 text-left">Cause</th>
            <th className="border p-1 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {(order.statusHistory ?? []).map((h: any, i: number) => (
            <tr key={i}>
              <td className="border p-1 capitalize">{h.status}</td>
              <td className="border p-1">{h.cause || "-"}</td>
              <td className="border p-1">
                {format(new Date(h.changedAt), "dd/MM/yyyy HH:mm")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Increases */}
      <h3 className="font-bold mb-1">Increases</h3>
      <table className="w-full text-xs mb-4 border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-left">Amount</th>
            <th className="border p-1 text-left">Cause</th>
            <th className="border p-1 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {(order.increases ?? []).map((inc: any, i: number) => (
            <tr key={i}>
              <td className="border p-1">৳ {inc.amount}</td>
              <td className="border p-1">{inc.cause || "-"}</td>
              <td className="border p-1">
                {format(new Date(inc.addedAt), "dd/MM/yyyy HH:mm")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Repayments */}
      <h3 className="font-bold mb-1">Repayments</h3>
      <table className="w-full text-xs mb-4 border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-left">Amount</th>
            <th className="border p-1 text-left">Method</th>
            <th className="border p-1 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {(order.repayments ?? []).map((rep: any, i: number) => (
            <tr key={i}>
              <td className="border p-1">৳ {rep.amount}</td>
              <td className="border p-1">{rep.method}</td>
              <td className="border p-1">
                {format(new Date(rep.addedAt), "dd/MM/yyyy HH:mm")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}