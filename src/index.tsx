import { serve } from "bun";
import { Database } from "bun:sqlite";
import { seedDatabase } from "./seed";
import index from "./index.html";
import { computeBitSlow } from "./bitslow";
import type { TransactionRow, CoinRow, User, BitSlowRow } from "./types";
import * as jose from "jose";

// Initialize the database
const db = new Database(":memory:");

// Seed the database with random data
seedDatabase(db, {
	clientCount: 20,
	bitSlowCount: 40,
	transactionCount: 100,
	clearExisting: false, //clear data at restart
});

const getToken = async (payload: jose.JWTPayload, expiry?: string) => {
	const signJwt = new jose.SignJWT(payload).setProtectedHeader({
		alg: "HS256",
	});

	if (expiry) {
		signJwt.setExpirationTime(expiry);
	}

	return await signJwt.sign(
		new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN_SECRET),
	);
};

async function authentificate(
	req: Request,
): Promise<{ username: string } | null> {
	const jwtToken = req.headers.get("Authentificate");
	if (!jwtToken) return null;

	try {
		const { payload } = await jose.jwtVerify(
			jwtToken,
			new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN_SECRET),
		);
		return payload as { username: string };
	} catch (err) {
		console.error("Invalid token", err);
		return null;
	}
}

const server = serve({
	routes: {
		// Serve index.html for all unmatched routes.
		"/*": index,
		"/api/transactions": () => {
			try {
				const transactions = db
					.query<TransactionRow, []>(`
            SELECT 
				t.id, 
				t.coin_id, 
				t.amount, 
				t.transaction_date,
				seller.id as seller_id,
				seller.name as seller_name,
				buyer.id as buyer_id,
				buyer.name as buyer_name,
				c.bit1,
				c.bit2,
				c.bit3,
				c.value
			FROM transactions t
			LEFT JOIN clients seller ON t.seller_id = seller.id
			JOIN clients buyer ON t.buyer_id = buyer.id
			JOIN coins c ON t.coin_id = c.coin_id
			ORDER BY t.transaction_date DESC
        `)
					.all();

				// Add computed BitSlow to each transaction
				const enhancedTransactions = transactions.map((transaction) => ({
					...transaction,
					computedBitSlow: computeBitSlow(
						transaction.bit1,
						transaction.bit2,
						transaction.bit3,
					),
				}));

				return Response.json(enhancedTransactions);
			} catch (error) {
				console.error("Error fetching transactions:", error);
				return new Response("Error fetching transactions", { status: 500 });
			}
		},

		"/api/signup": {
			POST: async (req) => {
				const { name, email, password, phoneNumber, address } =
					await req.json();

				const emailVerify = db
					.prepare(
						`SELECT email FROM clients
					WHERE email = ?`,
					)
					.get(email);

				const hashedPassword = await Bun.password.hash(password);

				if (emailVerify)
					return new Response(
						JSON.stringify({ error: "Email already exists in db" }),
						{ status: 404 },
					);

				try {
					db.query(
						`INSERT INTO clients(name, email, password, phone, address)
					VALUES (?, ?, ?, ?, ?)`,
					).run(name, email, hashedPassword, phoneNumber, address);
				} catch (err) {
					return new Response(JSON.stringify({ error: "Unknown error" }), {
						status: 401,
					});
				}

				//if no errors occurs
				const accessToken = await getToken({ username: email }, "15m");

				return Response.json(
					{
						message: "registerSuccess",
						name: name,
						email: email,
						password: hashedPassword,
						phone: phoneNumber,
						address: address,
					},
					{
						status: 201,
						headers: {
							Authentificate: `${accessToken}`,
							"Content-Type": "application/json",
						},
					},
				);
			},
		},

		"/api/login": {
			POST: async (req) => {
				const { email, password } = await req.json();

				const client = db
					.prepare<User, string>(
						`SELECT * FROM clients
				WHERE email = ?`,
					)
					.get(email);

				if (!client)
					return Response.json({ error: "User not found" }, { status: 404 });

				if (!Bun.password.verify(password, client.password))
					return Response.json({ error: "Invalid password" }, { status: 401 });

				//if no errors occurs
				const accessToken = await getToken({ username: client.email }, "15m");

				return Response.json(
					{
						message: "loginSuccess",
						id: client.id,
						name: client.name,
						email: client.email,
					},
					{
						status: 200,
						headers: {
							Authentificate: `${accessToken}`,
							"Content-Type": "application/json",
						},
					},
				);
			},
		},

		"/api/protected": {
			GET: async (req) => {
				const user = await authentificate(req);
				// console.log("Authenticated user:", user);
				if (!user) {
					return new Response(JSON.stringify({ error: "Unauthorized" }), {
						status: 401,
						headers: { "Content-Type": "application/json" },
					});
				}

				const userDetails = db
					.prepare<User, [string]>(
						`SELECT id, name, email, phone, address FROM clients
					WHERE email = ?`,
					)
					.get(user.username);

				if (!userDetails) {
					return new Response(JSON.stringify({ error: "User not found" }), {
						status: 404,
						headers: { "Content-Type": "application/json" },
					});
				}

				// console.log(userDetails)
				return new Response(
					JSON.stringify({
						message: "Welcome to the protected route!",
						user: userDetails,
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			},
		},

		"/api/refresh": {
			GET: async (req) => {
				const refreshToken = req.headers.get("Authentificate");

				if (!refreshToken)
					return new Response(
						JSON.stringify({ erorr: "Refresh token missing" }),
						{
							status: 401,
							headers: {
								"Content-type": "application/json",
							},
						},
					);

				try {
					const { payload } = await jose.jwtVerify(
						refreshToken,
						new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN_SECRET),
					);

					const accessToken = await getToken(
						{ username: payload.username },
						"15m",
					);

					console.log("Refresh token successfully");

					return new Response(JSON.stringify({ accessToken }), {
						status: 200,
						headers: {
							Authentificate: `${accessToken}`,
							"Content-Type": "application/json",
						},
					});
				} catch (err) {
					console.error("Invalid refresh token", err);
					return new Response(
						JSON.stringify({ error: "Invalid refresh token" }),
						{
							status: 401,
							headers: {
								"Content-Type": "application/json",
							},
						},
					);
				}
			},
		},

		"/api/logout": {
			POST: () => {
				return new Response(JSON.stringify({ message: "Logout successful" }), {
					status: 200,
					headers: {
						"Content-Type": "application/json",
					},
				});
			},
		},

		"/api/client/:clientid": {
			GET: async (req) => {
				const clientId = req.params.clientid;

				const verifyClient = db
					.prepare(
						`SELECT name FROM clients
					WHERE id = ?`,
					)
					.get(clientId);

				if (!verifyClient) {
					return new Response(JSON.stringify({ err: "Invalid client id" }), {
						status: 401,
						headers: { "Content-Type": "application/json" },
					});
				}

				const transactionsMadeBy = db
					.prepare<TransactionRow, [string]>(`
					SELECT 
						t.id, 
						t.coin_id, 
						t.amount, 
						t.transaction_date,
						seller.id as seller_id,
						seller.name as seller_name,
						buyer.id as buyer_id,
						buyer.name as buyer_name,
						c.bit1,
						c.bit2,
						c.bit3,
						c.value
					FROM transactions t
					JOIN clients seller ON t.seller_id = seller.id
					JOIN clients buyer ON t.buyer_id = buyer.id
					JOIN coins c ON t.coin_id = c.coin_id
					WHERE seller.id = ?
					ORDER BY t.transaction_date DESC
				`)
					.all(clientId);

				const enhancedTransactionsMadeBy = transactionsMadeBy.map(
					(transaction) => ({
						...transaction,
						computedBitSlow: computeBitSlow(
							transaction.bit1,
							transaction.bit2,
							transaction.bit3,
						),
					}),
				);

				const transactionsBuyed = db
					.prepare<TransactionRow, [string]>(`
					SELECT 
						t.id, 
						t.coin_id, 
						t.amount, 
						t.transaction_date,
						seller.id as seller_id,
						seller.name as seller_name,
						buyer.id as buyer_id,
						buyer.name as buyer_name,
						c.bit1,
						c.bit2,
						c.bit3,
						c.value
					FROM transactions t
					LEFT JOIN clients seller ON t.seller_id = seller.id
					JOIN clients buyer ON t.buyer_id = buyer.id
					JOIN coins c ON t.coin_id = c.coin_id
					WHERE buyer.id = ?
					ORDER BY t.transaction_date DESC
				`)
					.all(clientId);

				const enhancedTransactionsBuyed = transactionsBuyed.map(
					(transaction) => ({
						...transaction,
						computedBitSlow: computeBitSlow(
							transaction.bit1,
							transaction.bit2,
							transaction.bit3,
						),
					}),
				);

				// console.log("by me: ", enhancedTransactionsMadeBy)
				// console.log("buyed(not enhanced): ", transactionsBuyed)

				const coins = db
					.prepare<CoinRow, [string]>(
						`SELECT coin_id, client_id, value FROM coins
					WHERE client_id = ?`,
					)
					.all(clientId);

				// console.log("coins: ", coins)

				const totalBitSlowCurrency = coins.length;
				// console.log("totalBitSlowCurrency: ", totalBitSlowCurrency)

				const totalMonetaryValue = coins.reduce(
					(sum, coin) => sum + (coin.value || 0),
					0,
				);

				return new Response(
					JSON.stringify({
						client: verifyClient,
						transactionsMadeBy: enhancedTransactionsMadeBy,
						transactionsBuyed: enhancedTransactionsBuyed,
						totalBitSlowCurrency: totalBitSlowCurrency,
						totalMonetaryValue: totalMonetaryValue,
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			},
		},

		"/api/buyerssellers": {
			GET: async (req) => {
				try {
					const buyers = db
						.prepare<{ name: string }, []>(`
						SELECT DISTINCT c.name 
						FROM transactions t
						JOIN clients c ON t.buyer_id = c.id
					`)
						.all();

					const sellers = db
						.prepare<{ name: string }, []>(`
						SELECT DISTINCT c.name 
						FROM transactions t
						JOIN clients c ON t.seller_id = c.id
					`)
						.all();

					const buyerNames = buyers.map((buyer) => buyer.name);
					const sellerNames = sellers.map((seller) => seller.name);

					return new Response(
						JSON.stringify({
							buyers: buyerNames,
							sellers: sellerNames,
						}),
						{
							status: 200,
							headers: { "Content-Type": "application/json" },
						},
					);
				} catch (err) {
					console.error("Error fetching buyers and sellers:", err);
					return new Response(
						JSON.stringify({ error: "Failed to fetch buyers and sellers" }),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},
		},

		"/api/filtered": {
			POST: async (req) => {
				const {
					startDate,
					finishDate,
					minBitSlowValue,
					maxBitSlowValue,
					buyerName,
					sellerName,
				} = await req.json();

				let query = `
					SELECT 
						t.id, 
						t.coin_id, 
						t.amount, 
						t.transaction_date,
						seller.id as seller_id,
						seller.name as seller_name,
						buyer.id as buyer_id,
						buyer.name as buyer_name,
						c.bit1,
						c.bit2,
						c.bit3,
						c.value
					FROM transactions t
					LEFT JOIN clients seller ON t.seller_id = seller.id
					JOIN clients buyer ON t.buyer_id = buyer.id
					JOIN coins c ON t.coin_id = c.coin_id
					WHERE 1 = 1
				`;

				const params = [];

				if (startDate) {
					query += " AND t.transaction_date >= ?";
					params.push(startDate);
				}
				if (finishDate) {
					query += " AND t.transaction_date <= ?";
					params.push(finishDate);
				}
				if (minBitSlowValue !== "" && minBitSlowValue !== undefined) {
					query += " AND c.value >= ?";
					params.push(minBitSlowValue);
				}
				if (maxBitSlowValue !== "" && maxBitSlowValue !== undefined) {
					query += " AND c.value <= ?";
					params.push(maxBitSlowValue);
				}
				if (buyerName) {
					query += " AND buyer.name LIKE ?";
					params.push(`%${buyerName}%`);
				}
				if (sellerName) {
					query += " AND seller.name LIKE ?";
					params.push(`%${sellerName}%`);
				}

				query += " ORDER BY t.transaction_date DESC";

				const filteredTransactions = db
					.prepare(query)
					.all(...params) as TransactionRow[];

				const enhancedTransactions = filteredTransactions.map(
					(transaction) => ({
						...transaction,
						computedBitSlow: computeBitSlow(
							transaction.bit1,
							transaction.bit2,
							transaction.bit3,
						),
					}),
				);

				return new Response(JSON.stringify(enhancedTransactions), {
					headers: { "Content-Type": "application/json" },
				});
			},
		},

		"/api/marketplace": {
			GET: async (req) => {
				const coins = db
					.prepare<BitSlowRow, []>(`
					SELECT 
					c.coin_id, 
					c.client_id AS owner_id,
					o.name AS owner, 
					c.bit1, 
					c.bit2, 
					c.bit3, 
					c.value 
					FROM coins c
					LEFT JOIN clients o ON c.client_id = o.id
				`)
					.all();

				const enhancedCoins = coins.map((coin) => ({
					...coin,
					hash: computeBitSlow(coin.bit1, coin.bit2, coin.bit3),
				}));

				return Response.json(enhancedCoins);
			},
		},

		"/api/history/:coin_id": {
			GET: async (req) => {
				const coin_id = Number(req.params.coin_id);

				const history = db
					.prepare<{ name: string }, number>(`
					SELECT
						c.name
					FROM transactions t
					JOIN clients c ON t.seller_id = c.id
					WHERE t.coin_id = ?	
				`)
					.all(coin_id);

				const names = history.map((item) => item.name);

				return new Response(JSON.stringify({ names }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			},
		},

		"/api/buy/:coin_id": {
			POST: async (req) => {
				const user = await authentificate(req);

				if (!user) {
					return new Response(JSON.stringify({ error: "Unauthorized" }), {
						status: 401,
						headers: { "Content-Type": "application/json" },
					});
				}

				interface Client {
					name: string;
				}

				const name = db
					.prepare<Client, string>(`
					SELECT name FROM clients WHERE email = ?
				`)
					.get(user.username);

				const coin_id = Number(req.params.coin_id);

				// the buyer is the person that is authentificated
				const buyerRow = db
					.prepare(`
					SELECT id FROM clients WHERE email = ?
				`)
					.get(user.username) as { id: number } | undefined;

				if (!buyerRow) {
					return new Response(JSON.stringify({ error: "Buyer not found" }), {
						status: 404,
						headers: { "Content-Type": "application/json" },
					});
				}

				const buyer_id = buyerRow.id;

				const amount = db
					.prepare<{ value: number }, number>(`
					SELECT value FROM coins
					WHERE coin_id = ?	
				`)
					.get(coin_id);

				if (typeof amount?.value !== "number" || name === null) {
					return new Response(JSON.stringify({ error: "Invalid data" }), {
						status: 400,
						headers: { "Content-Type": "application/json" },
					});
				}

				const transactionDate = new Date();

				db.prepare(`
					INSERT INTO transactions (coin_id, seller_id, buyer_id, amount, transaction_date)
					VALUES (?, ?, ?, ?, ?)
				`).run(
					coin_id,
					buyer_id,
					null,
					amount.value,
					transactionDate.toISOString(),
				);

				db.prepare(`
					UPDATE coins
					SET client_id = ?
					WHERE coin_id = ?
				`).run(buyer_id, coin_id);

				return new Response(
					JSON.stringify({
						message: "The BitSlow coin was purchased successfully!",
						name: name.name,
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			},
		},

		"/api/findbits": {
			GET: async (req) => {
				const usedBitCombinations = new Set<string>();

				const coins = db
					.prepare<{ bit1: number; bit2: number; bit3: number }, []>(`
					SELECT bit1, bit2, bit3 FROM coins	
				`)
					.all();

				for (const { bit1, bit2, bit3 } of coins) {
					const bitCombinationKey = `${bit1}-${bit2}-${bit3}`;
					usedBitCombinations.add(bitCombinationKey);
				}

				/**
				 * Generate an array of distinct random numbers
				 * @param count Number of distinct values to generate
				 * @param min Minimum value (inclusive)
				 * @param max Maximum value (inclusive)
				 * @returns Array of distinct random values
				 */
				function generateDistinctRandomValues(
					count: number,
					min: number,
					max: number,
				): number[] {
					if (max - min + 1 < count) {
						throw new Error(
							`Cannot generate ${count} distinct values in range [${min}, ${max}]`,
						);
					}

					const values: Set<number> = new Set();
					while (values.size < count) {
						values.add(Math.floor(Math.random() * (max - min + 1)) + min);
					}

					return Array.from(values);
				}

				let bit1: number;
				let bit2: number;
				let bit3: number;
				let bitCombinationKey: string;

				let c = usedBitCombinations.size;
				let noValues = false;
				do {
					const bitValues = generateDistinctRandomValues(3, 1, 10);
					bit1 = bitValues[0];
					bit2 = bitValues[1];
					bit3 = bitValues[2];

					bitCombinationKey = `${bit1}-${bit2}-${bit3}`;
					c++;

					if (c === 9 * 9 * 9) {
						noValues = true;
						break;
					}
				} while (usedBitCombinations.has(bitCombinationKey));

				if (!noValues) {
					return new Response(
						JSON.stringify({ bit1, bit2, bit3, noValues: false }),
						{
							status: 201,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				return new Response(
					JSON.stringify({
						message: "No more unique bit combinations available.",
						noValues: true,
					}),
					{
						status: 204,
						headers: { "Content-Type": "application/json" },
					},
				);
			},
		},

		"/api/generate": {
			POST: async (req) => {
				const user = await authentificate(req);

				if (!user) {
					return new Response(JSON.stringify({ error: "Unauthorized" }), {
						status: 401,
						headers: { "Content-Type": "application/json" },
					});
				}

				const owner_id = db
					.prepare<{ id: number }, string>(`
					SELECT id FROM clients
					WHERE email = ?	
				`)
					.get(user.username);

				const amount = req.headers.get("Amount");

				const bit1 = Number(req.headers.get("Bit1"));
				const bit2 = Number(req.headers.get("Bit2"));
				const bit3 = Number(req.headers.get("Bit3"));

				if (
					Number.isNaN(bit1) ||
					Number.isNaN(bit2) ||
					Number.isNaN(bit3) ||
					owner_id === null
				) {
					console.log(bit1, bit2, bit3);
					return new Response(JSON.stringify({ error: "Invalid values" }), {
						status: 400,
						headers: { "Content-Type": "application/json" },
					});
				}

				// console.log(owner_id.id, bit1, bit2, bit3, amount)
				db.prepare(`
					INSERT INTO coins(client_id, bit1, bit2, bit3, value)
					VALUES (?, ?, ?, ?, ?)	
				`).run(owner_id.id, bit1, bit2, bit3, amount);

				return new Response(
					JSON.stringify({
						message: "The BitSlow coin was generated successfully!",
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			},
		},

		"/api/clients": {
			GET: () => {
				const clients = db.query("SELECT * FROM clients").all();
				return Response.json(clients);
			},
		},

		"/api/coins": {
			GET: async (req) => {
				const coins = db.prepare("SELECT * FROM coins").all();
				return Response.json(coins);
			},
		},
	},
	development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
