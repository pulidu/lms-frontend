import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { FileText, Plus, CheckSquare, Download, Calendar, RefreshCw } from 'lucide-react';

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

interface Assignment {
  _id: string;
  title: string;
  dueDate: string;
  maxMarks: number;
}

interface Submission {
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  submissionDate: string;
  submissionText: string;
  attachment?: {
    fileName: string;
  };
  marksObtained?: number;
  feedback?: string;
  status: string;
}

const AssignmentManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Form State: Post Assignment
  const [postCourse, setPostCourse] = useState('');
  const [postBatches, setPostBatches] = useState<Batch[]>([]);
  const [postBatch, setPostBatch] = useState('');
  const [postSubjects, setPostSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(''); // form target subject

  // View State: Submissions
  const [viewCourse, setViewCourse] = useState('');
  const [viewBatches, setViewBatches] = useState<Batch[]>([]);
  const [viewBatch, setViewBatch] = useState('');
  const [viewSubjects, setViewSubjects] = useState<Subject[]>([]);
  const [selectedSubjectView, setSelectedSubjectView] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');

  // Assignment Creator Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Grading State
  const [gradingSubmissionId, setGradingSubmissionId] = useState('');
  const [marksObtained, setMarksObtained] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetchData = async () => {
    try {
      const res = await api.get('/academic/courses');
      setCourses(res.data || []);
    } catch (err) {
      toast.error('Failed to load courses');
    }
  };

  const fetchAssignments = async (subId: string) => {
    if (!subId) return;
    try {
      const res = await api.get(`/assignments/assignments/subject/${subId}`);
      setAssignments(res.data || []);
    } catch (err) {
      toast.error('Failed to load assignments');
    }
  };

  const fetchSubmissions = async (asgId: string) => {
    if (!asgId) return;
    try {
      const res = await api.get(`/assignments/submissions/assignment/${asgId}`);
      setSubmissions(res.data || []);
    } catch (err) {
      toast.error('Failed to load student submissions');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Post form course sync
  useEffect(() => {
    if (postCourse) {
      const courseObj = courses.find((c) => c._id === postCourse);
      setPostSubjects(courseObj?.subjects || []);
      setSelectedSubject('');
      
      const fetchPostBatches = async () => {
        try {
          const res = await api.get(`/academic/courses/${postCourse}/batches`);
          setPostBatches(res.data || []);
          setPostBatch('');
        } catch (err) {
          toast.error('Failed to load batches');
        }
      };
      fetchPostBatches();
    } else {
      setPostSubjects([]);
      setPostBatches([]);
      setSelectedSubject('');
      setPostBatch('');
    }
  }, [postCourse, courses]);

  // View course sync
  useEffect(() => {
    if (viewCourse) {
      const courseObj = courses.find((c) => c._id === viewCourse);
      setViewSubjects(courseObj?.subjects || []);
      setSelectedSubjectView('');
      
      const fetchViewBatches = async () => {
        try {
          const res = await api.get(`/academic/courses/${viewCourse}/batches`);
          setViewBatches(res.data || []);
          setViewBatch('');
        } catch (err) {
          toast.error('Failed to load batches');
        }
      };
      fetchViewBatches();
    } else {
      setViewSubjects([]);
      setViewBatches([]);
      setSelectedSubjectView('');
      setViewBatch('');
    }
  }, [viewCourse, courses]);

  useEffect(() => {
    if (selectedSubjectView) {
      fetchAssignments(selectedSubjectView);
    } else {
      setAssignments([]);
    }
  }, [selectedSubjectView]);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions(selectedAssignment);
    } else {
      setSubmissions([]);
    }
  }, [selectedAssignment]);

  const handlePostAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) {
      toast.error('Choose a subject first');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('subjectId', selectedSubject);
    formData.append('dueDate', dueDate);
    formData.append('maxMarks', maxMarks.toString());
    if (attachmentFile) {
      formData.append('attachment', attachmentFile);
    }

    try {
      await api.post('/assignments/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Assignment posted successfully!');
      setTitle('');
      setDescription('');
      setDueDate('');
      setAttachmentFile(null);
      if (selectedSubjectView === selectedSubject) {
        fetchAssignments(selectedSubject);
      }
    } catch (err) {
      toast.error('Failed to post assignment');
    }
  };

  const handleDownloadAttachment = async (submissionId: string, fileName: string) => {
    try {
      toast.loading('Downloading file...', { id: 'file' });
      const response = await api.get(`/assignments/submissions/download/${submissionId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Downloaded!', { id: 'file' });
    } catch (err) {
      toast.error('Failed to download file attachment', { id: 'file' });
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/assignments/submissions/grade/${gradingSubmissionId}`, {
        marksObtained,
        grade: Number(marksObtained) >= 50 ? 'Pass' : 'Fail',
        feedback,
      });
      toast.success('Grading submitted successfully!');
      setGradingSubmissionId('');
      setMarksObtained('');
      setFeedback('');
      fetchSubmissions(selectedAssignment);
    } catch (err) {
      toast.error('Failed to grade submission');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Assignment manager</h1>
        <p className="text-sm text-slate-500">Publish task projects, upload instructions, and evaluate student files.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Assignment Form */}
        <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="h-5 w-5 text-indigo-650" />
            <h3 className="font-semibold text-slate-800 text-sm">Post Assignment</h3>
          </div>

          <form onSubmit={handlePostAssignment} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Course</label>
              <select
                value={postCourse}
                onChange={(e) => setPostCourse(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
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
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Batch</label>
              <select
                value={postBatch}
                onChange={(e) => setPostBatch(e.target.value)}
                disabled={!postCourse}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none disabled:bg-slate-100"
              >
                <option value="">-- Choose Batch --</option>
                {postBatches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.intake} {b.academicYear})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!postBatch}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none disabled:bg-slate-100"
              >
                <option value="">-- Choose Subject --</option>
                {postSubjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Assignment Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Laboratory Report 2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Description & Instructions</label>
              <textarea
                required
                placeholder="Detailed instructions for student upload..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Max Marks</label>
                <input
                  type="number"
                  required
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Instructions PDF File</label>
              <input
                type="file"
                onChange={(e) => setAttachmentFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedSubject}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black disabled:bg-slate-350 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Publish Assignment
            </button>
          </form>
        </div>

        {/* Submissions list and grader */}
        <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 lg:col-span-2 shadow-sm h-fit">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-800 text-sm">Student Submissions</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select
                value={viewCourse}
                onChange={(e) => setViewCourse(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.code}
                  </option>
                ))}
              </select>

              <select
                value={viewBatch}
                onChange={(e) => setViewBatch(e.target.value)}
                disabled={!viewCourse}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none disabled:bg-slate-100"
              >
                <option value="">-- Choose Batch --</option>
                {viewBatches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSubjectView}
                onChange={(e) => setSelectedSubjectView(e.target.value)}
                disabled={!viewBatch}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none disabled:bg-slate-100"
              >
                <option value="">-- Choose Subject --</option>
                {viewSubjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                disabled={!selectedSubjectView}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none disabled:bg-slate-100"
              >
                <option value="">-- Choose Assignment --</option>
                {assignments.map((asg) => (
                  <option key={asg._id} value={asg._id}>
                    {asg.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Submission Details</th>
                  <th className="px-4 py-3 text-center">Attachment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      Select subject and assignment to load student submissions.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-850">
                          {sub.studentId?.firstName} {sub.studentId?.lastName}
                        </span>
                      </td>
                      <td className="px-4 py-3 truncate max-w-[150px]">{sub.submissionText}</td>
                      <td className="px-4 py-3 text-center">
                        {sub.attachment ? (
                          <button
                            onClick={() => handleDownloadAttachment(sub._id, sub.attachment!.fileName)}
                            className="p-1.5 text-sky-650 hover:bg-sky-50 rounded cursor-pointer"
                            title="Download student upload"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'graded'
                              ? 'bg-emerald-50 text-emerald-700'
                              : sub.status === 'late'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-sky-50 text-sky-700'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setGradingSubmissionId(sub._id);
                            setMarksObtained(sub.marksObtained?.toString() || '');
                            setFeedback(sub.feedback || '');
                          }}
                          className="text-xs bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-650 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all font-semibold cursor-pointer"
                        >
                          Grade
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Grading Drawer/Form */}
          {gradingSubmissionId && (
            <div className="p-4 border border-sky-100 bg-sky-50/20 rounded-2xl space-y-3 mt-4">
              <h4 className="font-bold text-xs text-sky-850">Grade Student Submission</h4>
              <form onSubmit={handleGradeSubmission} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Marks</label>
                  <input
                    type="number"
                    required
                    value={marksObtained}
                    onChange={(e) => setMarksObtained(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Feedback</label>
                  <input
                    type="text"
                    placeholder="Nice structure"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-black text-white py-2 rounded-lg text-xs font-semibold transition-all h-[36px] cursor-pointer"
                >
                  Post Evaluation
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AssignmentManager;
