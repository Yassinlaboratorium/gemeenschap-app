export type RegistrationStatus = "pending" | "confirmed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export interface Profile {
  id: string;
  full_name: string;
  birth_date: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  max_participants: number | null;
  price: number;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface ActivityWithCount extends Activity {
  participants_count: number;
  sessions_count: number;
}

export interface ActivitySession {
  id: string;
  activity_id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  title: string | null;
  description: string | null;
  max_participants: number | null;
  price_cents: number;
  created_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  first_name: string;
  birth_date: string | null;
  created_at: string;
}

export interface SessionRegistration {
  id: string;
  activity_id: string;
  user_id: string;
  child_id: string;
  session_ids: string[];
  total_price_cents: number;
  mollie_payment_id: string | null;
  payment_status: PaymentStatus | null;
  paid_at: string | null;
  created_at: string;
}

export interface Registration {
  id: string;
  activity_id: string;
  user_id: string;
  status: RegistrationStatus;
  notes: string | null;
  created_at: string;
  mollie_payment_id: string | null;
  payment_status: PaymentStatus | null;
  paid_at: string | null;
}

export interface RegistrationWithActivity extends Registration {
  activities: Activity;
}
