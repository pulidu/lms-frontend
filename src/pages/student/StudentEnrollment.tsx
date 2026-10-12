import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { BookOpen, CheckCircle, ChevronRight, GraduationCap, RefreshCw, Bookmark } from 'lucide-react';

interface Subject {
  _id: string;
  code: string;
  name: string;
  credits: number;
}

interface Course {
  _id: string;
  code: string;
  name: string;
  description: string;
  durationMonths: number;
  department: string;
  subjects: Subject[];
}

interface Enrollment {
  _id: string;
  courseId: {
    _id: string;
    code: string;
    name: string;
  } | string;
  status: string;
}

const StudentEnrollment: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const coursesRes = await api.get('/academic/courses');
      setCourses(coursesRes.data || []);

      const enrollmentsRes = await api.get(`/academic/enrollments/${user.id}`);
      setEnrollments(enrollmentsRes.data || []);
    } catch (err) {
      toast.error('Failed to load courses or enrollment status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleEnroll = async (courseId: string) => {
    if (!user?.id) return;
    setEnrollLoading(courseId);
    try {
      await api.post('/academic/enrollments', {
        studentId: user.id,
        courseId,
      });
      toast.success('Successfully enrolled in the course!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrollLoading(null);
    }
  };

  const getEnrollmentStatus = (courseId: string) => {
    const found = enrollments.find((e: any) => {
      const cid = typeof e.courseId === 'object' ? e.courseId?._id : e.courseId;
      return cid === courseId;
    });
    return found ? found.status : null;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Academic Course Enrollment</h1>
        <p className="text-sm text-slate-500">Explore available programs, view module structures, and register for courses.</p>
      </div>

      {loading && courses.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-650" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const status = getEnrollmentStatus(course._id);
            const isEnrolled = !!status;

            return (
              <div
                key={course._id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200"
              >
                {/* Header Info */}
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {course.department}
                      </span>
                      <h3 className="font-bold text-slate-850 text-base leading-tight">
                        {course.name}
                      </h3>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase">
                        Code: {course.code} • Duration: {course.durationMonths} Months
                      </p>
                    </div>

                    {isEnrolled ? (
                      <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle className="h-3 w-3" />
                        {status}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <Bookmark className="h-3 w-3" />
                        Available
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {course.description || 'No description provided for this academic program.'}
                  </p>

                  {/* Subject details count */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-450 uppercase block mb-2">
                      Syllabus Topics ({course.subjects?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {course.subjects?.map((sub) => (
                        <span
                          key={sub._id}
                          className="bg-slate-50 border border-slate-200/60 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] font-medium"
                        >
                          {sub.code}: {sub.name}
                        </span>
                      ))}
                      {(!course.subjects || course.subjects.length === 0) && (
                        <span className="text-[10px] text-slate-400 italic">No topics assigned yet.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                  {isEnrolled ? (
                    <button
                      disabled
                      className="bg-slate-200 text-slate-450 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1"
                    >
                      Already Joined
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course._id)}
                      disabled={enrollLoading === course._id}
                      className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1 cursor-pointer disabled:bg-slate-350"
                    >
                      {enrollLoading === course._id ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          Enroll in Course
                          <ChevronRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentEnrollment;
