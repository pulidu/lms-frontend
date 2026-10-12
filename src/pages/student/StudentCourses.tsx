import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Calendar,
  Upload,
  RefreshCw,
  MessageSquare,
  Users,
  ArrowLeft,
  Send,
  User,
  GraduationCap
} from 'lucide-react';

interface Subject {
  _id: string;
  code: string;
  name: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
}

interface UserRoster {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
}

const StudentCourses: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [people, setPeople] = useState<UserRoster[]>([]);
  const [activeTab, setActiveTab] = useState<'stream' | 'classwork' | 'people'>('stream');

  // Stream announcements
  const [announcements, setAnnouncements] = useState<{ id: string; author: string; text: string; date: string }[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');

  // Submission Form State
  const [submissionText, setSubmissionText] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/academic/subjects');
      setSubjects(res.data || []);
    } catch (err) {
      toast.error('Failed to load subjects');
    }
  };

  const fetchAssignments = async (subId: string) => {
    try {
      const res = await api.get(`/assignments/assignments/subject/${subId}`);
      setAssignments(res.data || []);
    } catch (err) {
      toast.error('Failed to load assignments');
    }
  };

  const fetchPeopleAndStream = async () => {
    try {
      const res = await api.get('/notice/users/all');
      setPeople(res.data || []);
    } catch (err) {
      toast.error('Failed to load class members roster');
    }

    // Initialize Stream notices
    setAnnouncements([
      {
        id: '1',
        author: 'Dr. John Doe',
        text: `Welcome to the class! Please review the syllabus and check the first assignment in Classwork.`,
        date: new Date().toLocaleDateString(),
      }
    ]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchAssignments(selectedSubject._id);
      fetchPeopleAndStream();
      setActiveTab('stream');
    }
  }, [selectedSubject]);

  const handleSubmitAssignment = async (e: React.FormEvent, assignmentId: string) => {
    e.preventDefault();
    if (!submissionText.trim() && !attachmentFile) {
      toast.error('Please add submission comments or upload a file');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('submissionText', submissionText);
    if (attachmentFile) {
      formData.append('attachment', attachmentFile);
    }

    try {
      await api.post('/assignments/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Assignment submitted successfully!');
      setSubmissionText('');
      setAttachmentFile(null);
    } catch (err) {
      toast.error('Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;

    setAnnouncements([
      {
        id: Date.now().toString(),
        author: 'Me (Student)',
        text: newAnnouncement,
        date: new Date().toLocaleDateString(),
      },
      ...announcements,
    ]);
    setNewAnnouncement('');
    toast.success('Comment posted to Stream!');
  };

  // List of course header colors matching Google Classroom theme
  const getBannerColor = (index: number) => {
    const banners = [
      'from-teal-655 to-cyan-700',
      'from-indigo-650 to-blue-700',
      'from-violet-600 to-fuchsia-700',
      'from-slate-700 to-slate-900',
    ];
    return banners[index % banners.length];
  };

  if (!selectedSubject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Classes</h1>
          <p className="text-xs text-slate-500 mt-1">Select a class module card to enter the stream workspace.</p>
        </div>

        {/* Course Card Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub, idx) => (
            <div
              key={sub._id}
              onClick={() => setSelectedSubject(sub)}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-72 group"
            >
              {/* Colored Banner Header */}
              <div className={`h-28 bg-gradient-to-r ${getBannerColor(idx)} p-5 text-white flex flex-col justify-between`}>
                <div>
                  <h3 className="font-bold text-base group-hover:underline line-clamp-1">{sub.name}</h3>
                  <p className="text-[10px] opacity-80 font-bold uppercase tracking-wider mt-0.5">{sub.code}</p>
                </div>
                <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full w-fit">
                  Active Term
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase border border-slate-200">
                    {sub.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Assigned Faculty</h4>
                    <p className="text-[10px] text-slate-400 font-medium">LMS Instructor</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button className="text-xs font-semibold text-slate-900 hover:text-black transition-all">
                    View Course
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Course workspace view with Stream, Classwork, and People Tabs
  return (
    <div className="space-y-6">
      
      {/* Course workspace top sub-header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedSubject(null)}
          className="p-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-slate-900 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">{selectedSubject.name}</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{selectedSubject.code}</p>
        </div>
      </div>

      {/* Tabs Header Selection */}
      <div className="flex justify-center border-b border-slate-200 bg-white rounded-xl shadow-sm px-4">
        <div className="flex gap-8 text-xs font-semibold text-slate-500">
          <button
            onClick={() => setActiveTab('stream')}
            className={`py-4 border-b-2 px-1 transition-all ${
              activeTab === 'stream' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-800'
            }`}
          >
            Stream
          </button>
          <button
            onClick={() => setActiveTab('classwork')}
            className={`py-4 border-b-2 px-1 transition-all ${
              activeTab === 'classwork' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-800'
            }`}
          >
            Classwork
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`py-4 border-b-2 px-1 transition-all ${
              activeTab === 'people' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent hover:text-slate-800'
            }`}
          >
            People
          </button>
        </div>
      </div>

      {/* Viewport for active tab content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Stream Workspace */}
        {activeTab === 'stream' && (
          <>
            {/* Stream Left Column: Work Due Summary */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs space-y-3">
                <h4 className="font-bold text-slate-800">Upcoming</h4>
                <p className="text-slate-500 leading-relaxed">Woohoo, no work due soon!</p>
                {assignments.length > 0 && (
                  <button
                    onClick={() => setActiveTab('classwork')}
                    className="text-slate-900 hover:underline font-bold block pt-1"
                  >
                    View all tasks
                  </button>
                )}
              </div>
            </div>

            {/* Stream Main Column: Announcement Banner & Feed */}
            <div className="lg:col-span-3 space-y-5">
              
              {/* Big Classroom Banner Card */}
              <div className="h-32 bg-gradient-to-r from-slate-900 to-slate-850 rounded-xl p-6 text-white flex flex-col justify-end shadow-sm">
                <h3 className="font-bold text-lg">{selectedSubject.name}</h3>
                <p className="text-xs opacity-75 font-semibold mt-1">Section 101 • Term Room</p>
              </div>

              {/* Make Announcement post block */}
              <form onSubmit={handlePostAnnouncement} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-3 items-start">
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  S
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={2}
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    placeholder="Announce something to your class..."
                    className="w-full text-xs bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:border-slate-850"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                    >
                      <Send className="h-3 w-3" />
                      Post
                    </button>
                  </div>
                </div>
              </form>

              {/* Roster of Announcements */}
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-800">
                          {ann.author.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{ann.author}</h4>
                          <span className="text-[9px] text-slate-400 font-medium">{ann.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-11">{ann.text}</p>
                  </div>
                ))}
              </div>

            </div>
          </>
        )}

        {/* Classwork Workspace */}
        {activeTab === 'classwork' && (
          <div className="lg:col-span-4 space-y-6">
            {assignments.length === 0 ? (
              <p className="text-sm text-slate-400 py-12 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
                No assignments published for this subject.
              </p>
            ) : (
              <div className="space-y-4">
                {assignments.map((asg) => (
                  <div key={asg._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Assignment Task
                        </span>
                        <h4 className="font-bold text-slate-850 text-sm mt-1">{asg.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1">{asg.description}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-450 uppercase whitespace-nowrap">
                        Max Marks: {asg.maxMarks}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                      <Calendar className="h-3.5 w-3.5" />
                      Due Date: {new Date(asg.dueDate).toLocaleDateString()}
                    </div>

                    {/* Submission Upload Container */}
                    <form onSubmit={(e) => handleSubmitAssignment(e, asg._id)} className="space-y-3 pt-4 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-800 uppercase block">My Submission</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Submission notes or URL link..."
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-slate-800"
                        />
                        <input
                          type="file"
                          onChange={(e) => setAttachmentFile(e.target.files ? e.target.files[0] : null)}
                          className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border file:border-slate-200 file:text-xs file:font-semibold file:bg-slate-50 file:text-slate-800 hover:file:bg-slate-100 cursor-pointer"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {submitting ? 'Uploading...' : 'Submit Work'}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* People Workspace */}
        {activeTab === 'people' && (
          <div className="lg:col-span-4 space-y-6">
            
            {/* Teacher section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Teachers</h3>
              <div className="divide-y divide-slate-100">
                {people
                  .filter((p) => p.role === 'staff' || p.role === 'lecturer' || p.role === 'admin')
                  .map((t) => (
                    <div key={t._id} className="py-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-850">
                        {t.firstName} {t.lastName} ({t.role.toUpperCase()})
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Students section */}
            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-800">Classmates</h3>
                <span className="text-xs text-slate-400 font-semibold">
                  {people.filter((p) => p.role === 'student').length} students
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {people
                  .filter((p) => p.role === 'student')
                  .map((s) => (
                    <div key={s._id} className="py-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-150">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800">
                        {s.firstName} {s.lastName}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default StudentCourses;
