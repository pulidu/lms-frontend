import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import {
  UserPlus,
  CheckCircle,
  Ban,
  RefreshCw,
  UserCog,
  Search,
  Trash2,
  MoreVertical,
  Filter,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store.js';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'staff' | 'student' | 'lecturer';
  status: 'pending' | 'active' | 'inactive' | 'suspended' | 'disabled';
  isEmailVerified: boolean;
  phone?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other';
  registrationNumber?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  staffId?: string;
  department?: string;
  designation?: string;
}

interface StatusConfirmModal {
  isOpen: boolean;
  user: User | null;
  targetStatus: 'active' | 'inactive';
}

interface DeleteConfirmModal {
  isOpen: boolean;
  user: User | null;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  const isStudentView = location.pathname.includes('student');
  const isStaffView =
    (location.pathname.includes('staff') || location.pathname.includes('lecturer')) &&
    !isStudentView;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');

  // Confirmation Modals
  const [statusConfirm, setStatusConfirm] = useState<StatusConfirmModal>({
    isOpen: false,
    user: null,
    targetStatus: 'active',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmModal>({
    isOpen: false,
    user: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Dropdown menu state
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: isStudentView ? 'student' : isStaffView ? 'lecturer' : 'student',
    phone: '',
    address: '',
    gender: 'male',
    // profile specifics
    registrationNumber: '',
    guardianName: '',
    guardianPhone: '',
    staffId: '',
    department: 'Computer Science',
    designation: 'Lecturer',
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      role: isStudentView ? 'student' : isStaffView ? 'lecturer' : 'student',
    }));
  }, [location.pathname, isStudentView, isStaffView]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notice/users/all');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Load drafts on mount
    const savedUser = localStorage.getItem('draft_userFormData');
    if (savedUser) {
      try {
        setFormData(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  // Save drafts when state changes
  useEffect(() => {
    if (formData.firstName || formData.lastName || formData.email) {
      localStorage.setItem('draft_userFormData', JSON.stringify(formData));
    }
  }, [formData]);

  const startEditUser = (user: User) => {
    setEditingUserId(user._id);
    setActiveDropdownId(null);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      role: user.role || 'student',
      phone: user.phone || '',
      address: user.address || '',
      gender: user.gender || 'male',
      registrationNumber: user.registrationNumber || '',
      guardianName: user.guardianName || '',
      guardianPhone: user.guardianPhone || '',
      staffId: user.staffId || '',
      department: user.department || 'Computer Science',
      designation: user.designation || 'Lecturer',
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await api.put(`/notice/users/edit/${editingUserId}`, formData);
        toast.success('User updated successfully!');
        setEditingUserId(null);
      } else {
        await api.post('/auth/register', formData);
        toast.success('User registered successfully! Verification details dispatched.');
      }
      localStorage.removeItem('draft_userFormData');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: isStudentView ? 'student' : isStaffView ? 'lecturer' : 'student',
        phone: '',
        address: '',
        gender: 'male',
        registrationNumber: '',
        guardianName: '',
        guardianPhone: '',
        staffId: '',
        department: 'Computer Science',
        designation: 'Lecturer',
      });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit user data');
    }
  };

  // Open status change confirmation modal
  const openStatusConfirm = (user: User, targetStatus: 'active' | 'inactive') => {
    setActiveDropdownId(null);
    setStatusConfirm({
      isOpen: true,
      user,
      targetStatus,
    });
  };

  // Execute confirmed status change
  const handleConfirmStatusChange = async () => {
    if (!statusConfirm.user) return;
    const targetUser = statusConfirm.user;
    const targetStatus = statusConfirm.targetStatus;
    const previousUsers = [...users];

    // Optimistic UI update immediately
    setUsers((prev) =>
      prev.map((u) => (u._id === targetUser._id ? { ...u, status: targetStatus } : u))
    );
    setActionLoading(true);

    try {
      let res;
      try {
        res = await api.patch(`/users/${targetUser._id}/status`, { status: targetStatus });
      } catch (patchErr: any) {
        // Fallback to notice route if necessary
        if (patchErr.response?.status === 404) {
          res = await api.put(`/notice/users/status/${targetUser._id}`, { status: targetStatus });
        } else {
          throw patchErr;
        }
      }

      // Update affected row with verified response from server
      const updatedStatus = res.data?.status || res.data?.user?.status || targetStatus;
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, status: updatedStatus } : u))
      );

      toast.success(
        res.data?.message ||
          `Student account successfully ${targetStatus === 'active' ? 'activated' : 'deactivated'}!`
      );
      setStatusConfirm({ isOpen: false, user: null, targetStatus: 'active' });
    } catch (err: any) {
      // Roll back optimistic UI changes if API fails
      setUsers(previousUsers);
      toast.error(err.response?.data?.message || 'Failed to update student account status');
    } finally {
      setActionLoading(false);
    }
  };

  // Open delete confirmation modal (Admin only)
  const openDeleteConfirm = (user: User) => {
    setActiveDropdownId(null);
    setDeleteConfirm({
      isOpen: true,
      user,
    });
  };

  // Execute confirmed user deletion (Admin only)
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.user) return;
    const targetUser = deleteConfirm.user;
    const previousUsers = [...users];

    // Optimistic delete
    setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
    setActionLoading(true);

    try {
      let res;
      try {
        res = await api.delete(`/users/${targetUser._id}`);
      } catch (err: any) {
        if (err.response?.status === 404) {
          res = await api.delete(`/notice/users/${targetUser._id}`);
        } else {
          throw err;
        }
      }

      toast.success(res.data?.message || 'Student account deleted successfully');
      setDeleteConfirm({ isOpen: false, user: null });
    } catch (err: any) {
      setUsers(previousUsers);
      toast.error(err.response?.data?.message || 'Failed to delete student account');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Active
        </span>
      );
    } else if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
          Pending
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
          Inactive
        </span>
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {isStudentView
            ? 'Student Directory'
            : isStaffView
            ? 'Faculty & Staff Directory'
            : 'Identity & User Management'}
        </h1>
        <p className="text-sm text-slate-500">
          {isStudentView
            ? 'Manage student academic records, registration details, approval, and account access.'
            : isStaffView
            ? 'Manage faculty departments, designations, qualifications, and system credentials.'
            : 'Add staff and student records, and toggle platform access controls.'}
        </p>
      </div>

      {/* Grid: Create User & Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create/Edit User Form */}
        <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-5 h-fit shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-sky-600" />
              <h3 className="font-semibold text-slate-850 text-sm">
                {editingUserId ? 'Edit User Details' : 'Register User Account'}
              </h3>
            </div>
            {editingUserId && (
              <button
                type="button"
                onClick={() => {
                  setEditingUserId(null);
                  setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    role: isStudentView ? 'student' : 'student',
                    phone: '',
                    address: '',
                    gender: 'male',
                    registrationNumber: '',
                    guardianName: '',
                    guardianPhone: '',
                    staffId: '',
                    department: 'Computer Science',
                    designation: 'Lecturer',
                  });
                }}
                className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Initial Password (Optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank to auto-generate"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">System Role</label>
                <select
                  value={formData.role}
                  disabled={isStudentView || currentUser?.role === 'staff'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-slate-900 disabled:opacity-70"
                >
                  <option value="student">Student</option>
                  {currentUser?.role === 'admin' && (
                    <>
                      <option value="staff">Staff</option>
                      <option value="lecturer">Lecturer</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Student Specific Fields */}
            {formData.role === 'student' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-sky-600 uppercase">
                  Student Profile Info
                </span>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Reg Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto Generated if blank"
                    value={formData.registrationNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, registrationNumber: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Guardian Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Guardian Phone
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.guardianPhone}
                      onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Staff Specific Fields */}
            {(formData.role === 'staff' || formData.role === 'lecturer') && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-indigo-600 uppercase">
                  Staff Profile Info
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Department
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      Designation
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              {editingUserId ? 'Update User Details' : 'Register User'}
            </button>
          </form>
        </div>

        {/* Users Roster Table */}
        <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 lg:col-span-2 shadow-sm overflow-hidden flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">System Roster</h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Total: {users.length} accounts
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <Filter className="h-3 w-3 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Search Query */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <button
                onClick={fetchUsers}
                disabled={loading}
                title="Refresh roster"
                className="text-slate-400 hover:text-slate-900 transition-all p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                  <th className="px-4 py-3">NAME</th>
                  <th className="px-4 py-3">EMAIL</th>
                  <th className="px-4 py-3">ROLE</th>
                  <th className="px-4 py-3">VERIFY</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(() => {
                  const filteredUsers = users
                    .filter((u) => {
                      if (isStudentView) return u.role === 'student';
                      if (isStaffView) return u.role === 'staff' || u.role === 'lecturer';
                      return true;
                    })
                    .filter((u) => {
                      if (statusFilter === 'all') return true;
                      if (statusFilter === 'inactive') {
                        return (
                          u.status === 'inactive' ||
                          u.status === 'suspended' ||
                          u.status === 'disabled'
                        );
                      }
                      return u.status === statusFilter;
                    })
                    .filter((u) =>
                      `${u.firstName} ${u.lastName} ${u.email} ${u.role}`
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    );

                  if (filteredUsers.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          {users.length === 0
                            ? 'No accounts registered.'
                            : 'No accounts match your current filter and search query.'}
                        </td>
                      </tr>
                    );
                  }

                  return filteredUsers.map((u) => {
                    const isPending = u.status === 'pending';
                    const isActive = u.status === 'active';
                    const isInactive =
                      u.status === 'inactive' ||
                      u.status === 'suspended' ||
                      u.status === 'disabled';
                    const isDropdownOpen = activeDropdownId === u._id;

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-850">
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">{u.email}</td>
                        <td className="px-4 py-3 capitalize">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : u.role === 'staff'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : u.role === 'lecturer'
                                ? 'bg-sky-50 text-sky-700 border border-sky-100'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.isEmailVerified ? (
                            <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Yes
                            </span>
                          ) : (
                            <span className="text-amber-500 font-medium">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{renderStatusBadge(u.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Action Button for Students */}
                            {u.role === 'student' && (
                              <>
                                {/* Pending Students: Activate Account OR Deactivate Account */}
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => openStatusConfirm(u, 'active')}
                                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                                      title="Activate Account"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                      <span>Activate</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openStatusConfirm(u, 'inactive')}
                                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                                      title="Deactivate Account"
                                    >
                                      <Ban className="h-3 w-3" />
                                      <span>Deactivate</span>
                                    </button>
                                  </>
                                )}

                                {/* Active Students: Deactivate Account */}
                                {isActive && (
                                  <button
                                    type="button"
                                    onClick={() => openStatusConfirm(u, 'inactive')}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                                    title="Deactivate Account"
                                  >
                                    <Ban className="h-3 w-3" />
                                    <span>Deactivate</span>
                                  </button>
                                )}

                                {/* Inactive Students: Activate Account */}
                                {isInactive && (
                                  <button
                                    type="button"
                                    onClick={() => openStatusConfirm(u, 'active')}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                                    title="Activate Account"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Activate</span>
                                  </button>
                                )}
                              </>
                            )}

                            {/* Action Dropdown Menu & Additional Controls */}
                            <div className="relative inline-block text-left" ref={dropdownRef}>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveDropdownId(isDropdownOpen ? null : u._id)
                                }
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="More Actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {isDropdownOpen && (
                                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-lg border border-slate-100 py-1.5 z-40 text-left">
                                  {/* Student specific status actions */}
                                  {u.role === 'student' && (
                                    <>
                                      {(isPending || isInactive) && (
                                        <button
                                          type="button"
                                          onClick={() => openStatusConfirm(u, 'active')}
                                          className="w-full text-left px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                        >
                                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                          Activate Account
                                        </button>
                                      )}

                                      {(isPending || isActive) && (
                                        <button
                                          type="button"
                                          onClick={() => openStatusConfirm(u, 'inactive')}
                                          className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Ban className="h-3.5 w-3.5 text-rose-600" />
                                          Deactivate Account
                                        </button>
                                      )}
                                      <div className="h-px bg-slate-100 my-1" />
                                    </>
                                  )}

                                  {/* Non-student actions for Admin */}
                                  {u.role !== 'student' && currentUser?.role === 'admin' && (
                                    <>
                                      {u.status !== 'active' && (
                                        <button
                                          type="button"
                                          onClick={() => openStatusConfirm(u, 'active')}
                                          className="w-full text-left px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                        >
                                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                          Activate User
                                        </button>
                                      )}
                                      {u.status === 'active' && (
                                        <button
                                          type="button"
                                          onClick={() => openStatusConfirm(u, 'inactive')}
                                          className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Ban className="h-3.5 w-3.5 text-rose-600" />
                                          Deactivate User
                                        </button>
                                      )}
                                      <div className="h-px bg-slate-100 my-1" />
                                    </>
                                  )}

                                  {/* Edit Profile details (Both Admin and Staff) */}
                                  <button
                                    type="button"
                                    onClick={() => startEditUser(u)}
                                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <UserCog className="h-3.5 w-3.5 text-slate-500" />
                                    Edit Details
                                  </button>

                                  {/* Delete Account (Only Admin) */}
                                  {currentUser?.role === 'admin' && (
                                    <>
                                      <div className="h-px bg-slate-100 my-1" />
                                      <button
                                        type="button"
                                        onClick={() => openDeleteConfirm(u)}
                                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                        Delete Account
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Student Account Status Change */}
      {statusConfirm.isOpen && statusConfirm.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 space-y-5">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl ${
                  statusConfirm.targetStatus === 'active'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}
              >
                {statusConfirm.targetStatus === 'active' ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Ban className="h-6 w-6" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-850">
                  {statusConfirm.targetStatus === 'active'
                    ? 'Activate Student Account'
                    : 'Deactivate Student Account'}
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to {statusConfirm.targetStatus === 'active' ? 'activate' : 'deactivate'} this student account?
                </p>
              </div>
            </div>

            {/* Target Student Details */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Student Name:</span>
                <span className="font-semibold text-slate-800">
                  {statusConfirm.user.firstName} {statusConfirm.user.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Email:</span>
                <span className="font-mono text-slate-700">{statusConfirm.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Current Status:</span>
                <span className="capitalize font-semibold">{statusConfirm.user.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Requested Status:</span>
                <span
                  className={`capitalize font-bold ${
                    statusConfirm.targetStatus === 'active' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {statusConfirm.targetStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  setStatusConfirm({ isOpen: false, user: null, targetStatus: 'active' })
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmStatusChange}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusConfirm.targetStatus === 'active'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Student Account (Admin Only) */}
      {deleteConfirm.isOpen && deleteConfirm.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-850">Delete Student Account</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to permanently delete this student account? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Student Name:</span>
                <span className="font-semibold text-slate-800">
                  {deleteConfirm.user.firstName} {deleteConfirm.user.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Email:</span>
                <span className="font-mono text-slate-700">{deleteConfirm.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Role:</span>
                <span className="capitalize font-semibold">{deleteConfirm.user.role}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeleteConfirm({ isOpen: false, user: null })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
