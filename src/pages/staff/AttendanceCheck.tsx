import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { ClipboardCheck, Calendar, UserCheck, RefreshCw } from 'lucide-react';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Subject {
  _id: string;
  code: string;
  name: string;
}

const AttendanceCheck: React.FC = () => {
  interface Course {
    _id: string;
    code: string;
    name: string;
    subjects: Subject[];
  }
  interface Batch {
    _id: string;
    name: string;
    academicYear: string;
    intake: string;
  }

  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSheet, setAttendanceSheet] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' }>({});
  const [loading, setLoading] = useState(false);

  const fetchInitialData = async () => {
    try {
      const coursesRes = await api.get('/academic/courses');
      setCourses(coursesRes.data || []);
    } catch (err) {
      toast.error('Failed to load courses');
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Sync batches and subjects when course changes
  useEffect(() => {
    if (selectedCourse) {
      const courseObj = courses.find((c) => c._id === selectedCourse);
      setSubjects(courseObj?.subjects || []);
      setSelectedSubject('');
      
      const fetchCourseBatches = async () => {
        try {
          const res = await api.get(`/academic/courses/${selectedCourse}/batches`);
          setBatches(res.data || []);
          setSelectedBatch('');
        } catch (err) {
          toast.error('Failed to load batches');
        }
      };
      fetchCourseBatches();
    } else {
      setSubjects([]);
      setBatches([]);
      setSelectedSubject('');
      setSelectedBatch('');
    }
  }, [selectedCourse, courses]);

  // Load students when course, batch, and subject are selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse || !selectedBatch || !selectedSubject) {
        setStudents([]);
        return;
      }
      try {
        const res = await api.get(`/academic/enrollments/course/${selectedCourse}/batch/${selectedBatch}`);
        setStudents(res.data?.enrolledStudents || []);
      } catch (err) {
        toast.error('Failed to load enrolled students');
      }
    };
    fetchStudents();
  }, [selectedCourse, selectedBatch, selectedSubject]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceSheet((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSubject) {
      toast.error('Please select a subject first');
      return;
    }

    const unMarked = students.filter((s) => !attendanceSheet[s._id]);
    if (unMarked.length > 0) {
      toast.error(`Please mark attendance for all students (${unMarked.length} left)`);
      return;
    }

    setLoading(true);
    try {
      for (const student of students) {
        await api.post('/academic/attendance', {
          studentId: student._id,
          subjectId: selectedSubject,
          date: selectedDate,
          status: attendanceSheet[student._id],
        });
      }
      toast.success('Daily attendance submitted successfully!');
    } catch (err) {
      toast.error('Failed to log attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Attendance Roster Check</h1>
        <p className="text-sm text-slate-500">Record classroom presence and track student compliance details.</p>
      </div>

      {/* Select Course, Batch, Subject, and Date Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white grid grid-cols-1 md:grid-cols-5 gap-4 shadow-sm items-end">
        <div>
          <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-800"
          >
            <option value="">-- Choose Course --</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code} - {c.name}
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
                {b.name}
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
          <label className="text-[10px] font-bold text-slate-450 uppercase mb-1.5 block">Date of Lecture</label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-850"
            />
          </div>
        </div>

        <button
          onClick={handleSubmitAttendance}
          disabled={loading || !selectedSubject || !selectedBatch}
          className="bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer h-[42px]"
        >
          <ClipboardCheck className="h-4 w-4" />
          Submit Attendance
        </button>
      </div>

      {/* Students List */}
      <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm">
        <h3 className="font-semibold text-slate-800 text-sm">Classroom Students</h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-center">Present</th>
                <th className="px-4 py-3 text-center">Late</th>
                <th className="px-4 py-3 text-center">Absent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((stud) => (
                  <tr key={stud._id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-850">
                      {stud.firstName} {stud.lastName}
                    </td>
                    <td className="px-4 py-3">{stud.email}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`att-${stud._id}`}
                        checked={attendanceSheet[stud._id] === 'present'}
                        onChange={() => handleStatusChange(stud._id, 'present')}
                        className="h-4 w-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`att-${stud._id}`}
                        checked={attendanceSheet[stud._id] === 'late'}
                        onChange={() => handleStatusChange(stud._id, 'late')}
                        className="h-4 w-4 text-amber-500 border-slate-300 focus:ring-amber-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`att-${stud._id}`}
                        checked={attendanceSheet[stud._id] === 'absent'}
                        onChange={() => handleStatusChange(stud._id, 'absent')}
                        className="h-4 w-4 text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCheck;
