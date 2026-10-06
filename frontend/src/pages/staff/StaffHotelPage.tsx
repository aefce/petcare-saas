import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import { GlassCard } from '../../components/ui/GlassCard';
import { HotelCheckInModal } from '../../components/ui/HotelCheckInModal';
import { HotelCheckOutModal } from '../../components/ui/HotelCheckOutModal';
import { HotelDailyLogCreateModal } from '../../components/ui/HotelDailyLogCreateModal';
import { HotelDailyLogViewerModal } from '../../components/ui/HotelDailyLogViewerModal';

export default function StaffHotelPage() {
  const { account } = useAuthStore();
  const dept = account?.department || '系統管理員';

  // Role booleans
  const isReceptionist = dept.includes('櫃檯');
  const isCaretaker = dept.includes('照護');
  const isAdmin = dept.includes('管理') || dept.includes('店長');

  // Data state
  const [hotelTasks, setHotelTasks] = useState<{ check_ins: any[], check_outs: any[], actives: any[] }>({ check_ins: [], check_outs: [], actives: [] });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [onlyMyAssigned, setOnlyMyAssigned] = useState(true);

  // Modal state
  const [hotelCheckInTarget, setHotelCheckInTarget] = useState<any>(null);
  const [hotelCheckInOpen, setHotelCheckInOpen] = useState(false);

  const [hotelCheckOutTarget, setHotelCheckOutTarget] = useState<any>(null);
  const [hotelCheckOutOpen, setHotelCheckOutOpen] = useState(false);

  const [hotelLogCreateTarget, setHotelLogCreateTarget] = useState<any>(null);
  const [hotelLogCreateOpen, setHotelLogCreateOpen] = useState(false);

  const [hotelLogViewerTarget, setHotelLogViewerTarget] = useState<any>(null);
  const [hotelLogViewerOpen, setHotelLogViewerOpen] = useState(false);

  useEffect(() => {
    fetchHotelTasks();
    fetchStaffList();
    fetchAllRooms();
  }, []);

  const fetchHotelTasks = async () => {
    try {
      const res = await apiClient.get('/api/hotel/tasks');
      setHotelTasks(res.data);
    } catch (error) {
      console.error("Failed to fetch hotel tasks", error);
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await apiClient.get('/api/auth/staff');
      setStaffList(res.data.filter((s: any) => s.is_active));
    } catch (e) {
      console.error("Failed to fetch staff list", e);
    }
  };

  const fetchAllRooms = async () => {
    try {
      const roomTypesRes = await apiClient.get('/api/hotel/rooms');
      const roomTypes = roomTypesRes.data;
      const roomsPromises = roomTypes.map((rt: any) =>
        apiClient.get(`/api/hotel/rooms/${rt.id}/physical`).then(res => 
          res.data.map((r: any) => ({ ...r, room_type_name: rt.name }))
        )
      );
      const results = await Promise.all(roomsPromises);
      setAllRooms(results.flat());
    } catch (e) {
      console.error("Failed to fetch all rooms", e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          🏨 寵物旅館管理
        </h1>
        <p className="text-stone-500 mt-1">今日房務、入退房與房態管理看板。</p>
      </div>

      {/* ========== Pet Hotel Front Desk Board (櫃檯/店長專屬前台看板) ========== */}
      {(isReceptionist || isAdmin) && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-stone-800 tracking-tight">
            今日房務與房態管理
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 今日預計入住 */}
            <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-orange-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="font-bold text-lg text-stone-800 flex justify-between items-center">
                今日預計入住 (CONFIRMED)
                <span className="bg-orange-100 text-orange-700 text-sm px-2 py-0.5 rounded-full">
                  {hotelTasks.check_ins.length}
                </span>
              </h3>
              {hotelTasks.check_ins.length === 0 ? (
                <p className="text-stone-500 text-sm py-4">今日無預計入住的寵物。</p>
              ) : (
                <div className="space-y-3">
                  {hotelTasks.check_ins.map((hb) => (
                    <div key={hb.id} className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-800">{hb.pet_name}</span>
                          <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded font-semibold">{hb.room_type_name}</span>
                        </div>
                        <p className="text-xs text-stone-400 mt-1">住宿區間: {hb.check_in_date} ~ {hb.check_out_date}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setHotelCheckInTarget(hb);
                          setHotelCheckInOpen(true);
                        }}
                        className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm active:scale-95 whitespace-nowrap"
                      >
                        辦理入住 Check-In
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* 今日預計退房 */}
            <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="font-bold text-lg text-stone-800 flex justify-between items-center">
                今日預計退房 (ACTIVE)
                <span className="bg-blue-100 text-blue-700 text-sm px-2 py-0.5 rounded-full">
                  {hotelTasks.check_outs.length}
                </span>
              </h3>
              {hotelTasks.check_outs.length === 0 ? (
                <p className="text-stone-500 text-sm py-4">今日無預計退房的寵物。</p>
              ) : (
                <div className="space-y-3">
                  {hotelTasks.check_outs.map((hb) => (
                    <div key={hb.id} className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-800">{hb.pet_name}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded font-semibold">{hb.room_type_name}</span>
                        </div>
                        <p className="text-xs text-stone-400 mt-1">住宿區間: {hb.check_in_date} ~ {hb.check_out_date}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setHotelCheckOutTarget(hb);
                          setHotelCheckOutOpen(true);
                        }}
                        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm active:scale-95 whitespace-nowrap"
                      >
                        辦理退房 Check-Out
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* 目前入住中名單 (actives) - 櫃檯管理版 */}
            <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-teal-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-2">
              <h3 className="font-bold text-lg text-stone-800 flex justify-between items-center">
                場內目前入住中 (ACTIVE) - 房客管理
                <span className="bg-teal-100 text-teal-700 text-sm px-2 py-0.5 rounded-full">
                  {hotelTasks.actives?.length || 0}
                </span>
              </h3>
              {(!hotelTasks.actives || hotelTasks.actives.length === 0) ? (
                <p className="text-stone-500 text-sm py-4">場內目前無入住中的寵物。</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotelTasks.actives.map((hb) => (
                    <div key={hb.id} className="bg-white p-4 rounded-2xl border border-teal-100 shadow-sm space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-800">{hb.pet_name}</span>
                            <span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-600 border border-teal-100 rounded font-semibold">{hb.room_type_name}</span>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            房號: {hb.assigned_room_number || '未分配'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-1">住宿區間: {hb.check_in_date} ~ {hb.check_out_date}</p>
                        <p className="text-xs text-stone-500 mt-1">
                          負責照護: <span className="font-semibold text-stone-700">{hb.assigned_staff_name || '未指派'}</span>
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t border-stone-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-stone-500 shrink-0">指派人員:</span>
                          <select
                            value={staffList.find(s => s.full_name === hb.assigned_staff_name)?.id || ''}
                            onChange={async (e) => {
                              try {
                                await apiClient.put(`/api/hotel/bookings/${hb.id}/assign`, null, {
                                  params: { staff_id: e.target.value }
                                });
                                alert('負責照護員指派成功！');
                                fetchHotelTasks();
                              } catch (err: any) {
                                alert(err.response?.data?.detail || '指派失敗');
                              }
                            }}
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
                          >
                            <option value="">-- 指派照護員 --</option>
                            {staffList.map(s => (
                              <option key={s.id} value={s.id}>{s.full_name} ({s.department || '無部門'})</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              setHotelLogViewerTarget(hb);
                              setHotelLogViewerOpen(true);
                            }}
                            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold py-2 rounded-xl transition border border-stone-200"
                          >
                            📋 查看歷史日誌
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* 實體房間狀態控制台 */}
            <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-purple-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-2">
              <h3 className="font-bold text-lg text-stone-800 flex justify-between items-center">
                🏨 實體房間狀態控制台
                <span className="bg-purple-100 text-purple-700 text-sm px-2 py-0.5 rounded-full">
                  {allRooms.length} 間房
                </span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {allRooms.map((room) => (
                  <div key={room.id} className="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-800 text-sm">{room.room_number}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' :
                          room.status === 'OCCUPIED' ? 'bg-amber-50 text-amber-700' :
                          room.status === 'CLEANING' ? 'bg-blue-50 text-blue-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {room.status === 'AVAILABLE' ? '空閒' :
                           room.status === 'OCCUPIED' ? '入住中' :
                           room.status === 'CLEANING' ? '清潔中' : '維修中'}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">{room.room_type_name}</p>
                    </div>
                    <div>
                      <select
                        value={room.status}
                        onChange={async (e) => {
                          try {
                            await apiClient.put(`/api/hotel/rooms/physical/${room.id}/status`, null, {
                              params: { status_str: e.target.value }
                            });
                            alert('房間狀態變更成功！');
                            fetchAllRooms();
                            fetchHotelTasks();
                          } catch (err: any) {
                            alert(err.response?.data?.detail || '狀態更新失敗');
                          }
                        }}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-700 focus:outline-none"
                      >
                        <option value="AVAILABLE">AVAILABLE (空閒)</option>
                        <option value="CLEANING">CLEANING (清潔)</option>
                        <option value="MAINTENANCE">MAINTENANCE (維修)</option>
                        <option value="OCCUPIED" disabled>OCCUPIED (入住)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

          </div>
        </div>
      )}

      {/* ========== Pet Hotel Caretaker Board (照護員/店長專屬工作板) ========== */}
      {(isCaretaker || isAdmin) && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-stone-800 tracking-tight flex items-center gap-2">
            <span>🧼 寵物照護與房務清潔工作板</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 我負責的房客照護 (ACTIVE) */}
            <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-teal-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-2">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h3 className="font-bold text-lg text-stone-800 flex justify-between items-center gap-2">
                  <span>📋 房客照護清單 (ACTIVE)</span>
                  <span className="bg-teal-100 text-teal-700 text-sm px-2 py-0.5 rounded-full">
                    {(hotelTasks.actives || []).filter(hb => !onlyMyAssigned || hb.assigned_staff_name === account?.name).length}
                  </span>
                </h3>
                <label className="flex items-center gap-2 text-xs text-stone-500 font-medium cursor-pointer bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg border border-stone-200 select-none transition">
                  <input
                    type="checkbox"
                    checked={onlyMyAssigned}
                    onChange={(e) => setOnlyMyAssigned(e.target.checked)}
                    className="rounded border-stone-300 text-teal-600 focus:ring-teal-400"
                  />
                  <span>只顯示指派給我的寵物</span>
                </label>
              </div>

              {(!hotelTasks.actives || hotelTasks.actives.length === 0) ? (
                <p className="text-stone-500 text-sm py-4">場內目前無入住中的寵物。</p>
              ) : (
                <>
                  {hotelTasks.actives.filter(hb => !onlyMyAssigned || hb.assigned_staff_name === account?.name).length === 0 ? (
                    <p className="text-stone-500 text-sm py-6 text-center bg-stone-50 rounded-2xl border border-stone-200 border-dashed">
                      {onlyMyAssigned ? '今日無指派給您的照護對象。' : '無符合條件的房客。'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hotelTasks.actives.filter(hb => !onlyMyAssigned || hb.assigned_staff_name === account?.name).map((hb) => (
                        <div key={hb.id} className="bg-white p-4 rounded-2xl border border-teal-100 shadow-sm space-y-3 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-800">{hb.pet_name}</span>
                                <span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-600 border border-teal-100 rounded font-semibold">{hb.room_type_name}</span>
                              </div>
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                房號: {hb.assigned_room_number || '未分配'}
                              </span>
                            </div>
                            <p className="text-xs text-stone-400 mt-1">住宿區間: {hb.check_in_date} ~ {hb.check_out_date}</p>
                            <p className="text-xs text-stone-500 mt-1">
                              負責照護: <span className="font-semibold text-stone-700">{hb.assigned_staff_name || '未指派'}</span>
                            </p>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-stone-100">
                            <button
                              onClick={() => {
                                setHotelLogCreateTarget(hb);
                                setHotelLogCreateOpen(true);
                              }}
                              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 rounded-xl transition shadow-sm"
                            >
                              📝 填寫今日日誌
                            </button>
                            <button
                              onClick={() => {
                                setHotelLogViewerTarget(hb);
                                setHotelLogViewerOpen(true);
                              }}
                              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold py-2 rounded-xl transition border border-stone-200"
                            >
                              📋 查看歷史日誌
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </GlassCard>

            {/* 客房清潔工作待辦 */}
            <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-teal-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-2">
              <h3 className="font-bold text-lg text-stone-800 flex justify-between items-center">
                🧼 客房清潔待辦清單
                <span className="bg-teal-100 text-teal-700 text-sm px-2 py-0.5 rounded-full">
                  {allRooms.filter(r => r.status === 'CLEANING').length} 間待清潔
                </span>
              </h3>
              {allRooms.filter(r => r.status === 'CLEANING').length === 0 ? (
                <p className="text-stone-500 text-sm py-4">目前所有房間皆已完成清潔！</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {allRooms.filter(r => r.status === 'CLEANING').map((room) => (
                    <div key={room.id} className="bg-white p-4 rounded-2xl border border-teal-100 shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-stone-800 text-sm">{room.room_number}</span>
                        <p className="text-[10px] text-stone-400 mt-0.5">{room.room_type_name}</p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await apiClient.put(`/api/hotel/rooms/physical/${room.id}/status`, null, {
                              params: { status_str: 'AVAILABLE' }
                            });
                            alert('清潔完成！該房間已重新開放登記。');
                            fetchAllRooms();
                            fetchHotelTasks();
                          } catch (err: any) {
                            alert(err.response?.data?.detail || '狀態更新失敗');
                          }
                        }}
                        className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
                      >
                        🧼 標記清潔完成
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

          </div>
        </div>
      )}

      {/* ===== Modals ===== */}
      {hotelCheckInTarget && (
        <HotelCheckInModal
          isOpen={hotelCheckInOpen}
          onClose={() => {
            setHotelCheckInOpen(false);
            setHotelCheckInTarget(null);
          }}
          bookingId={hotelCheckInTarget.id}
          petName={hotelCheckInTarget.pet_name}
          roomTypeId={hotelCheckInTarget.room_type_id || hotelCheckInTarget.room_type?.id}
          roomTypeName={hotelCheckInTarget.room_type_name}
          onSuccess={() => {
            alert('辦理入住成功！寵物已入住。');
            fetchHotelTasks();
          }}
        />
      )}

      {hotelCheckOutTarget && (
        <HotelCheckOutModal
          isOpen={hotelCheckOutOpen}
          onClose={() => {
            setHotelCheckOutOpen(false);
            setHotelCheckOutTarget(null);
          }}
          bookingId={hotelCheckOutTarget.id}
          petName={hotelCheckOutTarget.pet_name}
          roomTypeName={hotelCheckOutTarget.room_type_name}
          baseFee={hotelCheckOutTarget.total_fee}
          onSuccess={() => {
            alert('辦理退房結帳成功！');
            fetchHotelTasks();
          }}
        />
      )}

      {hotelLogCreateTarget && (
        <HotelDailyLogCreateModal
          isOpen={hotelLogCreateOpen}
          onClose={() => {
            setHotelLogCreateOpen(false);
            setHotelLogCreateTarget(null);
          }}
          bookingId={hotelLogCreateTarget.id}
          petName={hotelLogCreateTarget.pet_name}
          onSuccess={() => {
            alert('每日照護日誌提交成功！');
            fetchHotelTasks();
          }}
        />
      )}

      {hotelLogViewerTarget && (
        <HotelDailyLogViewerModal
          isOpen={hotelLogViewerOpen}
          onClose={() => {
            setHotelLogViewerOpen(false);
            setHotelLogViewerTarget(null);
          }}
          bookingId={hotelLogViewerTarget.id}
          petName={hotelLogViewerTarget.pet_name}
        />
      )}
    </div>
  );
}
