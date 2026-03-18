
import React, { useState, useEffect } from 'react';
import { User, Wallet, Task } from '../types';
import { mockApi } from '../lib/mockApi';

const TaskCenter: React.FC<{ user: User; wallet: Wallet }> = ({ user, wallet }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [proofs, setProofs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const fetchData = async () => {
<<<<<<< HEAD
    if (!user?.id) return;
=======
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
    try {
      const [taskData, subData] = await Promise.all([
        mockApi.db.getTasks(),
        mockApi.db.getTaskSubmissions(user.id)
      ]);
      setTasks(taskData as any);
      setSubmissions(subData as any);
    } catch (e) {
      console.error("Task fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

<<<<<<< HEAD
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

=======
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
  const handleSubmitProof = async (taskId: string) => {
    const proof = proofs[taskId];
    if (!proof || proof.trim().length < 3) {
      showStatus("Please provide a valid proof (Username or Link)", "error");
      return;
    }

<<<<<<< HEAD
    setSubmitting(prev => ({ ...prev, [taskId]: true }));
=======
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
    try {
      await mockApi.db.submitTask(user.id, taskId, proof);
      showStatus("Proof submitted for verification!");
      setProofs(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      fetchData();
<<<<<<< HEAD
    } catch (e: any) {
      console.error("Task submission error:", e);
      showStatus(e.message || "Submission failed.", "error");
    } finally {
      setSubmitting(prev => ({ ...prev, [taskId]: false }));
=======
    } catch (e) {
      showStatus("Submission failed.", "error");
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
    }
  };

  const getTaskStatus = (taskId: string) => {
    const sub = submissions.find(s => s.task_id === taskId);
    return sub ? sub.status : 'available';
  };

  return (
    <div className="space-y-8 animate-in zoom-in duration-500">
      {statusMsg && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl animate-in fade-in slide-in-from-right-4 ${
          statusMsg.type === 'success' ? 'bg-secondary text-white' : 'bg-red-500 text-white'
        }`}>
          {statusMsg.text}
        </div>
      )}
      <div className="relative overflow-hidden p-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl border border-indigo-500/30">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-black mb-2 italic">TASK TO EARN</h2>
            <p className="text-indigo-200 max-w-md">Complete daily social and growth challenges to boost your wallet balance and activate new tiers.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center min-w-[200px]">
            <p className="text-sm text-indigo-300 mb-1">Total Tasks Claimed</p>
            <p className="text-3xl font-black text-white">$45.50</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
            activeTab === 'available' 
              ? 'bg-secondary text-white shadow-lg shadow-secondary/20 scale-[1.02]' 
              : 'bg-white/5 text-slate-500 hover:bg-white/10'
          }`}
        >
          Active Missions
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
            activeTab === 'history' 
              ? 'bg-secondary text-white shadow-lg shadow-secondary/20 scale-[1.02]' 
              : 'bg-white/5 text-slate-500 hover:bg-white/10'
          }`}
        >
          Mission History
        </button>
      </div>

      {activeTab === 'available' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">Loading Mission Briefings...</div>
          ) : tasks.filter(t => getTaskStatus(t.id) === 'available').length === 0 ? (
            <div className="col-span-full py-20 text-center font-black uppercase tracking-[0.5em] text-slate-500">No New Missions Available</div>
          ) : tasks.filter(t => getTaskStatus(t.id) === 'available').map((task) => {
            const status = getTaskStatus(task.id);
            return (
              <div key={task.id} className="glass p-6 rounded-3xl flex flex-col justify-between hover:bg-slate-800/40 transition-all border-b-4 border-b-secondary/50">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl text-2xl bg-secondary/10 text-secondary">
                      ⚡
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Reward</p>
                      <p className="text-xl font-black text-secondary">+${task.reward} USDT</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{task.title}</h3>
                  <p className="text-slate-400 text-sm mb-6">{task.description}</p>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-slate-900/80 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Step 1: Complete Action</label>
                      <a 
                        href={task.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[10px] font-black text-white bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-colors"
                      >
                        Open Link
                      </a>
                    </div>
                    <div className="h-[1px] bg-white/5 w-full"></div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Step 2: Submit Proof (Username/Link)</label>
                      <input 
                        type="text" 
                        placeholder="Username or Screenshot Link (e.g. imgur.com/abc)"
                        value={proofs[task.id] || ''}
                        onChange={(e) => setProofs(prev => ({ ...prev, [task.id]: e.target.value }))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs outline-none focus:border-secondary transition-colors text-white"
                      />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleSubmitProof(task.id)}
<<<<<<< HEAD
                    disabled={submitting[task.id]}
                    className="w-full py-4 bg-secondary hover:bg-purple-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-secondary/20 uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting[task.id] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Mission Proof'
                    )}
=======
                    className="w-full py-4 bg-secondary hover:bg-purple-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-secondary/20 uppercase tracking-widest text-xs"
                  >
                    Submit Mission Proof
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="py-20 text-center font-black uppercase tracking-[0.5em] text-slate-500">No Mission History Found</div>
          ) : (
            submissions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(sub => {
              const task = tasks.find(t => t.id === sub.task_id);
              return (
                <div key={sub.id} className="glass p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 border-white/5">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`p-3 rounded-2xl text-xl ${
                      sub.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                      sub.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 
<<<<<<< HEAD
                      'bg-primary/10 text-primary'
=======
                      'bg-amber-500/10 text-amber-500'
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
                    }`}>
                      {sub.status === 'approved' ? '✓' : sub.status === 'rejected' ? '✕' : '⏳'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{task?.title || 'Unknown Task'}</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Submitted: {new Date(sub.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full md:w-auto px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Proof Provided:</p>
                    <p className="text-xs text-slate-300 truncate">{sub.proof}</p>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <p className={`text-sm font-black uppercase tracking-widest ${
                      sub.status === 'approved' ? 'text-green-500' : 
                      sub.status === 'rejected' ? 'text-red-500' : 
<<<<<<< HEAD
                      'text-primary'
=======
                      'text-amber-500'
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
                    }`}>
                      {sub.status}
                    </p>
                    {sub.status === 'approved' && (
                      <p className="text-[10px] text-slate-500 font-bold">+${task?.reward} USDT</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCenter;
