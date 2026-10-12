import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Lock, GraduationCap } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Token parameters are missing');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      toast.success('Password updated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      toast.error('Verification failed. Expired or incorrect token link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-sky-950 to-indigo-950 p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6">
        
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="h-12 w-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">Enter New Password</h1>
          <p className="text-xs text-sky-200">Reset your login password to regain access</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white py-2.5 rounded-2xl text-xs font-semibold shadow-lg transition-all cursor-pointer flex items-center justify-center"
          >
            {loading ? 'Updating Password...' : 'Save Password'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ResetPassword;
