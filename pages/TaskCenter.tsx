
import React, { useState, useEffect } from 'react';
import { User, Wallet, Task } from '../types';
import { mockApi } from '../lib/mockApi';

const TaskCenter: React.FC<{ user: User; wallet: Wallet }> = ({ user, wallet }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [proofs, setProofs] = useState<Record<string, string>>({});

  const fetchData = async () => {
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

  const handleSubmitProof = async (taskId: string) => {
    const proof = proofs[taskId];
    if (!proof || proof.trim().length < 3) {
      alert("Please provide a valid proof (Username or Link)");
      return;
    }

    try {
      await mockApi.db.submitTask(user.id, taskId, proof);
      alert("Proof submitted for verification!");
      setProofs(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      fetchData();
    } catch (e) {
      alert("Submission failed.");
    }
  };

  const getTaskStatus = (taskId: string) => {
    const sub = submissions.find(s => s.task_id === taskId);
    return sub ? sub.status : 'available';
  };

  return (
    <div className="space-y-8 animate-in zoom-in duration-500">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">Loading Mission Briefings...</div>
        ) : tasks.length === 0 ? (
          <div className="col-span-full py-20 text-center font-black uppercase tracking-[0.5em] text-slate-500">No Active Missions Available</div>
        ) : tasks.map((task) => {
          const status = getTaskStatus(task.id);
          return (
            <div key={task.id} className={`glass p-6 rounded-3xl flex flex-col justify-between hover:bg-slate-800/40 transition-all border-b-4 ${
              status === 'approved' ? 'border-b-green-500' : 
              status === 'pending' ? 'border-b-amber-500' : 
              'border-b-secondary/50'
            }`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl text-2xl ${
                    status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                    status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 
                    'bg-secondary/10 text-secondary'
                  }`}>
                    {status === 'approved' ? '✓' : status === 'pending' ? '⏳' : '⚡'}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Reward</p>
                    <p className={`text-xl font-black ${status === 'approved' ? 'text-green-500' : 'text-secondary'}`}>+${task.reward} USDT</p>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{task.title}</h3>
                <p className="text-slate-400 text-sm mb-6">{task.description}</p>
              </div>
              
              <div className="flex flex-col gap-4">
                {status === 'available' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Proof (Username / Link)</label>
                      <input 
                        type="text" 
                        placeholder="Enter your proof here..."
                        value={proofs[task.id] || ''}
                        onChange={(e) => setProofs(prev => ({ ...prev, [task.id]: e.target.value }))}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2 px-4 text-xs outline-none focus:border-secondary transition-colors"
                      />
                    </div>
                    <div className="flex gap-4">
                      <a 
                        href={task.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex-1 py-3 text-center bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm"
                      >
                        Go to Task
                      </a>
                      <button 
                        onClick={() => handleSubmitProof(task.id)}
                        className="flex-1 py-3 bg-secondary hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-secondary/20 text-sm"
                      >
                        Submit Proof
                      </button>
                    </div>
                  </>
                ) : (
                  <div className={`w-full py-3 text-center font-black uppercase tracking-widest rounded-xl ${
                    status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                    'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {status === 'approved' ? 'Mission Completed' : 'Verification Pending'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskCenter;
