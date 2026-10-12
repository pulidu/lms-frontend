import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { UserPlus, ShieldAlert, CheckCircle, Ban, RefreshCw, UserCog, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store.js';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'staff' | 'student' | 'lecturer';
  status: 'pending' | 'active' | 'suspended' | 'disabled';
  isEmailVerified: boolean;
  phone?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other';
  staffId?: string;
  department?: string;
  designation?: string;
}

const StaffManagement: React.FC = () => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State specifically for Staff
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'lecturer',
    phone: '',
    address: '',
    gender: 'male',
    staffId: '',
    department: 'Computer Science',
    designation: 'Lecturer',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notice/users/all');
      setUsers(res.data?.filter((u: User) => u.role === 'staff' || u.role === 'lecturer') || []);
    } catch (err) {
      toast.error('Failed to load lecturers roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Load drafts on mount
    const savedStaff = localStorage.getItem('draft_staffFormData');
    if (savedStaff) {
      try { setFormData(JSON.parse(savedStaff)); } catch(e){}
    }
  }, []);

  // Save drafts when state changes
  useEffect(() => {
    if (formData.firstName || formData.lastName || formData.email) {
      localStorage.setItem('draft_staffFormData', JSON.stringify(formData));
    }
  }, [formData]);

  const startEditUser = (user: User) => {
    setEditingUserId(user._id);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '', // do not update password via general edit form
      role: user.role || 'lecturer',
      phone: user.phone || '',
      address: user.address || '',
      gender: user.gender || 'male',
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
        toast.success('Lecturer record updated successfully!');
        setEditingUserId(null);
      } else {
        await api.post('/auth/register', formData);
        toast.success('Lecturer registered successfully!');
      }
      localStorage.removeItem('draft_staffFormData');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'lecturer',
        phone: '',
        address: '',
        gender: 'male',
        staffId: '',
        department: 'Computer Science',
        designation: 'Lecturer',
      });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit lecturer data');
    }
  };

  const handleChangeStatus = async (userId: string, newStatus: string) => {
    try {
      await api.put(`/notice/users/status/${userId}`, { status: newStatus });
      toast.success(`Lecturer status is now ${newStatus}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Faculty & Staff Directory</h1>
        <p className="text-sm text-slate-500">Manage academic departments, designation roles, and platform credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create / Edit Staff Form */}
        {currentUser?.role === 'admin' && (
          <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-5 h-fit shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-650" />
                <h3 className="font-semibold text-slate-850 text-sm">
                  {editingUserId ? 'Edit Faculty Details' : 'Register Faculty Member'}
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
                      role: 'lecturer',
                      phone: '',
                      address: '',
                      gender: 'male',
                      staffId: '',
                      department: 'Computer Science',
                      designation: 'Lecturer',
                    });
                  }}
                  className="text-[10px] font-bold text-rose-500 hover:underline"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-550"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-550"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-550"
                />
              </div>

              {!editingUserId && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Initial Password (Optional)</label>
                  <input
                    type="text"
                    placeholder="Leave blank to auto-generate"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-550"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">System Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-550"
                  >
                    <option value="lecturer">Lecturer (Academic)</option>
                    <option value="staff">Staff (Administrative)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-550"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Staff ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto generated"
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-550"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-550"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Designation</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-550"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                {editingUserId ? 'Update Faculty Details' : 'Register Faculty'}
              </button>
            </form>
          </div>
        )}

        {/* Users Roster Table */}
        <div className={`glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm overflow-hidden flex flex-col ${currentUser?.role === 'admin' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Faculty Directory</h3>
              <p className="text-[10px] text-slate-400 font-medium">Total: {users.length} active lecturers</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, email, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 w-full sm:w-60 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <button onClick={fetchUsers} className="text-slate-400 hover:text-slate-900 transition-all p-2 bg-slate-50 rounded-xl border border-slate-200">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                  <th className="px-4 py-3">Lecturer</th>
                  <th className="px-4 py-3">ID / Code</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Status</th>
                  {currentUser?.role === 'admin' && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(() => {
                  const filteredUsers = users.filter((u) =>
                    `${u.firstName} ${u.lastName} ${u.email} ${u.department} ${u.designation}`.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  if (filteredUsers.length === 0) {
                    return (
                      <tr>
                        <td colSpan={currentUser?.role === 'admin' ? 6 : 5} className="text-center py-6 text-slate-400">
                          {users.length === 0 ? 'No lecturers registered.' : 'No lecturers match your search query.'}
                        </td>
                      </tr>
                    );
                  }
                  return filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{u.firstName} {u.lastName}</span>
                          <span className="text-[10px] text-slate-400">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{u.staffId || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-800 font-semibold">{u.department || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full border font-bold text-[10px] ${
                          u.role === 'lecturer' ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          {u.designation || (u.role === 'lecturer' ? 'Lecturer' : 'Staff')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      {currentUser?.role === 'admin' && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => startEditUser(u)}
                              className="p-1 text-slate-700 hover:bg-slate-100 rounded"
                              title="Edit Lecturer Details"
                            >
                              <UserCog className="h-4 w-4" />
                            </button>
                            {u.status !== 'active' && (
                              <button
                                onClick={() => handleChangeStatus(u._id, 'active')}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Activate"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            {u.status !== 'disabled' && (
                              <button
                                onClick={() => handleChangeStatus(u._id, 'disabled')}
                                className="p-1 text-rose-500 hover:bg-rose-55 rounded"
                                title="Disable"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StaffManagement;
