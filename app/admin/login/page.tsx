"use client";

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Mali ang details: " + error.message);
    } else {
      router.push('/admin'); // Pag success, rekta sa Dashboard
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 border border-slate-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
            Admin <span className="text-blue-600">Login</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">R&V Private Pool</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="block text-[8px] font-black text-blue-600 uppercase mb-2">Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent w-full outline-none font-bold text-sm"
              placeholder="admin@rvresort.com"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="block text-[8px] font-black text-blue-600 uppercase mb-2">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent w-full outline-none font-bold text-sm"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}