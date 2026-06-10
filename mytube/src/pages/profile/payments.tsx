"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

export default function PaymentsPage() {
  const { user } = useUser();
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchPayments = async () => {
      try {
        const resp = await axiosInstance.get(`/payment/user/${user._id}`);
        setPayments(resp.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPayments();
  }, [user]);

  if (!user) return <div className="p-4">Please login to view payments.</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Payment History</h2>
      <ul className="space-y-3">
        {payments.map((p) => (
          <li key={p._id} className="p-3 border rounded">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{p.planType} - INR {p.amount}</div>
                <div className="text-sm text-muted">Status: {p.status}</div>
                <div className="text-sm">Payment ID: {p.paymentId}</div>
                <div className="text-sm">Invoice: {p.invoiceId}</div>
              </div>
              <div className="text-sm">{new Date(p.createdAt).toLocaleString()}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
