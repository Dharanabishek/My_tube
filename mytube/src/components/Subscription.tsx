"use client";

import { useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

const plans = [
  { key: "Free", price: 0, desc: "Watch 5 minutes and 1 download per day" },
  { key: "Bronze", price: 10, desc: "Watch 7 minutes and unlimited downloads" },
  { key: "Silver", price: 50, desc: "Watch 10 minutes and unlimited downloads" },
  { key: "Gold", price: 100, desc: "Unlimited watching and downloads" },
];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Subscription() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubscribe = async (planKey: string) => {
    setMessage(null);
    if (!user) {
      setMessage("Please login to subscribe");
      return;
    }

    setLoading(true);
    try {
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error("Razorpay script failed to load");

      const resp = await axiosInstance.post("/payment/create-order", {
        planType: planKey,
        userId: user._id,
      });
      const { order, keyId } = resp.data;
      const razorpayKeyId = keyId || process.env.NEXT_PUBLIC_RZP_KEY_ID || "";
      if (!razorpayKeyId) {
        throw new Error("Razorpay key id is missing");
      }

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "YourTube",
        description: `${planKey} plan subscription`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            setLoading(true);
            await axiosInstance.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user._id,
              planType: planKey,
            });
            setMessage("Payment successful. Subscription activated and invoice sent.");
          } catch (err: any) {
            console.error(err);
            setMessage(err?.response?.data?.message || "Verification failed");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.name || user.channelname || "",
          email: user.email,
        },
        theme: { color: "#2563eb" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error(error);
      const serverMsg = error?.response?.data?.message;
      if (serverMsg && serverMsg.toLowerCase().includes("payment provider not configured")) {
        try {
          setLoading(true);
          await axiosInstance.post("/payment/mock-subscribe", {
            planType: planKey,
            userId: user._id,
          });
          setMessage("Mock subscription activated in dev mode.");
        } catch (merr: any) {
          console.error(merr);
          setMessage(merr?.response?.data?.message || "Mock subscription failed");
        }
      } else {
        setMessage(error?.message || "Could not start checkout");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMockSubscribe = async (planKey: string) => {
    if (!user) {
      setMessage("Please login to subscribe");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post("/payment/mock-subscribe", {
        planType: planKey,
        userId: user._id,
      });
      setMessage("Mock subscription activated in dev mode.");
    } catch (merr: any) {
      console.error(merr);
      setMessage(merr?.response?.data?.message || "Mock subscription failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-3">Plans and premium access</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {plans.map((p) => (
          <div key={p.key} className="p-4 border rounded">
            <div className="text-xl font-bold">{p.key}</div>
            <div className="text-2xl mt-2">INR {p.price}</div>
            <div className="text-sm mt-2">{p.desc}</div>
            {p.key === "Free" ? (
              <div className="mt-4 text-sm text-muted-foreground">Default plan</div>
            ) : (
              <>
                <button
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
                  onClick={() => handleSubscribe(p.key)}
                  disabled={loading}
                >
                  {loading ? "Processing..." : `Buy ${p.key}`}
                </button>
                {process.env.NODE_ENV !== "production" && (
                  <button
                    className="mt-2 ml-2 px-3 py-1 bg-gray-200 text-black rounded text-sm"
                    onClick={() => handleMockSubscribe(p.key)}
                    disabled={loading}
                  >
                    Mock Subscribe
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      {message && <div className="mt-4 text-sm text-green-600">{message}</div>}
    </div>
  );
}
