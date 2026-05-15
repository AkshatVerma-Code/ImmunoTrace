import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useDemoMode } from '../context/DemoContext';
import { Header } from '../components/Header';
import {
  Bell,
  Calendar as CalendarIcon,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Pill,
} from 'lucide-react';
import { AddAppointmentModal, type AppointmentFormData } from '../components/AddAppointmentModal';
import { AddMedicineModal, type MedicineReminderFormData } from '../components/AddMedicineModal';

type AppointmentItem = {
  id: number;
  doctor_name: string;
  hospital_name: string;
  appointment_date: string;
  appointment_time: string;
  created_at: string;
};

type MedicineReminderItem = {
  id: number;
  medicine_name: string;
  when_to_take: string | null;
  start_date: string;
  end_date: string;
  times: string[];
  created_at: string;
};

type CalendarEvent = {
  type: 'appointment' | 'medicine';
  label: string;
  time?: string;
};

type UpcomingItem = {
  id: string;
  type: 'appointment' | 'medicine';
  title: string;
  subtitle: string;
  when: Date;
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NOTIFICATION_STORAGE_KEY = 'schedule-notified-events-v1';

function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) return null;
  return parsed;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function buildLocalDateTime(date: string, time: string): Date | null {
  if (!isValidTime(time)) return null;
  const datePart = parseDateInput(date);
  if (!datePart) return null;
  const [hours, minutes] = time.split(':').map(Number);
  const parsed = new Date(
    datePart.getFullYear(),
    datePart.getMonth(),
    datePart.getDate(),
    hours,
    minutes,
    0,
    0
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatClock(time24: string): string {
  if (!isValidTime(time24)) return time24;
  const [hours, minutes] = time24.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function clip(text: string, limit: number) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}

function parseJsonTimes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(isValidTime);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(isValidTime) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function isDateInRange(date: Date, startDate: string, endDate: string) {
  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  if (!start || !end) return false;
  const dateOnly = parseDateInput(toDateKey(date));
  if (!dateOnly) return false;
  return dateOnly >= start && dateOnly <= end;
}

function getUpcomingMedicineOccurrence(reminder: MedicineReminderItem, time: string, from: Date): Date | null {
  const start = parseDateInput(reminder.start_date);
  const end = parseDateInput(reminder.end_date);
  if (!start || !end) return null;

  let cursor = parseDateInput(toDateKey(from)) || from;
  if (cursor < start) cursor = start;

  while (cursor <= end) {
    const doseAt = buildLocalDateTime(toDateKey(cursor), time);
    if (doseAt && doseAt > from) return doseAt;
    cursor = addDays(cursor, 1);
  }

  return null;
}

function loadStoredNotificationKeys() {
  if (typeof window === 'undefined') return new Set<string>();
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.map((item) => String(item)));
  } catch {
    return new Set<string>();
  }
}

function saveNotificationKeys(set: Set<string>) {
  if (typeof window === 'undefined') return;
  const values = Array.from(set).slice(-1000);
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(values));
}

