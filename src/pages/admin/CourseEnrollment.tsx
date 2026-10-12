import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Users, Plus, Trash2, Search, GraduationCap, Calendar, RefreshCw } from 'lucide-react';

interface Course {
  _id: string;
  code: string;
  name: string;
}

interface Batch {
  _id: string;
  name: string;
  academicYear: string;
  intake: string;
}

interface EnrolledStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  enrollmentId: string;
}

interface AvailableStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const CourseEnrollment: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [studentToEnroll, setStudentToEnroll] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Batch Creation Form State
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchYear, setNewBatchYear] = useState('');
  const [newBatchIntake, setNewBatchIntake] = useState('');
  const [newBatchStart, setNewBatchStart] = useState('');
  const [newBatchEnd, setNewBatchEnd] = useState('');
  const [batchCreateLoading, setBatchCreateLoading] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/academic/courses');
      setCourses(res.data || []);
    } catch (err) {
      toast.error('Failed to load courses');
    }
  };

  const fetchBatches = async (courseId: string) => {
    try {
      const res = await api.get(`/academic/courses/${courseId}/batches`);
      setBatches(res.data || []);
    } catch (err) {
      toast.error('Failed to load batches for this course');
    }
  };

  const fetchEnrollments = async () => {
    if (!selectedCourse || !selectedBatch) return;
    setLoading(true);
    try {
      const res = await api.get(`/academic/enrollments/course/${selectedCourse}/batch/${selectedBatch}`);
      setEnrolledStudents(res.data?.enrolledStudents || []);
      setAvailableStudents(res.data?.availableStudents || []);
      setStudentToEnroll('');
    } catch (err) {
      toast.error('Failed to load student enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchBatches(selectedCourse);
      setSelectedBatch('');
      setEnrolledStudents([]);
      setAvailableStudents([]);
    } else {
      setBatches([]);
      setSelectedBatch('');
      setEnrolledStudents([]);
      setAvailableStudents([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse && selectedBatch) {
      fetchEnrollments();
    } else {
      setEnrolledStudents([]);
      setAvailableStudents([]);
    }
  }, [selectedBatch]);

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedBatch || !studentToEnroll) {
      toast.error('Please select a student to enroll');
      return;
    }

    setEnrollLoading(true);
    try {
      await api.post('/academic/enrollments', {
        studentId: studentToEnroll,
        courseId: selectedCourse,
        batchId: selectedBatch,
      });
      toast.success('Student enrolled successfully!');
      fetchEnrollments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      toast.error('Please select a course first');
      return;
    }
    if (!newBatchName || !newBatchYear || !newBatchIntake || !newBatchStart || !newBatchEnd) {
      toast.error('Please fill in all fields for the new batch');
      return;
    }

    setBatchCreateLoading(true);
    try {
      const res = await api.post('/academic/batches', {
        name: newBatchName,
        academicYear: newBatchYear,
        startDate: newBatchStart,
        endDate: newBatchEnd,
        intake: newBatchIntake,
        courseId: selectedCourse,
      });
      toast.success('Batch created successfully!');
      setNewBatchName('');
      setNewBatchYear('');
      setNewBatchIntake('');
      setNewBatchStart('');
      setNewBatchEnd('');
      
      // Reload batches for selected course
      await fetchBatches(selectedCourse);
      
      if (res.data?.batch?._id) {
        setSelectedBatch(res.data.batch._id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create batch');
    } finally {
      setBatchCreateLoading(false);
    }
  };

  const handleRemoveStudent = async (enrollmentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student from the course enrollment?')) return;
    try {
      await api.delete(`/academic/enrollments/${enrollmentId}`);
      toast.success('Student removed from enrollment successfully');
      fetchEnrollments();
    } catch (err) {
      toast.error('Failed to remove student from enrollment');
    }
  };

  const filteredEnrolled = enrolledStudents.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Course Enrollments</h1>
        <p className="text-sm text-slate-500">Manage student registry rosters per course and batch.</p>
      </div>

      {/* Select Course & Batch Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
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
                {b.name} ({b.intake} {b.academicYear})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Forms Side Column */}
        <div className="space-y-6 lg:col-span-1 h-fit">
          
          {/* Create Batch Form */}
          {selectedCourse && (
            <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Create New Batch</h3>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Batch Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Batch 01"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Intake</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. January"
                      value={newBatchIntake}
                      onChange={(e) => setNewBatchIntake(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Academic Year</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026"
                      value={newBatchYear}
                      onChange={(e) => setNewBatchYear(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start Date</label>
                    <input
                      type="date"
                      required
                      value={newBatchStart}
                      onChange={(e) => setNewBatchStart(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">End Date</label>
                    <input
                      type="date"
                      required
                      value={newBatchEnd}
                      onChange={(e) => setNewBatchEnd(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={batchCreateLoading}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Create Batch
                </button>
              </form>
            </div>
          )}

          {/* Enroll Student Form */}
          <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus className="h-5 w-5 text-indigo-650" />
              <h3 className="font-semibold text-slate-800 text-sm">Enroll Student</h3>
            </div>

            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Available Students</label>
                <select
                  value={studentToEnroll}
                  onChange={(e) => setStudentToEnroll(e.target.value)}
                  disabled={!selectedBatch}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-800 disabled:bg-slate-100"
                >
                  <option value="">-- Select Student to Join --</option>
                  {availableStudents.map((stud) => (
                    <option key={stud._id} value={stud._id}>
                      {stud.firstName} {stud.lastName} ({stud.email})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={enrollLoading || !studentToEnroll}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Student to Batch
              </button>
            </form>
          </div>
        </div>

        {/* Enrolled Students Table */}
        <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 lg:col-span-2 shadow-sm h-fit">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-800 text-sm">Enrolled Roster</h3>
            </div>
            {selectedBatch && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-slate-800"
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : !selectedBatch ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <GraduationCap className="h-10 w-10 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">No batch selected</p>
              <p className="text-[10px]">Select a course and a batch in the selectors above to see the enrolled student list.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredEnrolled.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-slate-400">
                        No students enrolled in this batch yet.
                      </td>
                    </tr>
                  ) : (
                    filteredEnrolled.map((stud) => (
                      <tr key={stud._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-850">
                          {stud.firstName} {stud.lastName}
                        </td>
                        <td className="px-4 py-3">{stud.email}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveStudent(stud.enrollmentId)}
                            className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CourseEnrollment;
