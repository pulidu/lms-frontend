import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/authSlice.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailOtpRequired, setEmailOtpRequired] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Verification code modal states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState('');

  // Fetch public auth configuration to adapt to backend settings dynamically
  useEffect(() => {
    let isMounted = true;
    const fetchAuthConfig = async () => {
      try {
        const res = await api.get('/auth/config');
        if (isMounted && typeof res.data?.emailOtpRequired === 'boolean') {
          setEmailOtpRequired(res.data.emailOtpRequired);
          if (!res.data.emailOtpRequired) {
            setIsVerifying(false);
          }
        }
      } catch (e) {
        // Safe fallback - default to true for security if config endpoint fails
        if (isMounted) setEmailOtpRequired(true);
      }
    };

    fetchAuthConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });

      // Update otp required state if returned in login response
      if (typeof res.data?.emailOtpRequired === 'boolean') {
        setEmailOtpRequired(res.data.emailOtpRequired);
      }

      if (res.data.status === 'pending_verification') {
        // Trigger verification code modal only when OTP is required
        setVerifyingEmail(res.data.email);
        setIsVerifying(true);
        toast.success(res.data.message || 'Verification code sent to your email!');
      } else {
        const { accessToken, refreshToken, user } = res.data;
        dispatch(loginSuccess({ accessToken, refreshToken, user }));
        toast.success(`Welcome back, ${user.firstName}!`);

        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'staff') {
          navigate('/staff');
        } else if (user.role === 'lecturer') {
          navigate('/lecturer');
        } else {
          navigate('/student');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-email', {
        token: verificationCode.trim().toUpperCase(),
      });

      // If backend returned authentication tokens upon successful OTP validation
      if (res.data?.accessToken && res.data?.user) {
        const { accessToken, refreshToken, user } = res.data;
        dispatch(loginSuccess({ accessToken, refreshToken, user }));
        toast.success(`Welcome back, ${user.firstName}!`);
        setIsVerifying(false);
        setVerificationCode('');

        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'staff') {
          navigate('/staff');
        } else if (user.role === 'lecturer') {
          navigate('/lecturer');
        } else {
          navigate('/student');
        }
        return;
      }

      toast.success(res.data?.message || 'Email verified successfully! You can now log in.');
      setIsVerifying(false);
      setVerificationCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // Determine whether OTP verification view should be rendered
  const showOtpView = isVerifying && emailOtpRequired !== false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 font-sans select-none">
      {/* Outer Centered Container */}
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-lg shadow-sm p-10 space-y-8">
        {/* Google-like logo header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center gap-1.5 justify-center">
            {/* Google Classroom styled header text */}
            <span className="font-bold text-2xl text-blue-600 font-sans tracking-tight">L</span>
            <span className="font-bold text-2xl text-red-500 font-sans tracking-tight">M</span>
            <span className="font-bold text-2xl text-yellow-500 font-sans tracking-tight">S</span>
            <span className="font-semibold text-lg text-slate-500 ml-1">Classroom</span>
          </div>

          <h2 className="text-xl font-normal text-slate-800 tracking-tight pt-2">
            {showOtpView ? 'Verify your identity' : 'Sign in'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {showOtpView
              ? `Enter the 6-character code sent to ${verifyingEmail}`
              : 'to continue to your learning dashboard'}
          </p>
        </div>

        {/* Conditional Verification View / Sign In Form */}
        {showOtpView ? (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-650">Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. A2B5CD"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3.5 py-2.5 text-sm uppercase tracking-widest text-center font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsVerifying(false);
                  setVerificationCode('');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1.5"
              >
                Back to Sign in
              </button>

              <button
                type="submit"
                disabled={loading}
                className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email field */}
            <div className="space-y-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or phone"
                className="w-full border border-slate-300 rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
              />
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-slate-300 rounded-md px-3.5 py-2.5 text-sm pr-10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In action button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        )}

        {/* Credentials hints box */}
        <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium">
          <span>Admin: admin@lms.com / Admin@123</span>
          <span className="text-slate-300">|</span>
          <span>
            {emailOtpRequired === false
              ? 'Direct password login enabled'
              : 'Email OTP verification active'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
