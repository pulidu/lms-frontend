import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { GraduationCap, Award, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Mark {
  _id: string;
  subjectId: {
    code: string;
    name: string;
  };
  examId: {
    title: string;
    type: string;
    totalMarks: number;
  };
  marksObtained: number;
  grade: string;
  remarks?: string;
}

const StudentMarks: React.FC = () => {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMarks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic/marks/my');
      setMarks(res.data || []);
    } catch (err) {
      toast.error('Failed to load grade transcripts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Grade Transcript</h1>
        <p className="text-sm text-slate-500">Review your final subject grades and academic evaluator comments.</p>
      </div>

      {/* Transcript Card Grid */}
      <div className="glass-card rounded-2xl p-6 border border-slate-100/60 bg-white space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-850 text-sm">Official Evaluations</h3>
          </div>
          <button onClick={fetchMarks} className="text-slate-400 hover:text-sky-600 transition-all">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Exam / Header</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3 text-center">Grade</th>
                <th className="px-4 py-3">Remarks / Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {marks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400">
                    No grades published.
                  </td>
                </tr>
              ) : (
                marks.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className="block font-bold text-sky-905 uppercase">{m.subjectId?.code}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{m.subjectId?.name}</span>
                    </td>
                    <td className="px-4 py-3">{m.examId?.title}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {m.marksObtained} / {m.examId?.totalMarks || 100}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ['A+', 'A', 'B'].includes(m.grade)
                            ? 'bg-emerald-50 text-emerald-700'
                            : m.grade === 'C'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {m.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 italic font-normal">{m.remarks || 'No remarks recorded.'}</td>
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

export default StudentMarks;
