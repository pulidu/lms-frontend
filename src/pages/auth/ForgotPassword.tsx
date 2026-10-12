import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Mail, GraduationCap } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Password recovery link has been dispatched to email!');
      setEmail('');
    } catch (err) {
      toast.error('Could not find user with that email');
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
          <h1 className="text-xl font-bold text-white tracking-wide">Recover Password</h1>
          <p className="text-xs text-sky-200">Request password reset credentials link via email</p>
        </div>

        <form onSubmit={handleRequest} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@lms.com"
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white py-2.5 rounded-2xl text-xs font-semibold shadow-lg transition-all cursor-pointer flex items-center justify-center"
          >
            {loading ? 'Dispatched Request...' : 'Send Recovery Link'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-[11px] font-bold text-sky-400 hover:underline"
          >
            Back to Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
