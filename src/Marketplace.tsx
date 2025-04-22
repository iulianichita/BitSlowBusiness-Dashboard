import { useEffect, useState } from "react";
import { Pagination } from "./Pagination";
import { PreviousOwnersModal } from "./PreviousOwnersModal";

interface Coin {
	coin_id: number;
	owner_id: number;
	owner: string;
	bit1: number;
	bit2: number;
	bit3: number;
	value: number;
	hash: string;
}

export function Marketplace({ refreshKey }: { refreshKey: number }) {
	const [errorMessage, setErrorMessage] = useState<string>();
	const [itemsToDisplay, setItemsToDisplay] = useState<Coin[]>([]);
	const [loading, setLoading] = useState(true);
	const [coinsToDisplay, setCoinsToDisplay] = useState<Coin[]>([]);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [purchasedCoins, setPurchasedCoins] = useState<Set<number>>(new Set());
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedOwners, setSelectedOwners] = useState<string[]>([]);

	const handleViewOwners = (coin_id: number) => {
		const fetchData = async () => {
			try {
				const response = await fetch(`/api/history/${coin_id}`, {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				});

				if (!response.ok) {
					const data = await response.json();
					throw new Error(data.error || "Something went wrong");
				}

				const data = await response.json();

				if (Array.isArray(data.names)) {
					setSelectedOwners(data.names);
				} else {
					setSelectedOwners([]);
				}

				setIsModalOpen(true);
			} catch (err) {
				console.error({ error: "Error fetching data: ", err });
				setErrorMessage("An error occurred while fetching data.");
			}
		};

		fetchData();
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch("/api/marketplace", {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				});
				const data = await response.json();
				setItemsToDisplay(data);
				setCurrentPage(1);
			} catch (err) {
				console.error({ error: "Error fetching data: ", err });
				setErrorMessage("An error occurred while fetching data.");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	useEffect(() => {
		const lastTransactionIndex = currentPage * 30;
		const firstTransactionIndex = lastTransactionIndex - 30;

		if (
			itemsToDisplay.length > 0 &&
			firstTransactionIndex >= itemsToDisplay.length
		) {
			const newPage = Math.max(1, Math.ceil(itemsToDisplay.length / 30));
			setCurrentPage(newPage);
		} else {
			setCoinsToDisplay(
				itemsToDisplay.slice(firstTransactionIndex, lastTransactionIndex),
			);
		}
	}, [currentPage, itemsToDisplay]);

	const handleBuyButton = (coin_id: number) => {
		const buyCoin = async () => {
			try {
				const token = localStorage.getItem("authToken");
				const response = await fetch(`/api/buy/${coin_id}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authentificate: `${token}`,
					},
					credentials: "include",
				});

				if (!response.ok) {
					const data = await response.json();
					throw new Error(data.error || "Something went wrong");
				}

				const result = await response.json();
				setPurchasedCoins((prev) => new Set(prev.add(coin_id)));

				setItemsToDisplay((prevItems) =>
					prevItems.map((item) =>
						item.coin_id === coin_id
							? { ...item, owner: result.name, owner_id: 1 }
							: item,
					),
				);

				console.log("Purchase successful:", result.message);
			} catch (err) {
				console.error(err);
				setErrorMessage("Error occurred while fetching data...");
			}
		};

		buyCoin();
	};

	if (loading) {
		return (
			<div className="flex flex-col justify-center items-center h-screen">
				<div className="w-16 h-16 mb-4 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin" />
				<h2 className="text-xl font-semibold text-gray-700 mb-2">
					Loading marketplace...
				</h2>
			</div>
		);
	}

	if (errorMessage) {
		return (
			<div className="text-red-500 p-4 text-center">
				Error loading transactions: {errorMessage}
			</div>
		);
	}

	return (
		<>
			<div className="overflow-x-auto rounded-lg shadow-md">
				<table className="w-full border-collapse bg-white">
					<thead>
						<tr className="bg-gray-800 text-white">
							<th className="p-4 text-left">BitSlow ID</th>
							<th className="p-4 text-left">Hash</th>
							<th className="p-4 text-left">Component Numbers</th>
							<th className="p-4 text-right">Monetary Value</th>
							<th className="p-4 text-left">Current Owner</th>
							<th className="p-4 text-center">Action</th>
						</tr>
					</thead>
					<tbody>
						{coinsToDisplay.map((item, i) => (
							<tr
								key={item.hash}
								className={`hover:bg-gray-50 transition-colors ${
									i === coinsToDisplay.length - 1
										? ""
										: "border-b border-gray-200"
								}`}
							>
								<td className="p-4 text-gray-600">{item.coin_id}</td>
								<td className="p-4 text-gray-600">#{item.hash}</td>
								<td className="p-4">
									<div className="text-sm text-gray-800 font-medium">
										Bits: {item.bit1}, {item.bit2}, {item.bit3}
									</div>
								</td>
								<td className="p-4 text-right font-semibold text-gray-800">
									${item.value.toLocaleString()}
								</td>
								<td className="p-4 text-gray-700">
									{item.owner_id === null ? "-" : item.owner}
								</td>
								<td className="p-4 text-center flex items-center justify-center gap-3">
									<button
										type="button"
										disabled={item.owner_id !== null}
										className={`px-4 py-2 rounded-lg shadow transition duration-200 text-sm font-medium text-white ${
											item.owner_id === null
												? "bg-orange-500 hover:bg-orange-600 cursor-pointer"
												: "bg-gray-300 cursor-not-allowed"
										}`}
										onClick={() => handleBuyButton(item.coin_id)}
									>
										{purchasedCoins.has(item.coin_id) ? "Purchased" : "Buy"}
									</button>

									<button
										type="button"
										onClick={() => handleViewOwners(item.coin_id)}
										className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-800 text-base font-bold transition"
										title="View previous owners"
									>
										i
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<Pagination
				totalTransactions={itemsToDisplay.length}
				transactionsPerPage={30}
				setCurrentPage={setCurrentPage}
				currentPage={currentPage}
			/>

			<PreviousOwnersModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				owners={selectedOwners}
			/>
		</>
	);
}
