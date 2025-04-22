import "./index.css";
import { useState, useEffect, use } from "react";
import {
	Routes,
	Route,
	Link,
	useNavigate,
	useLocation,
} from "react-router-dom";
import { SignUpForm } from "./SignUpForm";
import { ProfilePage } from "./ProfilePage";
import { fetchWithRefresh } from "./fetchWithRefresh";
import { Pagination } from "./Pagination";
import { FilteringBox } from "./FilteringBox";
import { Marketplace } from "./Marketplace";
import { GenerateCoinModal } from "./GenerateCoinModal";
import type { userData } from "./types";

interface Transaction {
	id: number;
	coin_id: number;
	amount: number;
	transaction_date: string;
	seller_id: number | null;
	seller_name: string | null;
	buyer_id: number;
	buyer_name: string;
	bit1: number;
	bit2: number;
	bit3: number;
	value: number;
	computedBitSlow: string;
}

const ENDPOINT_URL = "http://localhost:3000/";

function fetchTransactions(): Promise<Transaction[]> {
	return fetch(`${ENDPOINT_URL}api/transactions`)
		.then((response) => response.json())
		.catch((error) => {
			console.error("Error fetching data:", error);
			return [];
		});
}

function useTransactions() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		fetchTransactions()
			.then((data) => {
				setTransactions(data);
				setLoading(false);
			})
			.catch((err) => {
				setError(err);
				setLoading(false);
			});
	}, []);

	return { transactions, loading, error };
}

