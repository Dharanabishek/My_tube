"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

export default function SettingsPage() {
  const { user, login, token, theme } = useUser();
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [city, setCity] = useState(user?.city || "");
  const [state, setState] = useState(user?.state || "");
  const [message, setMessage] = useState("");

  const saveProfile = async () => {
    if (!user) return;
    const res = await axiosInstance.patch(`/user/update/${user._id}`, {
      mobile,
      city,
      state,
      channelname: user.channelname,
      description: user.description,
    });
    login(res.data, token, theme);
    setMessage("Settings saved.");
  };

  if (!user) return <div className="p-4">Please sign in to view settings.</div>;

  return (
    <main className="w-full p-4 space-y-6">
      <section className="space-y-3 max-w-xl">
        <h2 className="text-xl font-semibold">Profile settings</h2>
        <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number for OTP" />
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
        <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
        <Button onClick={saveProfile}>Save</Button>
        {message && <div className="text-sm text-green-600">{message}</div>}
      </section>
      
    </main>
  );
}
