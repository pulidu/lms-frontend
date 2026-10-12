import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store.js';
import { logoutSuccess } from '../redux/authSlice.js';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket.js';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardList,
  LogOut,
  Bell,
  Menu,
  X,
  Plus,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import AIChatbot from '../components/AIChatbot.js';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);
      const socket = getSocket();

      socket.on('notification', (notif: any) => {
        toast((t) => (
          <span className="flex flex-col">
            <span className="font-semibold text-slate-800">{notif.title}</span>
            <span className="text-xs text-slate-500">{notif.message}</span>
          </span>
        ), {
          icon: '🔔',
          duration: 6000,
        });
      });

      socket.on('announcement', (ann: any) => {
        toast.success(`📢 Announcement: ${ann.title}`);
      });
    }

    return () => {
      disconnectSocket();
    };
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutSuccess());
    navigate('/login');
  };

  const getNavItems = () => {
    const role = user?.role;
    if (role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Student Directory', path: '/admin/students', icon: GraduationCap },
        { label: 'Staff Directory', path: '/admin/staff', icon: Users },
        { label: 'Courses & Syllabus', path: '/admin/courses', icon: BookOpen },
        { label: 'Course Enrollments', path: '/admin/enrollments', icon: ClipboardList },
        { label: 'Timetable Scheduler', path: '/admin/timetable', icon: Calendar },
      ];
    } else if (role === 'staff') {
      return [
        { label: 'Dashboard', path: '/staff', icon: LayoutDashboard },
        { label: 'Student Roster', path: '/staff/students', icon: GraduationCap },
        { label: 'Staff Directory', path: '/staff/lecturers', icon: Users },
        { label: 'Course Enrollments', path: '/staff/enrollments', icon: ClipboardList },
        { label: 'Timetable Scheduler', path: '/staff/timetable', icon: Calendar },
      ];
    } else if (role === 'lecturer') {
      return [
        { label: 'Dashboard', path: '/lecturer', icon: LayoutDashboard },
        { label: 'Student Roster', path: '/staff/students', icon: GraduationCap },
        { label: 'Grades & Marks', path: '/staff/marks', icon: GraduationCap },
        { label: 'Attendance Roster', path: '/staff/attendance', icon: ClipboardList },
        { label: 'Assignments', path: '/staff/assignments', icon: BookOpen },
        { label: 'Timetable Scheduler', path: '/staff/timetable', icon: Calendar },
      ];
    } else {
      return [
        { label: 'My Dashboard', path: '/student', icon: LayoutDashboard },
        { label: 'My Classes', path: '/student/courses', icon: BookOpen },
        { label: 'Enroll Course', path: '/student/enroll', icon: Plus },
        { label: 'Academic Grades', path: '/student/marks', icon: GraduationCap },
        { label: 'Timetable & Agenda', path: '/student/timetable', icon: Calendar },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Collapsible Left Drawer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-slate-200 transition-all duration-200 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:-translate-x-64'
        }`}
      >
        {/* Sidebar Header Brand (Only visible in desktop when sidebar is open) */}
        <div className="flex h-16 items-center px-6 border-b border-slate-200 gap-3">
          <GraduationCap className="h-6 w-6 text-slate-900" />
          <span className="font-semibold text-base tracking-tight text-slate-900">LMS Classroom</span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Roster Profile Card */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-900 uppercase">
              {user?.id ? (
                <img
                  src={`/api/auth/profile-image/${user.id}`}
                  alt="Avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName || 'U'}`;
                  }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{user?.firstName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[9px] text-slate-400 font-bold capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Clean Sticky Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <button
              className="text-slate-500 hover:text-slate-900 p-1 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-bold text-slate-800 text-sm tracking-wide capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time socket status bell indicator */}
            <div className="p-2 text-slate-450 hover:text-slate-700 rounded-full hover:bg-slate-50 cursor-pointer relative transition-all">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-slate-900 ring-2 ring-white animate-pulse" />
            </div>

            {/* Quick Actions Dropdown Menu Button */}
            <div className="relative">
              <button
                onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                className="flex items-center justify-center p-2 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-all shadow-sm"
                title="Quick Actions"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>

              {plusMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setPlusMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 z-40 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-xs">
                    {user?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => { navigate('/admin/users'); setPlusMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700"
                        >
                          Register Student
                        </button>
                        <button
                          onClick={() => { navigate('/admin/courses'); setPlusMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700"
                        >
                          Add Academic Course
                        </button>
                      </>
                    )}
                    {(user?.role === 'staff' || user?.role === 'lecturer') && (
                      <>
                        {user?.role === 'staff' && (
                          <button
                            onClick={() => { navigate('/staff/users'); setPlusMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700"
                          >
                            Roster New Student
                          </button>
                        )}
                        <button
                          onClick={() => { navigate(user?.role === 'lecturer' ? '/lecturer' : '/staff'); setPlusMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700"
                        >
                          Post Announcement
                        </button>
                      </>
                    )}
                    {user?.role === 'student' && (
                      <>
                        <button
                          onClick={() => { navigate('/student/courses'); setPlusMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold text-slate-700"
                        >
                          Join a Class
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-800 uppercase">
                  {user?.id ? (
                    <img
                      src={`/api/auth/profile-image/${user.id}`}
                      alt="Avatar"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName || 'U'}`;
                      }}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{user?.firstName.charAt(0)}</span>
                  )}
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 z-40 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-800 truncate">{user?.firstName} {user?.lastName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-rose-600 font-semibold flex items-center gap-1.5"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* AI Assistant Chat Trigger (Student only) */}
            {user?.role === 'student' && (
              <button
                onClick={() => setChatbotOpen(true)}
                className="flex items-center gap-1 bg-slate-900 hover:bg-black text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Assistant
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Viewport main body canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      {/* AI Chatbot Drawer slider */}
      {user?.role === 'student' && (
        <AIChatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
      )}
    </div>
  );
};

export default DashboardLayout;
