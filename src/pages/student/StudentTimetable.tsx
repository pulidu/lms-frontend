import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store.js';
import api from '../../services/api.js';
import { Calendar, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface TimetableEntry {
  _id: string;
  subjectId: {
    code: string;
    name: string;
  };
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  lecturerId: {
    firstName: string;
    lastName: string;
  };
}

const StudentTimetable: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [schedule, setSchedule] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTimetable = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get student's enrollments
      const enrollRes = await api.get(`/academic/enrollments/${user.id}`);
      const activeEnrollment = enrollRes.data?.find((e: any) => e.status === 'active');
      
      const courseId = activeEnrollment?.courseId?._id || activeEnrollment?.courseId;
      const batchId = activeEnrollment?.batchId?._id || activeEnrollment?.batchId;
      
      if (courseId) {
        const url = batchId 
          ? `/notice/timetables/course/${courseId}?batchId=${batchId}`
          : `/notice/timetables/course/${courseId}`;
        const scheduleRes = await api.get(url);
        setSchedule(scheduleRes.data || []);
      } else {
        setSchedule([]);
      }
    } catch (err) {
      toast.error('Failed to load weekly timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [user]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Class Roster Schedule</h1>
        <p className="text-sm text-slate-500">Monitor weekly subject timetables and lecture room allocations.</p>
      </div>

      {/* Timetable Grid */}
      <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-650" />
            <h3 className="font-semibold text-slate-850 text-sm">Weekly Roster Calendar</h3>
          </div>
          <button onClick={fetchTimetable} className="text-slate-400 hover:text-indigo-650 transition-all cursor-pointer">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {days.map((day) => {
            const dayLectures = schedule.filter((s) => s.dayOfWeek.toLowerCase() === day.toLowerCase());

            return (
              <div key={day} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex flex-col space-y-3 min-h-[160px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200/60 pb-1.5 block">
                  {day}
                </span>

                <div className="flex-1 space-y-2">
                  {dayLectures.length === 0 ? (
                    <span className="text-[10px] text-slate-400 font-medium italic block py-4">No Lectures</span>
                  ) : (
                    dayLectures.map((lec) => (
                      <div key={lec._id} className="bg-white border border-slate-200 p-2.5 rounded-xl space-y-1.5 shadow-sm">
                        <span className="text-[9px] font-bold text-sky-850 uppercase block leading-none">{lec.subjectId?.code}</span>
                        <h4 className="text-[10px] font-bold text-slate-800 leading-tight">{lec.subjectId?.name}</h4>
                        <div className="text-[9px] text-slate-450 font-semibold space-y-0.5 pt-1 border-t border-slate-100">
                          <p>{lec.startTime} - {lec.endTime}</p>
                          <p className="text-indigo-600">{lec.roomNumber}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentTimetable;
