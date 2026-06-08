export type AppointmentStatus = 'pending' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  tenantId: number;
  phoneNumber: string | null;
  customerName: string | null;
  service: string | null;
  datetime: string | null;
  address: string | null;
  status: AppointmentStatus;
  createdAt: string;
  googleEventId: string | null;
  origin: string;
  notes: string | null;
  customerEmail: string | null;
}
