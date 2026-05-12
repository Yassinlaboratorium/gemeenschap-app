export type ActivityType = "workshop" | "uitstap" | "evenement";
export type RegistrationStatus = "pending" | "confirmed" | "cancelled";

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
  type: ActivityType;
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
}

export interface Registration {
  id: string;
  activity_id: string;
  user_id: string;
  status: RegistrationStatus;
  notes: string | null;
  created_at: string;
}

export interface RegistrationWithActivity extends Registration {
  activities: Activity;
}
