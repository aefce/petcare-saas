import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../api/client';
import { GlassCard } from '../../components/ui/GlassCard';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type?: string;
}

export default function StaffNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/execution/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.put(`/api/execution/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await apiClient.put('/api/execution/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (e) {
      console.error('Failed to mark all as read', e);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'booking': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'refund': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'hotel': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'system': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'booking': return '預約';
      case 'refund': return '退費';
      case 'hotel': return '旅館';
      case 'system': return '系統';
      default: return '通知';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-stone-600" />
            通知中心
          </h1>
          <p className="text-stone-500 mt-1">
            共 {notifications.length} 則通知，{unreadCount} 則未讀。
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter Tabs */}
          <div className="flex bg-stone-100 rounded-xl p-1 border border-stone-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'all'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'unread'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              未讀 {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Mark All as Read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 text-white text-xs font-bold rounded-xl hover:bg-stone-700 transition shadow-sm disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              全部標為已讀
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
          <span className="ml-3 text-stone-500">載入中...</span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <GlassCard className="!p-12 text-center">
          <Bell className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 text-lg font-medium">
            {filter === 'unread' ? '沒有未讀的通知' : '目前沒有通知'}
          </p>
          <p className="text-stone-400 text-sm mt-1">
            {filter === 'unread' ? '所有通知都已閱讀！' : '新通知將會顯示在這裡。'}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredNotifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <GlassCard
                  className={`!p-5 !rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
                    !notif.is_read
                      ? '!bg-blue-50/60 !border-blue-200/60 shadow-sm'
                      : '!bg-white/40 hover:!bg-white/60'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Unread indicator */}
                    <div className="pt-1.5 shrink-0">
                      {!notif.is_read ? (
                        <span className="block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                      ) : (
                        <span className="block w-2.5 h-2.5 rounded-full bg-stone-200" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getTypeColor(notif.type)}`}>
                          {getTypeLabel(notif.type)}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {new Date(notif.created_at).toLocaleString('zh-TW', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className={`text-sm font-semibold truncate ${
                        !notif.is_read ? 'text-stone-800' : 'text-stone-600'
                      }`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* Mark as Read Button */}
                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold rounded-lg transition border border-stone-200"
                      title="標為已讀"
                    >
                      <Check className="w-3.5 h-3.5" />
                      已讀
                    </button>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
