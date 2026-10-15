export type User = { id: string; name: string; email: string; businessName: string };
export type Customer = { id: number; name: string; phone: string; address: string };
export type EntryType = 'sale' | 'payment';
export type Entry = { id: string; type: EntryType; amount: number; description: string; date: string };
export type Account = { customer: Customer; entries: Entry[]; totals: { sales: number; payments: number; balance: number } };
export type Credentials = { email: string; password: string; name?: string; businessName?: string };
export type Session = { user: User; token: string };
