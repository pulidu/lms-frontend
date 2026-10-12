import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const triggerVerify = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        await api.post('/auth/verify-email', { token });
        setStatus('success');
        toast.success('Email verified successfully! Loading login...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setStatus('error');
        toast.error('Verification failed. Invalid or expired token.');
      }
    };

    triggerVerify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 font-sans select-none">
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-lg shadow-sm p-10 space-y-8 text-center">
        
        {/* Google-like logo header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-1.5 justify-center">
            <span className="font-bold text-2xl text-blue-600 font-sans tracking-tight">L</span>
            <span className="font-bold text-2xl text-red-500 font-sans tracking-tight">M</span>
            <span className="font-bold text-2xl text-yellow-500 font-sans tracking-tight">S</span>
            <span className="font-semibold text-lg text-slate-500 ml-1">Classroom</span>
          </div>
          
          <h2 className="text-xl font-normal text-slate-800 tracking-tight pt-2">
            Email Verification
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Verifying your account details
          </p>
        </div>

        {status === 'verifying' && (
          <div className="space-y-4 py-4">
            <div className="mx-auto h-8 w-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-550">Verifying your security token signature, please hold...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 py-4 text-emerald-600">
            <CheckCircle className="h-12 w-12 mx-auto" />
            <h2 className="font-semibold text-sm text-slate-800">Account Verified Successfully!</h2>
            <p className="text-xs text-slate-500">Redirecting to login dashboard in a moment...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-4 text-rose-600">
            <XCircle className="h-12 w-12 mx-auto" />
            <h2 className="font-semibold text-sm text-slate-800">Verification Token Invalid</h2>
            <p className="text-xs text-slate-500">The verification link is invalid or has expired. Please contact your administrator.</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
