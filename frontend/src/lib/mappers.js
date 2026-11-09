// Conversión entre los nombres de la API (snake_case) y los de la interfaz.
export const fromApiTask = (task) => ({ id: task.id, title: task.title, date: task.due_date, time: task.time, category: task.category, priority: task.priority, done: task.completed, notes: task.notes || "", subject_id: task.subject_id ?? "" });
export const toApiTask = (task) => ({ title: task.title, due_date: task.date, time: task.time, category: task.category || null, priority: task.priority || null, notes: task.notes || null, subject_id: task.subject_id ? Number(task.subject_id) : null, ...(task.repeat_days ? { repeat_days: task.repeat_days } : {}) });
export const fromApiHabit = (habit) => ({ id: habit.id, name: habit.name, target: habit.target, unit: habit.unit, count: habit.count, progress: habit.progress, streak: habit.streak, createdAt: habit.created_at });
export const fromApiHabitOverview = (item) => ({ date: item.log_date, completed: item.completed, total: item.total });
export const fromApiTransaction = (tx) => ({ id: tx.id, description: tx.description, amount: tx.amount, kind: tx.kind, category: tx.category, method: tx.method, createdAt: tx.created_at });
export const fromApiSaving = (saving) => ({ id: saving.id, name: saving.name, start: saving.start_amount, current: saving.current_amount, gain: saving.gain });
export const toApiSaving = (saving) => ({ name: saving.name, start_amount: saving.start });
export const fromApiSavingMovement = (movement) => ({ id: movement.id, amount: movement.amount, date: movement.movement_date });
export const fromApiEvent = (event) => ({ id: event.id, title: event.title, date: event.event_date, time: event.time, type: event.type, color: event.color, done: event.done, important: event.important });
export const toApiEvent = (event) => ({ title: event.title, event_date: event.date, time: event.time, type: event.type || null, color: event.color, important: event.important || false, ...(event.repeat_days ? { repeat_days: event.repeat_days } : {}) });
export const fromApiSettings = (settings) => ({ repetitions: settings.repetitions, work: settings.work, breakTime: settings.break_time });
export const toApiSettings = (settings) => ({ repetitions: settings.repetitions, work: settings.work, break_time: settings.breakTime });
export const fromApiEntry = (entry) => ({ id: entry.id, date: entry.entry_date, from: entry.from_time, to: entry.to_time, hours: entry.hours === null ? "" : entry.hours, extra: entry.extra, holiday: entry.holiday });
export const toApiEntry = (form) => ({ entry_date: form.date, from_time: form.from, to_time: form.to, hours: form.hours === "" || form.hours === undefined ? null : Number(form.hours), extra: form.extra, holiday: form.holiday });
export const fromApiPayment = (payment) => ({ id: payment.id, amount: payment.amount, method: payment.method, date: payment.payment_date });
export const fromApiClosedPeriod = (period) => ({ id: period.id, start: period.start, end: period.end, totalHours: period.total_hours, expected: period.expected, paid: period.paid, balance: period.balance });
