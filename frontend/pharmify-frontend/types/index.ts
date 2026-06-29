export interface User {
  id: number;
  username: string;
  email: string;
  role: 'customer' | 'owner' | 'admin';
  phone: string;
}

export interface Pharmacy {
  id: number;
  name: string;
  location: string;
  is_verified: boolean;
  owner: User;
  license_document_url: string | null;
  created_at: string;
}

export interface Medicine {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string | null;
  stock: number;
  average_rating: number;
  reviews_count: number;
  pharmacy: number;
  pharmacy_name?: string;
  pharmacy_location?: string;
  owner_phone?: string;
  distance_km?: number | null;
  match_percentage?: number | null;
  created_at: string;
}

export interface Review {
  id: number;
  user: number;
  medicine: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CartItem {
  id: number;
  medicine: Medicine;
  quantity: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_price: number;
}

export interface OrderItem {
  id: number;
  medicine: Medicine;
  quantity: number;
  price: string;
}

export interface Order {
  id: number;
  items: OrderItem[];
  total_price: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}