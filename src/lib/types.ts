export const WEEKDAYS = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
] as const;

export type Weekday = (typeof WEEKDAYS)[number]["key"];

export type DayHours = {
  closed: boolean;
  open: string;
  close: string;
};

export type HoursMap = Record<Weekday, DayHours>;

export type PublicSettings = {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  hours: HoursMap;
  leadTimeMinutes: number;
  slotMinutes: number;
  taxEnabled: boolean;
  taxBps: number;
  timezone: string;
};

export type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount?: number;
};

export type ProductDTO = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  image: string;
  keywords: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  active: boolean;
};

export type Catalog = {
  categories: CategoryDTO[];
  products: ProductDTO[];
  settings: PublicSettings;
};

export type CartLine = {
  productId: string;
  quantity: number;
};

export type Slot = {
  start: string;
  end: string;
  label: string;
};

export const DEFAULT_HOURS: HoursMap = {
  mon: { closed: false, open: "08:00", close: "21:00" },
  tue: { closed: false, open: "08:00", close: "21:00" },
  wed: { closed: false, open: "08:00", close: "21:00" },
  thu: { closed: false, open: "08:00", close: "21:00" },
  fri: { closed: false, open: "08:00", close: "21:00" },
  sat: { closed: false, open: "08:00", close: "21:00" },
  sun: { closed: false, open: "09:00", close: "13:00" },
};

export type OrderItemDTO = {
  id: string;
  productId: string | null;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  unavailable: boolean;
  stock: number | null;
};

export type OrderEventDTO = {
  id: string;
  status: string;
  note: string;
  createdAt: string;
};

export type OrderEditDTO = {
  id: string;
  message: string;
  createdAt: string;
};

export type OrderDTO = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  notes: string;
  fulfillmentType: string;
  pickupDate: string;
  pickupSlotStart: string;
  pickupSlotEnd: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  overdue: boolean;
  urgent: boolean;
  items: OrderItemDTO[];
  statusEvents: OrderEventDTO[];
  edits: OrderEditDTO[];
};

export type OrderListItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  itemCount: number;
  total: number;
  createdAt: string;
  pickupDate: string;
  pickupSlotStart: string;
  pickupSlotEnd: string;
  status: string;
  overdue: boolean;
  urgent: boolean;
  notes: string;
};

export const DEFAULT_SETTINGS: PublicSettings = {
  storeName: "Laxmi Kirana Store",
  address: "Shop 4, Laxmi Market, MG Road, Pune 411001",
  phone: "+977 1-4000000",
  email: "hello@laxmikirana.store",
  hours: DEFAULT_HOURS,
  leadTimeMinutes: 120,
  slotMinutes: 30,
  taxEnabled: false,
  taxBps: 0,
  timezone: "Asia/Kathmandu",
};
