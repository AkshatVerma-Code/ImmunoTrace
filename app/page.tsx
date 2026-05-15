"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, ChevronDown, ChevronLeft, Droplet, Lock, Mail, MapPin, Ruler, User, Weight } from "lucide-react";

type Mode = "login" | "signup";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    age: "",
    height: "",
    weight: "",
    bloodGroup: "",
    allergy: "",
    location: "",
  });

  const onChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          age: formData.age ? Number(formData.age) : null,
          height_cm: formData.height ? Number(formData.height) : null,
          weight_kg: formData.weight ? Number(formData.weight) : null,
          blood_group: formData.bloodGroup || null,
          allergies: formData.allergy || null,
          location: formData.location || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F4F7F6] font-sans flex items-center justify-center overflow-hidden">
      <div className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-[#2EC4B6]/15 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#0F3D3E]/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
      <div className="absolute top-20 right-32 w-24 h-24 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl shadow-xl hidden md:flex items-center justify-center rotate-12">
        <Activity className="w-10 h-10 text-[#0F3D3E]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center p-6">
        <div className="hidden md:flex flex-col justify-center px-12 text-[#0F3D3E]">
          <h1 className="text-4xl font-heading font-extrabold tracking-tight mb-4">ImmunoTrace</h1>
          <h2 className="text-5xl font-heading font-bold leading-tight mb-6">
            Your Personal <br />
            <span className="text-[#2EC4B6]">Health Historian</span>
          </h2>
          <p className="text-lg text-[#0F3D3E]/70 leading-relaxed">
            AI-powered personal health memory platform with secure profile and auth.
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(15,61,62,0.08)] p-8">
          <div className="flex items-center p-1 bg-[#0F3D3E]/5 rounded-full mb-8">
            <button onClick={() => { setMode("login"); setError(""); setStep(1); }} className={`flex-1 py-3 text-sm font-semibold rounded-full ${mode === "login" ? "bg-[#0F3D3E] text-white" : "text-[#0F3D3E]/60"}`}>Log In</button>
            <button onClick={() => { setMode("signup"); setError(""); }} className={`flex-1 py-3 text-sm font-semibold rounded-full ${mode === "signup" ? "bg-[#0F3D3E] text-white" : "text-[#0F3D3E]/60"}`}>Create Account</button>
          </div>

          {error ? <div className="text-sm bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl mb-4">{error}</div> : null}

          {mode === "login" ? (
            <form onSubmit={login} className="space-y-4">
              <div className="relative"><Mail className="absolute left-4 top-3.5 w-5 h-5 text-[#0F3D3E]/40" /><input className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/60 rounded-2xl" type="email" placeholder="Email address" value={formData.email} onChange={(e) => onChange("email", e.target.value)} required /></div>
              <div className="relative"><Lock className="absolute left-4 top-3.5 w-5 h-5 text-[#0F3D3E]/40" /><input className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/60 rounded-2xl" type="password" placeholder="Password" value={formData.password} onChange={(e) => onChange("password", e.target.value)} required /></div>
              <button className="w-full py-4 bg-[#2EC4B6] text-white rounded-2xl font-semibold flex items-center justify-center gap-2" disabled={loading}>
                {loading ? "Logging in..." : "Log In"} <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form onSubmit={signup} className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="relative"><User className="absolute left-4 top-3.5 w-5 h-5 text-[#0F3D3E]/40" /><input className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 rounded-2xl" type="text" placeholder="Full Name" value={formData.name} onChange={(e) => onChange("name", e.target.value)} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <input className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-2xl" type="number" placeholder="Age" value={formData.age} onChange={(e) => onChange("age", e.target.value)} required />
                    <div className="relative"><Droplet className="absolute left-4 top-3.5 w-5 h-5 text-[#0F3D3E]/40" /><select className="w-full pl-11 pr-10 py-3 bg-white/50 border border-white/60 rounded-2xl appearance-none" value={formData.bloodGroup} onChange={(e) => onChange("bloodGroup", e.target.value)} required><option value="">Blood Group</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select><ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-[#0F3D3E]/40" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative"><Ruler className="absolute left-4 top-3.5 w-5 h-5 text-[#0F3D3E]/40" /><input className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 rounded-2xl" type="number" placeholder="Height (cm)" value={formData.height} onChange={(e) => onChange("height", e.target.value)} required /></div>
                    <div className="relative"><Weight className="absolute left-4 top-3.5 w-5 h-5 text-[#0F3D3E]/40" /><input className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 rounded-2xl" type="number" placeholder="Weight (kg)" value={formData.weight} onChange={(e) => onChange("weight", e.target.value)} required /></div>
                  </div>
                  <div className="relative"><MapPin className="absolute left-4 top-3.5 w-5 h-5 text-[#0F3D3E]/40" /><input className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 rounded-2xl" type="text" placeholder="Location" value={formData.location} onChange={(e) => onChange("location", e.target.value)} required /></div>
                  <input className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-2xl" type="text" placeholder="Any allergies? (Optional)" value={formData.allergy} onChange={(e) => onChange("allergy", e.target.value)} />
                  <button className="w-full py-4 bg-[#0F3D3E] text-white rounded-2xl font-semibold">Next Step <ArrowRight className="inline w-5 h-5" /></button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setStep(1)} className="w-10 h-10 rounded-full bg-[#0F3D3E]/5 flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
                  <div className="relative"><Mail className="absolute left-4 top-3.5 w-5 h-5 text-[#0F3D3E]/40" /><input className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/60 rounded-2xl" type="email" placeholder="Email address" value={formData.email} onChange={(e) => onChange("email", e.target.value)} required /></div>
                  <div className="relative"><Lock className="absolute left-4 top-3.5 w-5 h-5 text-[#0F3D3E]/40" /><input className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/60 rounded-2xl" type="password" placeholder="Create a password" value={formData.password} onChange={(e) => onChange("password", e.target.value)} required /></div>
                  <button className="w-full py-4 bg-[#2EC4B6] text-white rounded-2xl font-semibold flex items-center justify-center gap-2" disabled={loading}>
                    {loading ? "Creating account..." : "Complete Sign Up"} <ArrowRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
