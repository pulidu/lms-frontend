import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { GraduationCap, BookOpen, Plus, ClipboardList, RefreshCw } from 'lucide-react';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Subject {
  _id: string;
  code: string;
  name: string;
}

interface Exam {
  _id: string;
  title: string;
  totalMarks: number;
}

const MarksInput: React.FC = () => {
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
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Selected State
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  // Exam Creator State
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState('midterm');
  const [totalMarks, setTotalMarks] = useState(100);
  const [weightage, setWeightage] = useState(30);

  // Marks sheets state
  const [marksSheet, setMarksSheet] = useState<{ [studentId: string]: { marks: number; remarks: string } }>({});
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const coursesRes = await api.get('/academic/courses');
      setCourses(coursesRes.data || []);
    } catch (err) {
      toast.error('Failed to load courses');
    }
  };

  const fetchExams = async (subId: string) => {
    if (!subId) return;
    try {
      const res = await api.get(`/academic/exams/subject/${subId}`);
      setExams(res.data || []);
    } catch (err) {
      toast.error('Failed to load exam structures');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync batches and subjects when course changes
  useEffect(() => {
    if (selectedCourse) {
      const courseObj = courses.find((c) => c._id === selectedCourse);
      setSubjects(courseObj?.subjects || []);
      setSelectedSubject('');
      setSelectedExam('');
      
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
      setSelectedExam('');
    }
  }, [selectedCourse, courses]);

  // Load students and exams when course, batch, and subject are selected
  useEffect(() => {
    const fetchStudentsAndExams = async () => {
      if (!selectedCourse || !selectedBatch || !selectedSubject) {
        setStudents([]);
        setExams([]);
        setSelectedExam('');
        return;
      }
      try {
        const res = await api.get(`/academic/enrollments/course/${selectedCourse}/batch/${selectedBatch}`);
        setStudents(res.data?.enrolledStudents || []);
        fetchExams(selectedSubject);
      } catch (err) {
        toast.error('Failed to load enrolled students');
      }
    };
    fetchStudentsAndExams();
  }, [selectedCourse, selectedBatch, selectedSubject]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) {
      toast.error('Select a subject first');
      return;
    }

    try {
      await api.post('/academic/exams', {
        subjectId: selectedSubject,
        title: examTitle,
        type: examType,
        date: new Date(),
        totalMarks,
        weightage,
      });
      toast.success('Exam structure created successfully!');
      setExamTitle('');
      fetchExams(selectedSubject);
    } catch (err) {
      toast.error('Failed to create exam');
    }
  };

  const handleMarkChange = (studentId: string, value: string, field: 'marks' | 'remarks') => {
    setMarksSheet((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: field === 'marks' ? Number(value) : value,
      },
    }));
  };

  const handlePublishGrades = async () => {
    if (!selectedSubject || !selectedExam) {
      toast.error('Please select both Subject and Exam structure');
      return;
    }

    const unEvaluated = students.filter((s) => !marksSheet[s._id] || typeof marksSheet[s._id].marks !== 'number');
    if (unEvaluated.length > 0) {
      toast.error(`Please input marks for all students (${unEvaluated.length} left)`);
      return;
    }

    setLoading(true);
    try {
      for (const student of students) {
        await api.post('/academic/marks/publish', {
          studentId: student._id,
          examId: selectedExam,
          subjectId: selectedSubject,
          marksObtained: marksSheet[student._id].marks,
          remarks: marksSheet[student._id].remarks || 'Graded successfully',
        });
      }
      toast.success('Grades calculated and published successfully!');
    } catch (err) {
      toast.error('Failed to publish grades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Academic Grading Center</h1>
        <p className="text-sm text-slate-500">Create quiz/exam headers, evaluate class sheets, and post results.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Exam Creator Form */}
        <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="h-5 w-5 text-indigo-650" />
            <h3 className="font-semibold text-slate-800 text-sm">Add Exam Structure</h3>
          </div>

          <form onSubmit={handleCreateExam} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
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
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                disabled={!selectedCourse}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none disabled:bg-slate-100"
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
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedCourse}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none disabled:bg-slate-100"
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
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Exam Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Midterm 1"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Total Marks</label>
                <input
                  type="number"
                  required
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Weightage (%)</label>
                <input
                  type="number"
                  required
                  value={weightage}
                  onChange={(e) => setWeightage(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Build Exam Header
            </button>
          </form>
        </div>

        {/* Input Grades Table */}
        <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 lg:col-span-2 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-800 text-sm">Grading Worksheet</h3>
            <div className="flex gap-2">
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                disabled={!selectedSubject}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select Exam structure --</option>
                {exams.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.title} (Max: {ex.totalMarks})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 w-32">Marks Obtained</th>
                  <th className="px-4 py-3">Remarks / Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-400">
                      No students found. Please select a subject first.
                    </td>
                  </tr>
                ) : (
                  students.map((stud) => (
                    <tr key={stud._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-850">
                        {stud.firstName} {stud.lastName}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={marksSheet[stud._id]?.marks ?? ''}
                          onChange={(e) => handleMarkChange(stud._id, e.target.value, 'marks')}
                          className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Good effort"
                          value={marksSheet[stud._id]?.remarks ?? ''}
                          onChange={(e) => handleMarkChange(stud._id, e.target.value, 'remarks')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handlePublishGrades}
              disabled={loading || !selectedExam}
              className="bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <GraduationCap className="h-4 w-4" />
              Publish Exam Results
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MarksInput;
