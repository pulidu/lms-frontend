import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Calendar, Plus, RefreshCw, Clock, MapPin, User as UserIcon } from 'lucide-react';

interface Course {
  _id: string;
  code: string;
  name: string;
  subjects: Array<{
    _id: string;
    code: string;
    name: string;
  }>;
}

interface Batch {
  _id: string;
  name: string;
  academicYear: string;
  intake: string;
}

interface Subject {
  _id: string;
  code: string;
  name: string;
}

interface Lecturer {
  _id: string;
  firstName: string;
  lastName: string;
}

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

const TimetableScheduler: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [schedule, setSchedule] = useState<TimetableEntry[]>([]);

  // Selection states
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const coursesRes = await api.get('/academic/courses');
      setCourses(coursesRes.data || []);

      const usersRes = await api.get('/notice/users/all');
      setLecturers(usersRes.data?.filter((u: any) => u.role === 'lecturer') || []);
    } catch (err) {
      toast.error('Failed to load base directory metadata');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async (courseId: string) => {
    try {
      const res = await api.get(`/academic/courses/${courseId}/batches`);
      setBatches(res.data || []);
      setSelectedBatch('');
    } catch (err) {
      toast.error('Failed to load batches for this course');
    }
  };

  const fetchTimetable = async (courseId: string, batchId: string) => {
    if (!courseId || !batchId) {
      setSchedule([]);
      return;
    }
    try {
      const res = await api.get(`/notice/timetables/course/${courseId}?batchId=${batchId}`);
      setSchedule(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch timetables for selected course & batch');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync subjects & batches when course is selected
  useEffect(() => {
    if (selectedCourse) {
      const courseObj = courses.find((c) => c._id === selectedCourse);
      setSubjects(courseObj?.subjects || []);
      setSelectedSubject('');
      fetchBatches(selectedCourse);
    } else {
      setSubjects([]);
      setBatches([]);
      setSelectedBatch('');
      setSchedule([]);
    }
  }, [selectedCourse, courses]);

  // Fetch timetable when batch changes
  useEffect(() => {
    if (selectedCourse && selectedBatch) {
      fetchTimetable(selectedCourse, selectedBatch);
    } else {
      setSchedule([]);
    }
  }, [selectedBatch]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedBatch || !selectedSubject || !selectedLecturer || !roomNumber) {
      toast.error('Please fill in all scheduling fields');
      return;
    }

    setSubmitLoading(true);
    try {
      await api.post('/notice/timetables', {
        courseId: selectedCourse,
        batchId: selectedBatch,
        subjectId: selectedSubject,
        dayOfWeek,
        startTime,
        endTime,
        roomNumber,
        lecturerId: selectedLecturer,
      });

      toast.success('Lecture entry scheduled and notification email sent to enrolled students!');
      setRoomNumber('');
      setSelectedSubject('');
      setSelectedLecturer('');
      fetchTimetable(selectedCourse, selectedBatch);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule timetable entry');
    } finally {
      setSubmitLoading(false);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Timetable Scheduler</h1>
        <p className="text-sm text-slate-500">Plan weekly lecture blocks, assign rooms, and notify enrolled students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Scheduler Form */}
        <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="h-5 w-5 text-indigo-650" />
            <h3 className="font-semibold text-slate-800 text-sm">Schedule New Class</h3>
          </div>

          <form onSubmit={handleAddSchedule} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">Select Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-800"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">Select Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                disabled={!selectedCourse}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-800 disabled:bg-slate-100"
              >
                <option value="">-- Choose Batch --</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.intake} {b.academicYear})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedCourse}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-800 disabled:bg-slate-100"
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-800"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">Room Number / Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Lab 3A or Lecture Hall 1"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">Assigned Lecturer</label>
              <select
                value={selectedLecturer}
                onChange={(e) => setSelectedLecturer(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-800"
              >
                <option value="">-- Choose Lecturer --</option>
                {lecturers.map((lect) => (
                  <option key={lect._id} value={lect._id}>
                    {lect.firstName} {lect.lastName}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitLoading || !selectedBatch}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black disabled:bg-slate-350 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Schedule & Send Notifications
            </button>
          </form>
        </div>

        {/* Schedule Display Grid */}
        <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 lg:col-span-2 shadow-sm h-fit">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-650" />
              <h3 className="font-semibold text-slate-855 text-sm">Weekly Roster Calendar</h3>
            </div>
            {selectedCourse && selectedBatch && (
              <button
                onClick={() => fetchTimetable(selectedCourse, selectedBatch)}
                disabled={loading}
                className="text-slate-400 hover:text-indigo-650 transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 animate-spin-slow" />
              </button>
            )}
          </div>

          {!selectedBatch ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
              <Calendar className="h-10 w-10 text-slate-300" />
              <p className="text-slate-500 font-semibold text-xs">No Batch Selected</p>
              <p className="text-slate-400 text-[10px]">Select a course and batch to review the scheduled weekly agenda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {days.map((day) => {
                const dayLectures = schedule.filter(
                  (s) => s.dayOfWeek.toLowerCase() === day.toLowerCase()
                );

                return (
                  <div
                    key={day}
                    className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50 flex flex-col space-y-2 min-h-[160px]"
                  >
                    <span className="text-[9px] font-bold text-slate-400 uppercase border-b border-slate-200/60 pb-1 block">
                      {day.slice(0, 3)}
                    </span>

                    <div className="flex-1 space-y-2">
                      {dayLectures.length === 0 ? (
                        <span className="text-[9px] text-slate-350 font-medium italic block py-4">No Classes</span>
                      ) : (
                        dayLectures.map((lec) => (
                          <div
                            key={lec._id}
                            className="bg-white border border-slate-200 p-2 rounded-xl space-y-1 shadow-sm text-left"
                          >
                            <span className="text-[8px] font-bold text-sky-805 uppercase block leading-none">
                              {lec.subjectId?.code}
                            </span>
                            <h4 className="text-[9px] font-bold text-slate-850 leading-tight">
                              {lec.subjectId?.name}
                            </h4>
                            <div className="text-[8px] text-slate-400 font-semibold space-y-0.5 pt-1 border-t border-slate-100">
                              <p className="flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5 text-slate-350" />
                                {lec.startTime} - {lec.endTime}
                              </p>
                              <p className="flex items-center gap-0.5 text-indigo-650">
                                <MapPin className="h-2.5 w-2.5 text-indigo-400" />
                                {lec.roomNumber}
                              </p>
                              <p className="flex items-center gap-0.5 text-slate-500 font-bold truncate">
                                <UserIcon className="h-2.5 w-2.5 text-slate-400" />
                                {lec.lecturerId?.firstName} {lec.lecturerId?.lastName}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TimetableScheduler;