export function CalendarPage() {
  const { isDemoMode } = useDemoMode();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isMedicineOpen, setIsMedicineOpen] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [medicineReminders, setMedicineReminders] = useState<MedicineReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    'unsupported'
  );
  const notifiedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    notifiedKeysRef.current = loadStoredNotificationKeys();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [appointmentsRes, medicinesRes] = await Promise.all([
        fetch('/api/schedule/appointments', { cache: 'no-store' }),
        fetch('/api/schedule/medicines', { cache: 'no-store' }),
      ]);

      const appointmentsData = await appointmentsRes.json();
      const medicinesData = await medicinesRes.json();

      if (!appointmentsRes.ok) {
        throw new Error(appointmentsData?.message || 'Unable to load appointments.');
      }
      if (!medicinesRes.ok) {
        throw new Error(medicinesData?.message || 'Unable to load medicine reminders.');
      }

      const appointmentItems: AppointmentItem[] = Array.isArray(appointmentsData?.items)
        ? appointmentsData.items.map((item: any) => ({
            id: Number(item.id),
            doctor_name: String(item.doctor_name || ''),
            hospital_name: String(item.hospital_name || ''),
            appointment_date: String(item.appointment_date || ''),
            appointment_time: String(item.appointment_time || ''),
            created_at: String(item.created_at || ''),
          }))
        : [];

      const medicineItems: MedicineReminderItem[] = Array.isArray(medicinesData?.items)
        ? medicinesData.items.map((item: any) => ({
            id: Number(item.id),
            medicine_name: String(item.medicine_name || ''),
            when_to_take: item.when_to_take ? String(item.when_to_take) : null,
            start_date: String(item.start_date || ''),
            end_date: String(item.end_date || ''),
            times: parseJsonTimes(item.times),
            created_at: String(item.created_at || ''),
          }))
        : [];

      setAppointments(
        appointmentItems.filter((item) => item.id > 0 && Boolean(item.appointment_date && item.appointment_time))
      );
      setMedicineReminders(
        medicineItems.filter(
          (item) =>
            item.id > 0 &&
            Boolean(item.medicine_name && item.start_date && item.end_date && item.times.length > 0)
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to load schedule data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const requestNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  }, []);

  const handleAppointmentSave = useCallback(async (payload: AppointmentFormData) => {
    const res = await fetch('/api/schedule/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctor_name: payload.doctorName,
        hospital_name: payload.hospitalName,
        appointment_date: payload.date,
        appointment_time: payload.time,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to save appointment.');
    await loadSchedule();
  }, [loadSchedule]);

  const handleMedicineSave = useCallback(async (payload: MedicineReminderFormData) => {
    const res = await fetch('/api/schedule/medicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicine_name: payload.medicineName,
        when_to_take: payload.whenToTake || null,
        times: payload.times,
        start_date: payload.startDate,
        end_date: payload.endDate,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to save medicine reminder.');
    await loadSchedule();
  }, [loadSchedule]);

  const calendarEventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    appointments.forEach((appointment) => {
      const key = appointment.appointment_date;
      if (!key) return;
      const list = map.get(key) || [];
      list.push({
        type: 'appointment',
        label: clip(appointment.doctor_name, 20),
        time: formatClock(appointment.appointment_time),
      });
      map.set(key, list);
    });

    medicineReminders.forEach((reminder) => {
      const start = parseDateInput(reminder.start_date);
      const end = parseDateInput(reminder.end_date);
      if (!start || !end) return;

      let cursor = start > monthStart ? start : monthStart;
      const effectiveEnd = end < monthEnd ? end : monthEnd;
      while (cursor <= effectiveEnd) {
        const key = toDateKey(cursor);
        const list = map.get(key) || [];
        const preview = reminder.times.slice(0, 2).map((time) => formatClock(time)).join(', ');
        list.push({
          type: 'medicine',
          label: clip(reminder.medicine_name, 18),
          time: preview || undefined,
        });
        map.set(key, list);
        cursor = addDays(cursor, 1);
      }
    });

    return map;
  }, [appointments, currentMonth, medicineReminders]);

  const calendarCells = useMemo(() => {
    const firstWeekday = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const day = index - firstWeekday + 1;
      if (day < 1 || day > daysInMonth) {
        return { day: null as number | null, dateKey: '' };
      }
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return { day, dateKey: toDateKey(date) };
    });
  }, [currentMonth]);

  const upcomingItems = useMemo(() => {
    const now = new Date();
    const items: UpcomingItem[] = [];

    for (const appointment of appointments) {
      const when = buildLocalDateTime(appointment.appointment_date, appointment.appointment_time);
      if (!when || when < now) continue;
      items.push({
        id: `a-${appointment.id}`,
        type: 'appointment',
        title: appointment.doctor_name,
        subtitle: appointment.hospital_name,
        when,
      });
    }

    for (const reminder of medicineReminders) {
      for (const time of reminder.times) {
        const when = getUpcomingMedicineOccurrence(reminder, time, now);
        if (!when) continue;
        items.push({
          id: `m-${reminder.id}-${time}`,
          type: 'medicine',
          title: `${reminder.medicine_name}${reminder.when_to_take ? ` (${reminder.when_to_take})` : ''}`,
          subtitle: `Dose at ${formatClock(time)}`,
          when,
        });
      }
    }

    return items.sort((a, b) => a.when.getTime() - b.when.getTime()).slice(0, 10);
  }, [appointments, medicineReminders]);

  const runNotificationCheck = useCallback(() => {
    if (notificationPermission !== 'granted' || typeof window === 'undefined' || !('Notification' in window)) return;
    const now = new Date();
    const notified = notifiedKeysRef.current;

    const tryNotify = (key: string, title: string, body: string) => {
      if (notified.has(key)) return;
      notified.add(key);
      saveNotificationKeys(notified);
      new Notification(title, { body, icon: '/favicon.ico' });
    };

    appointments.forEach((appointment) => {
      const appointmentAt = buildLocalDateTime(appointment.appointment_date, appointment.appointment_time);
      if (!appointmentAt) return;
      const reminderAt = new Date(appointmentAt.getTime() - 60 * 60 * 1000);
      if (now >= reminderAt && now < appointmentAt) {
        const key = `appointment-${appointment.id}-${appointment.appointment_date}-${appointment.appointment_time}`;
        tryNotify(
          key,
          'Appointment reminder',
          `${appointment.doctor_name} at ${appointment.hospital_name} starts in about 1 hour.`
        );
      }
    });

    const today = parseDateInput(toDateKey(now)) || now;
    const dayOffsets = [-1, 0, 1];
    medicineReminders.forEach((reminder) => {
      dayOffsets.forEach((offset) => {
        const doseDay = addDays(today, offset);
        if (!isDateInRange(doseDay, reminder.start_date, reminder.end_date)) return;
        const doseDate = toDateKey(doseDay);

        reminder.times.forEach((time) => {
          const doseAt = buildLocalDateTime(doseDate, time);
          if (!doseAt) return;
          const reminderAt = new Date(doseAt.getTime() - 5 * 60 * 1000);
          if (now >= reminderAt && now < doseAt) {
            const key = `medicine-${reminder.id}-${doseDate}-${time}`;
            tryNotify(
              key,
              'Medicine reminder',
              `${reminder.medicine_name} dose at ${formatClock(time)} in about 5 minutes.`
            );
          }
        });
      });
    });
  }, [appointments, medicineReminders, notificationPermission]);

  useEffect(() => {
    runNotificationCheck();
    if (typeof window === 'undefined') return;
    const intervalId = window.setInterval(runNotificationCheck, 60_000);
    return () => window.clearInterval(intervalId);
  }, [runNotificationCheck]);

  const monthLabel = useMemo(
    () => currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [currentMonth]
  );
  const todayKey = toDateKey(new Date());

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28 relative">
      {isDemoMode ? (
        <div className="fixed inset-0 pointer-events-none z-0 border-8 border-[#2EC4B6]/20 transition-all duration-500" />
      ) : null}

      <Header />

      <main className="max-w-[1600px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
            <div>
              <h1 className="text-4xl font-heading font-extrabold text-slate-900 tracking-tighter mb-1">Schedule</h1>
              <p className="text-sm text-slate-500">
                Book doctor appointments and set medicine reminders with timely notifications.
              </p>
              {error ? (
                <p className="mt-2 text-xs text-red-600 rounded-lg bg-red-50 border border-red-100 px-2.5 py-1.5 inline-block">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' ? (
                <button
                  onClick={requestNotifications}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:border-[#2EC4B6]/50 text-slate-700 rounded-full text-sm font-medium shadow-sm transition-all flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Enable Notifications
                </button>
              ) : null}

              <div className="relative z-50">
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="px-6 py-3 bg-[#0F3D3E] hover:bg-[#1A595A] text-white rounded-full text-sm font-medium shadow-lg shadow-[#0F3D3E]/20 transition-all flex items-center gap-2"
                >
                  + New Event
                </button>

                {isDropdownOpen ? (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => {
                            setIsAppointmentOpen(true);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-[#EAF7F6] hover:text-[#0F3D3E] rounded-xl transition-colors"
                        >
                          <div className="p-1.5 bg-[#2EC4B6]/10 text-[#2EC4B6] rounded-lg">
                            <CalendarPlus className="w-4 h-4" />
                          </div>
                          <span className="font-medium">Add Appointment</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsMedicineOpen(true);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-xl transition-colors"
                        >
                          <div className="p-1.5 bg-amber-100 text-amber-500 rounded-lg">
                            <Pill className="w-4 h-4" />
                          </div>
                          <span className="font-medium">Add Medicine</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 bg-white/80 backdrop-blur-2xl rounded-[48px] rounded-tl-2xl rounded-br-2xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white overflow-hidden p-6 md:p-8 relative group">
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.02] group-hover:opacity-[0.04] transition-opacity"
                preserveAspectRatio="none"
              >
                <path d="M0,50 Q100,100 200,0 T400,50" fill="none" stroke="#2EC4B6" strokeWidth="4" />
              </svg>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-2xl font-heading font-bold text-slate-800 tracking-tight">{monthLabel}</h2>
                <div className="flex items-center gap-2 bg-slate-50/50 rounded-full p-1 border border-slate-100">
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                      )
                    }
                    className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                      )
                    }
                    className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-4 relative z-10">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 auto-rows-fr gap-2 md:gap-3 relative z-10">
                {calendarCells.map((cell, index) => {
                  if (!cell.day || !cell.dateKey) {
                    return <div key={`empty-${index}`} className="min-h-[100px] md:min-h-[130px] opacity-0" />;
                  }

                  const dayEvents = (calendarEventsByDate.get(cell.dateKey) || []).slice(0, 3);
                  const hiddenEvents = (calendarEventsByDate.get(cell.dateKey) || []).length - dayEvents.length;
                  const isToday = cell.dateKey === todayKey;

                  return (
                    <div
                      key={cell.dateKey}
                      className={`min-h-[100px] md:min-h-[130px] rounded-2xl p-2 md:p-3 transition-all ${
                        isToday
                          ? 'bg-blue-50/50 border border-blue-100'
                          : 'bg-slate-50/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100'
                      }`}
                    >
                      <div
                        className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full mb-2 ${
                          isToday ? 'bg-[#2EC4B6] text-white shadow-md shadow-[#2EC4B6]/30' : 'text-slate-700'
                        }`}
                      >
                        {cell.day}
                      </div>

                      <div className="space-y-1.5">
                        {dayEvents.map((event, eventIndex) => (
                          <div
                            key={`${cell.dateKey}-${eventIndex}`}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-medium truncate ${
                              event.type === 'appointment' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                            }`}
                            title={event.time ? `${event.time} - ${event.label}` : event.label}
                          >
                            {event.time ? <span className="mr-1 opacity-70">{event.time}</span> : null}
                            {event.label}
                          </div>
                        ))}
                        {hiddenEvents > 0 ? (
                          <div className="text-[10px] text-slate-500 font-medium">+{hiddenEvents} more</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-6 md:p-8">
                <h3 className="text-lg font-medium text-slate-800 mb-6 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#2EC4B6]" /> Upcoming
                </h3>

                {loading ? (
                  <p className="text-sm text-slate-500">Loading schedule...</p>
                ) : upcomingItems.length === 0 ? (
                  <p className="text-sm text-slate-500">No upcoming reminders yet. Add your first event.</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] group hover:border-[#2EC4B6]/30 transition-all"
                      >
                        <h4 className="text-sm font-medium text-slate-800 mb-1">{item.title}</h4>
                        <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                          {item.type === 'appointment' ? (
                            <>
                              <MapPin className="w-3.5 h-3.5" /> {item.subtitle}
                            </>
                          ) : (
                            <>
                              <Pill className="w-3.5 h-3.5" /> {item.subtitle}
                            </>
                          )}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F7F6] rounded-lg text-[11px] font-medium text-[#0F3D3E]">
                          <Clock className="w-3.5 h-3.5" />
                          {item.when.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <AddAppointmentModal
        isOpen={isAppointmentOpen}
        onClose={() => setIsAppointmentOpen(false)}
        onSave={handleAppointmentSave}
      />
      <AddMedicineModal isOpen={isMedicineOpen} onClose={() => setIsMedicineOpen(false)} onSave={handleMedicineSave} />
    </div>
  );
}

export const SchedulePage = CalendarPage;
