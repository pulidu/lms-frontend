import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { BookOpen, FolderOpen, Plus, Tag, RefreshCw, Pencil, Trash, X, Mail, Calendar } from 'lucide-react';

interface Subject {
  _id: string;
  code: string;
  name: string;
  credits: number;
  department?: string;
}

interface Course {
  _id: string;
  code: string;
  name: string;
  department: string;
  subjects: Subject[];
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);

  // Editing state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

  // Email Composer State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedCourseForEmail, setSelectedCourseForEmail] = useState<Course | null>(null);
  const [emailPayload, setEmailPayload] = useState({ subject: '', body: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  const startEmailComposer = (course: Course) => {
    setSelectedCourseForEmail(course);
    setEmailPayload({ subject: `Notice: ${course.name}`, body: '' });
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEmail) return;
    setSendingEmail(true);
    try {
      await api.post(`/academic/courses/${selectedCourseForEmail._id}/email`, emailPayload);
      toast.success('Announcement email sent to all lecturers and students successfully!');
      setEmailModalOpen(false);
      setSelectedCourseForEmail(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch emails.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Batches Modal State
  const [batchesModalOpen, setBatchesModalOpen] = useState(false);
  const [selectedCourseForBatches, setSelectedCourseForBatches] = useState<Course | null>(null);
  const [batchesList, setBatchesList] = useState<Batch[]>([]);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchYear, setNewBatchYear] = useState(new Date().getFullYear().toString());
  const [newBatchIntake, setNewBatchIntake] = useState('');
  const [newBatchStart, setNewBatchStart] = useState('');
  const [newBatchEnd, setNewBatchEnd] = useState('');
  const [batchesLoading, setBatchesLoading] = useState(false);

  interface Batch {
    _id: string;
    name: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    intake: string;
  }

  const openBatchesModal = async (course: Course) => {
    setSelectedCourseForBatches(course);
    setBatchesModalOpen(true);
    setBatchesLoading(true);
    try {
      const res = await api.get(`/academic/courses/${course._id}/batches`);
      setBatchesList(res.data || []);
    } catch (err) {
      toast.error('Failed to load batches');
    } finally {
      setBatchesLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForBatches) return;
    setBatchesLoading(true);
    try {
      await api.post('/academic/batches', {
        name: newBatchName,
        academicYear: newBatchYear,
        startDate: newBatchStart,
        endDate: newBatchEnd,
        intake: newBatchIntake,
        courseId: selectedCourseForBatches._id,
      });
      toast.success('Batch created successfully!');
      setNewBatchName('');
      setNewBatchIntake('');
      setNewBatchStart('');
      setNewBatchEnd('');
      // Reload batches list
      const res = await api.get(`/academic/courses/${selectedCourseForBatches._id}/batches`);
      setBatchesList(res.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create batch');
    } finally {
      setBatchesLoading(false);
    }
  };

  // Course Form State
  const [courseData, setCourseData] = useState({
    code: '',
    name: '',
    description: '',
    durationMonths: 12,
    department: 'Computer Science',
    subjects: [] as string[],
  });

  // Subject Form State
  const [subjectData, setSubjectData] = useState({
    code: '',
    name: '',
    description: '',
    credits: 3,
    lecturerId: '',
    courseId: '',
    department: 'Computer Science',
  });

  const fetchData = async () => {
    try {
      const coursesRes = await api.get('/academic/courses');
      const subjectsRes = await api.get('/academic/subjects');
      const usersRes = await api.get('/notice/users/all');

      setCourses(coursesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setLecturers(usersRes.data?.filter((u: any) => u.role === 'lecturer') || []);
    } catch (err) {
      toast.error('Failed to load course details');
    }
  };

  useEffect(() => {
    fetchData();

    // Load drafts on mount
    const savedCourse = localStorage.getItem('draft_courseData');
    if (savedCourse) {
      try { setCourseData(JSON.parse(savedCourse)); } catch(e){}
    }
    const savedSubject = localStorage.getItem('draft_subjectData');
    if (savedSubject) {
      try { setSubjectData(JSON.parse(savedSubject)); } catch(e){}
    }
  }, []);

  // Save drafts when state changes
  useEffect(() => {
    if (courseData.code || courseData.name || courseData.subjects.length > 0) {
      localStorage.setItem('draft_courseData', JSON.stringify(courseData));
    }
  }, [courseData]);

  useEffect(() => {
    if (subjectData.code || subjectData.name || subjectData.lecturerId) {
      localStorage.setItem('draft_subjectData', JSON.stringify(subjectData));
    }
  }, [subjectData]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourseId) {
        await api.put(`/academic/courses/${editingCourseId}`, courseData);
        toast.success('Course updated successfully!');
        setEditingCourseId(null);
      } else {
        await api.post('/academic/courses', courseData);
        toast.success('Course created successfully!');
      }
      localStorage.removeItem('draft_courseData');
      setCourseData({
        code: '',
        name: '',
        description: '',
        durationMonths: 12,
        department: 'Computer Science',
        subjects: [],
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit course');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectData.lecturerId) {
      toast.error('Please assign a lecturer to the subject');
      return;
    }

    try {
      if (editingSubjectId) {
        await api.put(`/academic/subjects/${editingSubjectId}`, subjectData);
        toast.success('Subject updated successfully!');
        setEditingSubjectId(null);
      } else {
        await api.post('/academic/subjects', subjectData);
        toast.success('Subject registered successfully!');
      }
      localStorage.removeItem('draft_subjectData');
      setSubjectData({
        code: '',
        name: '',
        description: '',
        credits: 3,
        lecturerId: '',
        courseId: '',
        department: 'Computer Science',
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit subject');
    }
  };

  const startEditCourse = (course: Course) => {
    setEditingCourseId(course._id);
    setCourseData({
      code: course.code,
      name: course.name,
      description: '',
      durationMonths: 12,
      department: course.department,
      subjects: course.subjects.map((s) => s._id),
    });
  };

  const startEditSubject = (sub: any) => {
    setEditingSubjectId(sub._id);
    
    // Find the course that contains this subject
    const associatedCourse = courses.find((course) => 
      course.subjects?.some((s) => s._id === sub._id)
    );

    setSubjectData({
      code: sub.code,
      name: sub.name,
      description: sub.description || '',
      credits: sub.credits,
      lecturerId: sub.lecturerId?._id || sub.lecturerId || '',
      courseId: associatedCourse ? associatedCourse._id : '',
      department: sub.department || 'Computer Science',
    });
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/academic/courses/${courseId}`);
      toast.success('Course cleared successfully!');
      fetchData();
    } catch (err) {
      toast.error('Failed to clear course');
    }
  };

  const handleDeleteSubject = async (subId: string) => {
    if (!window.confirm('Are you sure you want to delete this subject topic?')) return;
    try {
      await api.delete(`/academic/subjects/${subId}`);
      toast.success('Subject cleared successfully!');
      fetchData();
    } catch (err) {
      toast.error('Failed to clear subject topic');
    }
  };

  return (
    <div className="space-y-8 text-slate-800">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Curriculum & Courses</h1>
        <p className="text-sm text-slate-500">Design syllabus paths, enroll subject topics, and link courses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Create / Edit Course */}
        <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-slate-900" />
              <h3 className="font-semibold text-slate-800 text-sm">
                {editingCourseId ? 'Edit Course Settings' : 'Create New Course'}
              </h3>
            </div>
            {editingCourseId && (
              <button
                onClick={() => {
                  setEditingCourseId(null);
                  setCourseData({ code: '', name: '', description: '', durationMonths: 12, department: 'Computer Science', subjects: [] });
                }}
                className="text-[10px] font-bold text-rose-500 flex items-center gap-1 hover:underline"
              >
                <X className="h-3 w-3" /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BSCS"
                  value={courseData.code}
                  onChange={(e) => setCourseData({ ...courseData, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Duration (Months)</label>
                <input
                  type="number"
                  required
                  value={courseData.durationMonths}
                  onChange={(e) => setCourseData({ ...courseData, durationMonths: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Course Name</label>
              <input
                type="text"
                required
                placeholder="e.g. BS in Computer Science"
                value={courseData.name}
                onChange={(e) => setCourseData({ ...courseData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
                <input
                  type="text"
                  required
                  value={courseData.department}
                  onChange={(e) => setCourseData({ ...courseData, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Select Subject Topics</label>
                <select
                  multiple
                  value={courseData.subjects}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, (option) => option.value);
                    setCourseData({ ...courseData, subjects: values });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-900 min-h-[70px]"
                >
                  {subjects.filter((sub) => !sub.department || sub.department.toLowerCase() === courseData.department.toLowerCase()).map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.code} - {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {editingCourseId ? 'Update Course Settings' : 'Build Course Syllabus'}
            </button>
          </form>
        </div>

        {/* Create / Edit Subject */}
        <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-slate-900" />
              <h3 className="font-semibold text-slate-800 text-sm">
                {editingSubjectId ? 'Edit Subject Details' : 'Create New Subject Topic'}
              </h3>
            </div>
            {editingSubjectId && (
              <button
                onClick={() => {
                  setEditingSubjectId(null);
                  setSubjectData({ code: '', name: '', description: '', credits: 3, lecturerId: '', courseId: '', department: 'Computer Science' });
                }}
                className="text-[10px] font-bold text-rose-500 flex items-center gap-1 hover:underline"
              >
                <X className="h-3 w-3" /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleCreateSubject} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS101"
                  value={subjectData.code}
                  onChange={(e) => setSubjectData({ ...subjectData, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Academic Credits</label>
                <input
                  type="number"
                  required
                  value={subjectData.credits}
                  onChange={(e) => setSubjectData({ ...subjectData, credits: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Subject Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Introduction to Programming"
                value={subjectData.name}
                onChange={(e) => setSubjectData({ ...subjectData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Department</label>
              <input
                type="text"
                required
                placeholder="e.g. Computer Science or Marine"
                value={subjectData.department}
                onChange={(e) => setSubjectData({ ...subjectData, department: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Assign Faculty Lecturer</label>
                <select
                  value={subjectData.lecturerId}
                  onChange={(e) => setSubjectData({ ...subjectData, lecturerId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-900"
                >
                  <option value="">-- Choose Lecturer --</option>
                  {lecturers.map((lec) => (
                    <option key={lec._id} value={lec._id}>
                      {lec.firstName} {lec.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Associate with Course (Optional)</label>
                <select
                  value={subjectData.courseId}
                  onChange={(e) => setSubjectData({ ...subjectData, courseId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-slate-900"
                  disabled={!!editingSubjectId}
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {editingSubjectId ? 'Update Subject Details' : 'Register Subject Topic'}
            </button>
          </form>
        </div>

      </div>

      {/* Courses Catalog Directory */}
      <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Curriculum Directory (Courses)</h3>
          </div>
          <button onClick={fetchData} className="text-slate-400 hover:text-slate-900 transition-all p-1">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 col-span-full text-center">No syllabus paths registered yet.</p>
          ) : (
            courses.map((course) => (
              <div key={course._id} className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-900 bg-slate-150 px-2 py-0.5 rounded-full border border-slate-200">
                        {course.code}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-2">{course.name}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">{course.department}</span>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Topic Subjects</span>
                    {course.subjects?.length === 0 ? (
                      <span className="text-xs text-slate-400">No linked topics</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {course.subjects?.map((sub) => (
                          <span key={sub._id} className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-650 px-2 py-0.5 rounded-md">
                            {sub.code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions (Email / Edit / Delete) */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-250/30">
                  <button
                    onClick={() => openBatchesModal(course)}
                    className="p-1.5 text-indigo-650 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Manage Batches"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => startEmailComposer(course)}
                    className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                    title="Send Email Announcement"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => startEditCourse(course)}
                    className="p-1.5 text-slate-700 hover:bg-slate-200/50 rounded-lg transition-all"
                    title="Edit Course"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete Course"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Subjects Directory List */}
      <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Subject Topics Directory</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 text-center">Credits</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-400">
                    No subjects registered.
                  </td>
                </tr>
              ) : (
                subjects.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900">{sub.code}</td>
                    <td className="px-4 py-3 font-semibold">{sub.name}</td>
                    <td className="px-4 py-3 text-center">{sub.credits}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => startEditSubject(sub)}
                          className="p-1 text-slate-700 hover:bg-slate-100 rounded"
                          title="Edit Subject Topic"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(sub._id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete Subject Topic"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Composer Modal */}
      {emailModalOpen && selectedCourseForEmail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <Mail className="h-5 w-5 text-sky-600" />
                <div>
                  <h3 className="font-bold text-sm">Course Announcement Email</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Broadcasting to {selectedCourseForEmail.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="text-slate-450 hover:text-slate-900 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                <input
                  type="text"
                  required
                  value={emailPayload.subject}
                  onChange={(e) => setEmailPayload({ ...emailPayload, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Message Body</label>
                <textarea
                  rows={5}
                  required
                  value={emailPayload.body}
                  onChange={(e) => setEmailPayload({ ...emailPayload, body: e.target.value })}
                  placeholder="Type your course notice or class announcement here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {sendingEmail ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batches Management Modal */}
      {batchesModalOpen && selectedCourseForBatches && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <Calendar className="h-5 w-5 text-indigo-650" />
                <div>
                  <h3 className="font-bold text-sm">Course Batches Management</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Course: {selectedCourseForBatches.name}</p>
                </div>
              </div>
              <button
                onClick={() => setBatchesModalOpen(false)}
                className="text-slate-450 hover:text-slate-900 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form to Add Batch */}
              <form onSubmit={handleCreateBatch} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <h4 className="text-xs font-bold text-slate-700">Add New Batch</h4>
                
                <div>
                  <label className="text-[9px] font-bold text-slate-450 uppercase block">Batch Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Batch 21.1"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-450 uppercase block">Intake</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. June"
                      value={newBatchIntake}
                      onChange={(e) => setNewBatchIntake(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-450 uppercase block">Academic Year</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026"
                      value={newBatchYear}
                      onChange={(e) => setNewBatchYear(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-450 uppercase block">Start Date</label>
                    <input
                      type="date"
                      required
                      value={newBatchStart}
                      onChange={(e) => setNewBatchStart(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-450 uppercase block">End Date</label>
                    <input
                      type="date"
                      required
                      value={newBatchEnd}
                      onChange={(e) => setNewBatchEnd(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={batchesLoading}
                  className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Create Batch
                </button>
              </form>

              {/* Batches List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700">Existing Batches</h4>
                {batchesList.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No batches created for this course yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {batchesList.map((b) => (
                      <div key={b._id} className="border border-slate-200 p-3 rounded-xl bg-white space-y-1 shadow-xs text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-800">{b.name}</span>
                          <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                            {b.intake} {b.academicYear}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-450">
                          Period: {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseManagement;
