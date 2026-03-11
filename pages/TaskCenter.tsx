
import React, { useState, useEffect } from 'react';
import { User, Wallet, Task } from '../types';
import { mockApi } from '../lib/mockApi';

const TaskCenter: React.FC<{ user: User; wallet: Wallet }> = ({ user, wallet }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await mockApi.db.getTasks();
        setTasks(data as any);
      } catch (e) {
        console.error("Task fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleSubmitProof = async (taskId: string) => {
    try {
      await mockApi.db.submitTask(user.id, taskId);
      alert("Proof submitted for verification!");
    } catch (e) {
      alert("Submission failed.");
    }
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
        ) : tasks.map((task) => (
          <div key={task.id} className="glass p-6 rounded-3xl flex flex-col justify-between hover:bg-slate-800/40 transition-all border-b-4 border-b-secondary/50">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-secondary/10 rounded-2xl text-secondary text-2xl">⚡</div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Reward</p>
                  <p className="text-xl font-black text-secondary">+${task.reward} USDT</p>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">{task.title}</h3>
              <p className="text-slate-400 text-sm mb-6">{task.description}</p>
            </div>
            
            <div className="flex gap-4">
              <a 
                href={task.link} 
                target="_blank" 
                rel="noreferrer" 
                className="flex-1 py-3 text-center bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
              >
                Go to Task
              </a>
              <button 
                onClick={() => handleSubmitProof(task.id)}
                className="flex-1 py-3 bg-secondary hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-secondary/20"
              >
                Submit Proof
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskCenter;
