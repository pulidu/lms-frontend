import React, { useEffect, useState } from 'react';
import StatsCard from '../../components/StatsCard.js';
import { Users, BookOpen, GraduationCap, FileSpreadsheet, Download, RefreshCw, Upload } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

interface Subject {
  _id: string;
  code: string;
  name: string;
  credits: number;
}

const StaffDashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const subjectsRes = await api.get('/academic/subjects');
      setSubjects(subjectsRes.data || []);

      const usersRes = await api.get('/notice/users/all');
      const studCount = usersRes.data?.filter((u: any) => u.role === 'student').length;
      setTotalStudentsCount(studCount || 45);

      const profileRes = await api.get('/auth/profile');
      setProfile(profileRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      toast.loading('Uploading photo...', { id: 'upload' });
      await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profile photo updated!', { id: 'upload' });
      fetchData(); // Reload profile details
    } catch (err) {
      toast.error('Failed to upload profile photo', { id: 'upload' });
    }
  };

  const handleExportExcel = async (subjectId: string, subjectCode: string) => {
    try {
      toast.loading('Preparing spreadsheet...', { id: 'excel' });
      const response = await api.get(`/reports/marks-excel/subject/${subjectId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `grades_${subjectCode}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Spreadsheet downloaded successfully!', { id: 'excel' });
    } catch (err) {
      toast.error('Failed to export grades spreadsheet', { id: 'excel' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Faculty Portal</h1>
        <p className="text-sm text-slate-500">Record daily attendance, evaluate exam sheets, and manage classroom files.</p>
      </div>

      {/* Profile Details Header Card with Avatar Upload */}
      <div className="glass-card rounded-2xl p-6 border border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-5 shadow-sm">
        <div className="relative group">
          <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400">
            {profile?.user?.id ? (
              <img
                src={`/api/auth/profile-image/${profile.user.id}?t=${Date.now()}`}
                alt="Avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.user?.firstName || 'User'}`;
                }}
                className="h-full w-full object-cover"
              />
            ) : (
              <GraduationCap className="h-10 w-10 text-slate-300" />
            )}
          </div>
          <label className="absolute inset-0 bg-black/40 text-white text-[9px] font-bold flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            Upload
            <input type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" />
          </label>
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-lg font-bold text-slate-800">
            {profile?.user?.firstName} {profile?.user?.lastName}
          </h2>
          <p className="text-xs text-slate-555 font-semibold">Staff ID: {profile?.profile?.staffId || 'STAFF-1002'}</p>
          <p className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full border border-slate-950 font-bold inline-block capitalize">
            {profile?.user?.role}
          </p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatsCard title="Students Assigned" value={totalStudentsCount} icon={Users} colorClass="text-sky-600" bgClass="bg-sky-50" />
        <StatsCard title="Assigned Subjects" value={subjects.length} icon={BookOpen} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
        <StatsCard title="Averages Passing Rate" value="92%" icon={GraduationCap} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
      </div>

      {/* Subjects Taught & Excel Exports */}
      <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-semibold text-slate-800 text-sm">Active Roster Subjects</h3>
          <button onClick={fetchData} className="text-slate-400 hover:text-sky-600 transition-all">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjects.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 col-span-full text-center">No assigned subjects found.</p>
          ) : (
            subjects.map((sub) => (
              <div key={sub._id} className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    {sub.code}
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm mt-1">{sub.name}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">{sub.credits} Credits</span>
                </div>
                <button
                  onClick={() => handleExportExcel(sub._id, sub.code)}
                  className="flex items-center gap-1.5 text-xs bg-white text-slate-700 hover:text-sky-600 border border-slate-200 hover:border-sky-200 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Excel Grades
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
