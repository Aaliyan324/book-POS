'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, Clock, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { markNotificationReadAction } from '@/app/actions/notifications';

interface NotificationsViewProps {
  notifications: any[];
}

export function NotificationsView({ notifications: initialNotifications }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationReadAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'UNPAID_PAYMENT':
        return <Clock className="w-5 h-5 text-rose-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">System Alerts & Notifications</h2>
          <p className="text-xs text-stone-500">
            Real-time notifications for stock thresholds, credit due reminders, and operational alerts.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden divide-y divide-stone-100">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            <Bell className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p>No system notifications at this time.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                !n.isRead ? 'bg-orange-50/30 font-medium' : 'hover:bg-stone-50/60'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-stone-100 shrink-0 mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-stone-900">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-stone-400 mt-1 font-mono">
                    {formatDateTime(n.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.link && (
                  <Link
                    href={n.link}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 text-xs"
                    title="Mark as Read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