export function App() {
	//auth
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [userDetails, setUserDetails] = useState<userData | null>(null);

	const { transactions, loading, error } = useTransactions();
	const [loadingTime, setLoadingTime] = useState(0);

	//pagination
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [transactionsPerPage, setTransactionsPerPage] = useState<number>(10);
	const [transactionsToDisplay, setTransactionsToDisplay] = useState<
		Transaction[]
	>([]);

	//filter
	const [filteredTransactions, setFilteredTransactions] = useState<
		Transaction[]
	>([]);
	const [filteringLoading, setFilteringLoading] = useState<boolean>(false);
	const [isFilteringActive, setIsFilteringActive] = useState(false);

	//modal
	const [showModal, setShowModal] = useState(false);
	const [bits, setBits] = useState<number[]>([]);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [refreshCoinsKey, setRefreshCoinsKey] = useState(0);

	const location = useLocation();
	const navigate = useNavigate();

	const handleAuthSuccess = (user: userData) => {
		setIsAuthenticated(true);
		setUserDetails(user);
	};

	const handleLogout = () => {
		navigate("/signup");
		localStorage.clear();
		setIsAuthenticated(false);
		setUserDetails(null);
	};

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const token = localStorage.getItem("authToken");
				const response = await fetchWithRefresh("/api/protected", {
					method: "GET",
					headers: {
						Authentificate: `${token}`,
					},
					credentials: "include",
				});

				if (response.ok) {
					const data = await response.json();
					setIsAuthenticated(true);
					setUserDetails(data.user);
				} else {
					setIsAuthenticated(false);
					setUserDetails(null);
				}
			} catch (err) {
				console.error("Error checking authentication:", err);
				setIsAuthenticated(false);
			}
		};

		checkAuth();
	}, []);

	const handleFilter = async (filters: {
		startDate: string;
		finishDate: string;
		minBitSlowValue: number | "";
		maxBitSlowValue: number | "";
		buyerName: string;
		sellerName: string;
	}) => {
		try {
			setFilteringLoading(true);

			const response = await fetch("/api/filtered", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(filters),
			});

			if (!response.ok) {
				console.error("Failed to fetch filtered transactions");
				return;
			}

			const data = await response.json();
			setIsFilteringActive(true);
			setFilteredTransactions(data);
			setTransactionsToDisplay(data.slice(0, transactionsPerPage));
			setCurrentPage(1);
		} catch (err) {
			console.error("Error fetching filtered transactions:", err);
			setFilteringLoading(false);
		} finally {
			setFilteringLoading(false);
		}
	};

	const resetFilter = () => {
		setFilteredTransactions(transactions);
		setTransactionsToDisplay(transactions.slice(0, transactionsPerPage));
		setCurrentPage(1);
		setIsFilteringActive(false);
	};

	useEffect(() => {
		const lastTransactionIndex = currentPage * transactionsPerPage;
		const firstTransactionIndex = lastTransactionIndex - transactionsPerPage;

		const source = isFilteringActive ? filteredTransactions : transactions;
		setTransactionsToDisplay(
			source.slice(firstTransactionIndex, lastTransactionIndex),
		);
	}, [
		currentPage,
		transactions,
		filteredTransactions,
		transactionsPerPage,
		isFilteringActive,
	]);

	useEffect(() => {
		let timerId: number | undefined;

		if (loading) {
			timerId = window.setInterval(() => {
				setLoadingTime((prev) => prev + 1);
			}, 1000);
		}

		return () => {
			if (timerId) clearInterval(timerId);
		};
	}, [loading]);

	const triggerCoinRefresh = () => {
		setRefreshCoinsKey((prev) => prev + 1);
	};

	if (loading) {
		return (
			<div className="flex flex-col justify-center items-center h-screen bg-gray-50">
				<div className="w-16 h-16 mb-4 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin" />
				<h2 className="text-xl font-semibold text-gray-700 mb-2">
					Loading Transactions...
				</h2>
				<p className="text-sm text-gray-600">Time elapsed: {loadingTime} sec</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-red-500 p-4 text-center">
				Error loading transactions: {error.message}
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto p-4">
			<h1 className="text-2xl font-semibold mb-6 text-gray-800 flex justify-between items-center">
				<div className="flex items-center gap-x-4">
					{isAuthenticated ? (
						location.pathname !== "/marketplace" ? (
							<>
								<span>BitSlow Transactions</span>
								<Link
									to="/marketplace"
									className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition duration-200 shadow"
								>
									Open Marketplace
								</Link>
							</>
						) : (
							<>
								<span>BitSlow Marketplace</span>
								{bits && (
									<button
										type="button"
										onClick={() => setShowModal(true)}
										className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition duration-200 shadow"
									>
										Generate Coin
									</button>
								)}
							</>
						)
					) : (
						<span>BitSlow Transactions</span>
					)}
				</div>

				<div>
					<Link
						to="/"
						className="px-3 py-1 mx-2 rounded text-sm font-medium bg-transparent text-gray-600 hover:bg-gray-100"
					>
						Transactions
					</Link>
					{isAuthenticated ? (
						<>
							<Link
								to="/profile"
								className="px-3 py-1 mx-2 rounded text-sm font-medium bg-transparent text-gray-600 hover:bg-gray-100"
							>
								Profile
							</Link>
						</>
					) : (
						<Link
							to="/signup"
							className="px-3 py-1 mx-2 rounded text-sm font-medium bg-transparent text-gray-600 hover:bg-gray-100"
						>
							Sign Up
						</Link>
					)}
				</div>
			</h1>

			<Routes>
				<Route
					path="/"
					element={
						transactionsToDisplay.length === 0 ? (
							isFilteringActive ? (
								<>
									<FilteringBox
										onFilter={handleFilter}
										resetFilter={resetFilter}
									/>
									<p className="text-gray-500">
										No transactions match your filters.
									</p>
								</>
							) : (
								<p className="text-gray-500">No transactions found.</p>
							)
						) : (
							<>
								<FilteringBox
									onFilter={handleFilter}
									resetFilter={resetFilter}
								/>
								<div className="overflow-x-auto rounded-lg shadow-md">
									<table className="w-full border-collapse bg-white">
										<thead>
											<tr className="bg-gray-800 text-white">
												<th className="p-4 text-left">ID</th>
												<th className="p-4 text-left">BitSlow</th>
												<th className="p-4 text-left">Seller</th>
												<th className="p-4 text-left">Buyer</th>
												<th className="p-4 text-right">Amount</th>
												<th className="p-4 text-left">Date</th>
											</tr>
										</thead>
										<tbody>
											{transactionsToDisplay.map((t, i) => (
												<tr
													key={t.id}
													className={`hover:bg-gray-50 transition-colors ${
														i === transactions.length - 1
															? ""
															: "border-b border-gray-200"
													}`}
												>
													<td className="p-4 text-gray-600">{t.id}</td>
													<td className="p-4">
														<div className="font-medium text-gray-800">
															{t.computedBitSlow}
														</div>
														<div className="text-xs text-gray-500 mt-1">
															Bits: {t.bit1}, {t.bit2}, {t.bit3}
														</div>
														<div className="text-xs text-gray-500">
															Value: ${t.value.toLocaleString()}
														</div>
													</td>
													<td className="p-4 text-gray-700">
														{t.seller_name ?? "Original Issuer"}
													</td>
													<td className="p-4 text-gray-700">
														{t.buyer_name === null ? "-" : t.buyer_name}
													</td>
													<td className="p-4 text-right font-semibold text-gray-800">
														${t.amount.toLocaleString()}
													</td>
													<td className="p-4 text-sm text-gray-600">
														{new Date(t.transaction_date).toLocaleString()}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</>
						)
					}
				/>
				<Route
					path="/marketplace"
					element={<Marketplace refreshKey={refreshCoinsKey} />}
				/>
				<Route
					path="/signup"
					element={<SignUpForm onAuthSuccess={handleAuthSuccess} />}
				/>
				<Route
					path="/profile"
					element={
						isAuthenticated ? (
							<ProfilePage user={userDetails} onLogout={handleLogout} />
						) : (
							<p className="text-center text-gray-500">Not logged in.</p>
						)
					}
				/>
			</Routes>

			{!(
				location.pathname === "/signup" ||
				location.pathname === "/profile" ||
				location.pathname === "/marketplace"
			) && (
				<div className="flex justify-between items-center mt-6">
					<Pagination
						totalTransactions={
							isFilteringActive
								? filteredTransactions.length === 0
									? 1
									: filteredTransactions.length
								: transactions.length
						}
						transactionsPerPage={transactionsPerPage}
						setCurrentPage={setCurrentPage}
						currentPage={currentPage}
					/>

					<div className="ml-4">
						<label
							htmlFor="perPage"
							className="mr-2 text-sm text-gray-700 font-medium"
						>
							Transactions per page:
						</label>
						<select
							id="perPage"
							className="px-2 py-1 border rounded text-sm"
							value={transactionsPerPage}
							onChange={(e) => {
								setTransactionsPerPage(Number(e.target.value));
								setCurrentPage(1);
							}}
						>
							<option value={10}>10</option>
							<option value={15}>15</option>
							<option value={30}>30</option>
							<option value={50}>50</option>
						</select>
					</div>
				</div>
			)}

			<GenerateCoinModal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				onSubmit={(amount) => {
					// Fetch the bits again when the user submits the form
					fetch("/api/findbits", {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					})
						.then((response) => response.json())
						.then((data) => {
							if (data.bit1 && data.bit2 && data.bit3) {
								setBits([data.bit1, data.bit2, data.bit3]); // Update the bits state
							} else {
								console.log("No valid bits received.");
							}

							// Generate the coin with the fetched bits
							return fetch("/api/generate", {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									Authentificate: localStorage.getItem("authToken") || "",
									Amount: `${amount}`,
									Bit1: `${data.bit1}`,
									Bit2: `${data.bit2}`,
									Bit3: `${data.bit3}`,
								},
								body: JSON.stringify({ amount }),
							});
						})
						.then((res) => res.json())
						.then((data) => {
							console.log("Success generating new coin:", data);
							setBits([]); // Clear bits after coin is generated
							triggerCoinRefresh();
							setSuccessMessage(
								"Successfully generated coin. It might take a while until you will be able to see it in marketplace.",
							);

							setTimeout(() => {
								setSuccessMessage("");
							}, 3000);
						})
						.catch((err) => console.error("Generating error:", err));
				}}
			/>

			{filteringLoading && (
				<div className="fixed top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-[rgba(0,0,0,0.6)] z-50">
					<div className="w-16 h-16 mb-4 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin" />
					<h2 className="text-xl font-semibold text-white mb-2">
						Filtering data...
					</h2>
				</div>
			)}

			{successMessage && (
				<div
					className="fixed bottom-6 left-1/2 transform -translate-x-1/2 text-white px-6 py-3 rounded shadow-xl z-50 transition text-center max-w-md w-fit break-words"
					style={{ backgroundColor: "oklch(48.8% 0.243 264.376)" }}
				>
					{successMessage}
				</div>
			)}
		</div>
	);
}

export default App;
