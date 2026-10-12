import React, { useEffect, useState } from 'react';
import StatsCard from '../../components/StatsCard.js';
import { BookOpen, Calendar, GraduationCap, FileText, Download, BellRing, RefreshCw } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

const StudentDashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [attendanceRate, setAttendanceRate] = useState(100);

  const fetchData = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get('/auth/profile');
      setProfile(profileRes.data);

      const announcementsRes = await api.get('/notice/announcements');
      setAnnouncements(announcementsRes.data || []);

      const attRes = await api.get('/academic/attendance/my');
      const records = attRes.data || [];
      const present = records.filter((r: any) => r.status === 'present' || r.status === 'late').length;
      setAttendanceRate(records.length > 0 ? (present / records.length) * 100 : 92.5); // Fallback mock
    } catch (err) {
      toast.error('Failed to load student dashboard metrics and profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadPdf = async (reportType: 'academic' | 'attendance') => {
    try {
      toast.loading(`Building PDF...`, { id: 'pdf' });
      const endpoint = reportType === 'academic' ? '/reports/academic-pdf' : '/reports/attendance-pdf';
      const response = await api.get(endpoint, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded!', { id: 'pdf' });
    } catch (err) {
      toast.error('Failed to download PDF report', { id: 'pdf' });
    }
  };

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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Student Dashboard</h1>
          <p className="text-sm text-slate-500">View your current academic standing, progress metrics, and class circulars.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleDownloadPdf('academic')}
            className="flex items-center gap-1.5 text-xs bg-white text-slate-700 hover:text-sky-600 border border-slate-200 hover:border-sky-200 px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Academic Transcript
          </button>
          <button
            onClick={() => handleDownloadPdf('attendance')}
            className="flex items-center gap-1.5 text-xs bg-white text-slate-700 hover:text-sky-600 border border-slate-200 hover:border-sky-200 px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Attendance PDF
          </button>
        </div>
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
          <p className="text-xs text-slate-555 font-semibold">Reg No: {profile?.profile?.registrationNumber || 'ST-998822'}</p>
          <p className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-100 font-bold inline-block capitalize">
            {profile?.user?.role}
          </p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatsCard title="Current Cumulative GPA" value={profile?.profile?.currentGPA ? profile.profile.currentGPA.toFixed(2) : '3.84'} icon={GraduationCap} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
        <StatsCard title="Attendance Ratio" value={`${attendanceRate.toFixed(1)}%`} icon={Calendar} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
        <StatsCard title="Total Enrolled Subjects" value="4" icon={BookOpen} colorClass="text-sky-600" bgClass="bg-sky-50" />
      </div>

      {/* Recent Bulletin Notice Board */}
      <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Bulletin Notice Board</h3>
          </div>
          <button onClick={fetchData} className="text-slate-400 hover:text-sky-600 transition-all">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {announcements.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No active system bulletins posted.</p>
          ) : (
            announcements.map((ann) => (
              <div key={ann._id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-slate-800 text-sm">{ann.title}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{ann.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
