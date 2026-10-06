import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, UserPlus, Shield, ToggleLeft, ToggleRight, CalendarDays, Users, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import apiClient from '../../api/client';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StaffManagementModal({ isOpen, onClose }: StaffManagementModalProps) {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: '',
    password: '',
    full_name: '',
    department: '首席美容師',
  });
  
  const [activeTab, setActiveTab] = useState<'LIST' | 'SCHEDULE' | 'CLOCK_RECORDS'>('LIST');
  const [shifts, setShifts] = useState<any[]>([]);
  const [clockRecords, setClockRecords] = useState<any[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  // Department / Identity change states
  const [editingDeptStaffId, setEditingDeptStaffId] = useState<string | null>(null);
  const [targetDept, setTargetDept] = useState<string>('');
  const [managerInstruction, setManagerInstruction] = useState<string>('');
  const [isUpdatingDept, setIsUpdatingDept] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStaff();
      fetchShifts();
      if (activeTab === 'CLOCK_RECORDS') fetchClockRecords();
    }
  }, [isOpen, activeTab]);

  const fetchClockRecords = async () => {
    try {
      const res = await apiClient.get('/api/auth/clock/records');
      setClockRecords(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await apiClient.get('/api/auth/shifts');
      setShifts(res.data);
    } catch (error) {
      console.error("Failed to fetch shifts", error);
    }
  };

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/api/auth/staff');
      setStaffList(res.data);
    } catch (error) {
      console.error("Failed to fetch staff", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDept = async (staffId: string) => {
    if (!managerInstruction.trim()) {
      alert("請輸入店長的更動指令備註！");
      return;
    }
    try {
      setIsUpdatingDept(true);
      await apiClient.put(`/api/auth/staff/${staffId}/department`, {
        department: targetDept,
        manager_instruction: managerInstruction
      });
      setEditingDeptStaffId(null);
      setManagerInstruction('');
      fetchStaff();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "身分更動失敗");
    } finally {
      setIsUpdatingDept(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await apiClient.put(`/api/auth/staff/${id}/toggle`);
      fetchStaff();
    } catch (error) {
      console.error(error);
      alert("狀態切換失敗");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAdding(true);
      
      let role = 'STAFF';
      if (newStaff.department === '系統管理員' || newStaff.department === '店長') {
        role = 'ADMIN';
      }

      await apiClient.post('/api/auth/staff', { ...newStaff, role });
      setNewStaff({ email: '', password: '', full_name: '', department: '首席美容師' });
      fetchStaff();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.detail || "新增失敗");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAssignShift = async (staffId: string, date: Date, type: string) => {
    try {
      const isoDate = date.toISOString().split('T')[0];
      await apiClient.post('/api/auth/shifts', {
        staff_id: staffId,
        shift_date: isoDate,
        shift_type: type
      });
      fetchShifts();
    } catch (error) {
      console.error(error);
      alert("排班失敗");
    }
  };

  const getDaysInWeek = (startDate: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const shiftLabels: Record<string, { label: string, color: string }> = {
    MORNING: { label: '早班', color: 'bg-amber-100 text-amber-700' },
    AFTERNOON: { label: '晚班', color: 'bg-indigo-100 text-indigo-700' },
    FULL_DAY: { label: '全天', color: 'bg-rose-100 text-rose-700' }
  };

  const renderSchedule = () => {
    const days = getDaysInWeek(currentWeekStart);
    
    return (
      <div className="flex-1 space-y-4 overflow-x-auto pb-4">
        <div className="flex justify-between items-center bg-stone-50 p-2 rounded-xl border border-stone-200">
          <button 
            onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d); }}
            className="p-2 hover:bg-stone-200 rounded-lg text-stone-600"
          ><ChevronLeft size={20}/></button>
          <span className="font-bold text-stone-700">
            {days[0].toLocaleDateString('zh-TW')} - {days[6].toLocaleDateString('zh-TW')}
          </span>
          <button 
            onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d); }}
            className="p-2 hover:bg-stone-200 rounded-lg text-stone-600"
          ><ChevronRight size={20}/></button>
        </div>

        <div className="min-w-[800px] border border-stone-200 rounded-2xl overflow-hidden bg-white">
          <div className="grid grid-cols-8 bg-stone-50 border-b border-stone-200 text-sm font-bold text-stone-600">
            <div className="p-4 border-r border-stone-200 text-center">員工</div>
            {days.map(d => (
              <div key={d.toISOString()} className="p-4 text-center">
                {d.toLocaleDateString('zh-TW', { weekday: 'short' })}<br/>
                <span className="text-xs font-normal">{d.getMonth()+1}/{d.getDate()}</span>
              </div>
            ))}
          </div>

          {staffList.filter(s => s.is_active).map(staff => (
            <div key={staff.id} className="grid grid-cols-8 border-b border-stone-100 last:border-0 hover:bg-stone-50">
              <div className="p-4 border-r border-stone-200 flex items-center justify-center font-bold text-stone-800 text-sm">
                {staff.full_name}
              </div>
              {days.map(d => {
                const dateStr = d.toISOString().split('T')[0];
                const shift = shifts.find(s => s.staff_id === staff.id && s.shift_date.startsWith(dateStr));
                
                return (
                  <div key={d.toISOString()} className="p-2 border-r border-stone-50 last:border-0 flex items-center justify-center">
                    <select
                      value={shift ? shift.shift_type : 'OFF'}
                      onChange={(e) => handleAssignShift(staff.id, d, e.target.value)}
                      className={`w-full h-full p-2 text-xs font-bold rounded-lg cursor-pointer outline-none transition-colors ${
                        shift && shiftLabels[shift.shift_type] 
                          ? shiftLabels[shift.shift_type].color 
                          : 'bg-transparent text-stone-400 hover:bg-stone-100'
                      }`}
                    >
                      <option value="OFF">休</option>
                      <option value="MORNING">早班</option>
                      <option value="AFTERNOON">晚班</option>
                      <option value="FULL_DAY">全天</option>
                    </select>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderClockRecords = () => (
    <div className="flex-1 space-y-4 overflow-x-auto pb-4">
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
            <tr>
              <th className="p-4 font-bold">員工姓名</th>
              <th className="p-4 font-bold">日期</th>
              <th className="p-4 font-bold">上班時間</th>
              <th className="p-4 font-bold">下班時間</th>
              <th className="p-4 font-bold">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {clockRecords.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-stone-400">尚無打卡紀錄</td></tr>
            ) : clockRecords.map(record => {
              const inTime = new Date(record.clock_in_time);
              const outTime = record.clock_out_time ? new Date(record.clock_out_time) : null;
              
              return (
                <tr key={record.id} className="hover:bg-stone-50">
                  <td className="p-4 font-bold text-stone-800">{record.staff_name}</td>
                  <td className="p-4 text-stone-600">{inTime.toLocaleDateString('zh-TW')}</td>
                  <td className="p-4 text-emerald-600 font-medium">{inTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit'})}</td>
                  <td className="p-4 text-rose-600 font-medium">{outTime ? outTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit'}) : '--:--'}</td>
                  <td className="p-4">
                    {outTime ? (
                      <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold">已下班</span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold animate-pulse">上班中</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 z-50 shadow-2xl flex flex-col md:flex-row gap-8"
          >
            {/* Left: Content Area */}
            <div className="flex-1 space-y-6 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center pb-4 border-b border-stone-100 overflow-x-auto">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab('LIST')}
                    className={`text-xl font-bold flex items-center gap-2 pb-2 border-b-2 transition-colors ${activeTab === 'LIST' ? 'border-teal-600 text-teal-600' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                  >
                    <Users className="w-6 h-6" /> 帳號管理
                  </button>
                  <button 
                    onClick={() => setActiveTab('SCHEDULE')}
                    className={`text-xl font-bold flex items-center gap-2 pb-2 border-b-2 transition-colors ${activeTab === 'SCHEDULE' ? 'border-teal-600 text-teal-600' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                  >
                    <CalendarDays className="w-6 h-6" /> 排班日曆
                  </button>
                  <button 
                    onClick={() => setActiveTab('CLOCK_RECORDS')}
                    className={`text-xl font-bold flex items-center gap-2 pb-2 border-b-2 transition-colors ${activeTab === 'CLOCK_RECORDS' ? 'border-teal-600 text-teal-600' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                  >
                    <Clock className="w-6 h-6" /> 出勤紀錄
                  </button>
                </div>
                <button onClick={onClose} className="md:hidden p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                </div>
              ) : activeTab === 'LIST' ? (
                <div className="space-y-4 overflow-y-auto pr-2">
                  {staffList.map((staff) => (
                    <div key={staff.id} className={`flex flex-col p-4 rounded-2xl border transition-all ${staff.is_active ? 'bg-white border-stone-200 shadow-sm' : 'bg-stone-50 border-stone-100 opacity-60'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-stone-800">{staff.full_name}</h3>
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-medium">{staff.department}</span>
                          </div>
                          <p className="text-sm text-stone-500 mt-1">{staff.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setEditingDeptStaffId(staff.id);
                              setTargetDept(staff.department);
                              setManagerInstruction('');
                            }}
                            className="px-3 py-1.5 bg-stone-150 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            更動身分
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(staff.id)}
                            className={`p-2 rounded-xl transition-colors ${staff.is_active ? 'text-teal-600 hover:bg-teal-50' : 'text-stone-400 hover:bg-stone-200'}`}
                            title={staff.is_active ? "停權此帳號" : "啟用此帳號"}
                          >
                            {staff.is_active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                          </button>
                        </div>
                      </div>

                      {editingDeptStaffId === staff.id && (
                        <div className="mt-4 pt-4 border-t border-stone-100 space-y-3 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                          <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                            ⚠️ 注意：人員身份（職位部門）更動必須依據店長下達之指令進行。
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-stone-600 mb-1">選擇新職位身分</label>
                              <select 
                                value={targetDept} 
                                onChange={e => setTargetDept(e.target.value)} 
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                              >
                                <option value="首席美容師">美容師</option>
                                <option value="資深照護員">照護員</option>
                                <option value="親切櫃檯員">櫃檯人員</option>
                                <option value="店長">店長</option>
                                <option value="系統管理員">系統管理員</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-stone-600 mb-1">店長指令/要求備註 (必填)</label>
                              <input 
                                required
                                type="text"
                                value={managerInstruction}
                                onChange={e => setManagerInstruction(e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="例如: 經店長王小明 06/05 指示調動"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-1">
                            <button 
                              type="button" 
                              onClick={() => setEditingDeptStaffId(null)} 
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-100"
                            >
                              取消
                            </button>
                            <button 
                              disabled={isUpdatingDept}
                              onClick={() => handleUpdateDept(staff.id)} 
                              className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 disabled:opacity-50"
                            >
                              {isUpdatingDept ? '儲存中...' : '確認更動身分'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : activeTab === 'SCHEDULE' ? (
                renderSchedule()
              ) : (
                renderClockRecords()
              )}
            </div>

            {/* Right: Add Staff Form (Only show on LIST tab for simplicity) */}
            {activeTab === 'LIST' && (
              <div className="w-full md:w-80 bg-stone-50 p-6 rounded-3xl border border-stone-100 h-fit">
              <h3 className="font-bold text-stone-800 mb-6 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                新增員工
              </h3>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-600">員工姓名</label>
                  <input required type="text" value={newStaff.full_name} onChange={e => setNewStaff({...newStaff, full_name: e.target.value})} className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="王大明" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-600">登入信箱</label>
                  <input required type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="staff@petcare.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-600">設定密碼 (至少8碼)</label>
                  <input required minLength={8} type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-stone-600">職位部門</label>
                  <select value={newStaff.department} onChange={e => setNewStaff({...newStaff, department: e.target.value})} className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="首席美容師">美容師</option>
                    <option value="資深照護員">照護員</option>
                    <option value="親切櫃檯員">櫃檯人員</option>
                    <option value="系統管理員">店長/管理員</option>
                  </select>
                </div>
                <button disabled={isAdding} type="submit" className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70">
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : '建立帳號'}
                </button>
              </form>
            </div>
            )}
            
            {/* Desktop close button */}
            <button onClick={onClose} className="hidden md:block absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
