import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 6) { showToast("Password must be at least 6 characters.", "error"); return; }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      showToast("Account created. Welcome.", "success");
      navigate("/vault");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div className="min-h-screen bg-bg text-text font-sans flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-[380px]"
      >
        <div className="text-center mb-10">
          <div className="w-10 h-10 rounded-xl bg-accent-dim border border-accent/20 flex items-center justify-center text-xl mx-auto mb-4 text-accent">
            ⏳
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1.5">Create your account</h1>
          <p className="text-sm text-text-2">Private by design. Free to use.</p>
        </div>

        <div className="glass-card p-7 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[0.8rem] font-medium text-text-muted mb-1.5">Username</label>
              <input
                className="form-input"
                type="text" placeholder="yourusername"
                value={form.username} onChange={set("username")}
                required minLength={3} maxLength={30} autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-[0.8rem] font-medium text-text-muted mb-1.5">Email address</label>
              <input
                className="form-input"
                type="email" placeholder="you@example.com"
                value={form.email} onChange={set("email")}
                required autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-[0.8rem] font-medium text-text-muted mb-1.5">Password</label>
              <input
                className="form-input"
                type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={set("password")}
                required minLength={6} autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-2.5 mt-2 flex justify-center"
              disabled={loading}
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create account"}
            </button>
          </form>

          <div className="w-full h-px bg-white/10 my-6" />
          
          <p className="text-center text-[0.8125rem] text-text-2">
            Already have an account?{" "}
            <Link to="/login" className="text-accent font-medium hover:underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
