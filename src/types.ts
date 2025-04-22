export type TransactionRow = {
	id: number;
	coin_id: number;
	amount: number;
	transaction_date: string;
	seller_id: number;
	seller_name: string;
	buyer_id: number;
	buyer_name: string;
	bit1: number;
	bit2: number;
	bit3: number;
	value: number;
	computedBitSlow: string | null;
};

export type CoinRow = {
	coin_id: number;
	client_id: number;
	value: number;
};

export type User = {
	id: number;
	name: string;
	email: string;
	password: string;
	phone: string;
	address: string;
	created_at: string;
};

export type userData = {
	id: number;
	name: string;
	email: string;
	phone: string;
	address: string;
};

export type BitSlowRow = {
	coin_id: number;
	owner_id: number;
	bit1: number;
	bit2: number;
	bit3: number;
	value: number;
};
