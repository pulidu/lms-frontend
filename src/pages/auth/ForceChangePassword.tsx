import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../redux/authSlice.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Lock, GraduationCap } from 'lucide-react';
import { RootState } from '../../redux/store.js';

const ForceChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password updated successfully! Welcome to the portal.');
      
      // Update Redux state to set isFirstLogin = false
      dispatch(updateUser({ isFirstLogin: false }));
      
      // Redirect to dashboard
      if (user?.role === 'admin') {
        navigate('/admin');
      } else if (user?.role === 'staff') {
        navigate('/staff');
      } else if (user?.role === 'lecturer') {
        navigate('/lecturer');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-lg shadow-sm space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-wide">Change Password Required</h1>
          <p className="text-xs text-slate-500">
            For security reasons, you must update your password upon first-time login.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Current/Default Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full border border-slate-300 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full border border-slate-300 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full border border-slate-300 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center"
          >
            {loading ? 'Updating...' : 'Change Password & Proceed'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePassword;
