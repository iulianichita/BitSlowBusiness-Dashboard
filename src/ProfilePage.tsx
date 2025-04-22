import { useEffect, useState } from "react";
import type { TransactionRow, userData } from "./types";

interface ProfilePageProps {
	user: userData | null;
	onLogout: () => void;
}

export function ProfilePage({ user, onLogout }: ProfilePageProps) {
	const [transactionsMadeBy, setTransactionsMadeBy] = useState<
		TransactionRow[]
	>([]);
	const [transactionsBuyed, setTransactionsBuyed] = useState<TransactionRow[]>(
		[],
	);
	const [totalBitSlowCurrency, setTotalBitSlowCurrency] = useState<number>(0);
	const [totalMonetaryValue, setTotalMonetaryValue] = useState<number>(0);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"sent" | "received" | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!user) return;

		const fetchData = async () => {
			try {
				const response = await fetch(`/api/client/${user.id}`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});
				if (response.ok) {
					const data = await response.json();
					setTransactionsMadeBy(data.transactionsMadeBy);
					setTransactionsBuyed(data.transactionsBuyed);
					setTotalBitSlowCurrency(data.totalBitSlowCurrency);
					setTotalMonetaryValue(data.totalMonetaryValue);

					setActiveTab("sent");
				} else {
					setError("Failed to fetch user data");
				}
			} catch (err) {
				console.error({ error: "Error fetching data: ", err });
				setError("An error occurred while fetching data.");
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [user]);

	if (!user) return <p className="text-center text-gray-500">Not logged in.</p>;

	if (error) return <p className="text-center text-red-500">{error}</p>;

	if (isLoading) {
		return (
			<div className="flex flex-col justify-center items-center h-screen">
				<div className="w-16 h-16 mb-4 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin" />
				<h2 className="text-xl font-semibold text-gray-700 mb-2">
					Loading profile...
				</h2>
			</div>
		);
	}

	return (
		<div
			className={`bg-white shadow-md rounded p-6 mx-auto mt-6 transition-all duration-300 ${
				activeTab ? "max-w-7xl" : "max-w-md"
			}`}
		>
			<h2 className="text-xl font-semibold text-gray-800 mb-4">Profile</h2>
			<p className="text-gray-700">
				<strong>Name:</strong> {user.name}
			</p>
			<p className="text-gray-700">
				<strong>Email:</strong> {user.email}
			</p>
			<p className="text-gray-700">
				<strong>Phone:</strong> {user.phone}
			</p>
			<p className="text-gray-700">
				<strong>Address:</strong> {user.address}
			</p>

			<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">
				Transactions
			</h3>

			<div className="flex space-x-4 mb-4">
				<button
					type="button"
					className={`px-4 py-2 rounded ${
						activeTab === "sent"
							? "bg-blue-600 text-white"
							: "bg-gray-200 text-gray-700"
					}`}
					onClick={() => setActiveTab("sent")}
				>
					My Transactions
				</button>
				<button
					type="button"
					className={`px-4 py-2 rounded ${
						activeTab === "received"
							? "bg-blue-600 text-white"
							: "bg-gray-200 text-gray-700"
					}`}
					onClick={() => setActiveTab("received")}
				>
					Transactions to Me
				</button>
			</div>

			{activeTab === "sent" &&
				(transactionsMadeBy.length === 0 ? (
					<p className="text-gray-500"> No transactions in this category.</p>
				) : (
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
								{transactionsMadeBy.map((t, i) => (
									<tr
										key={t.id}
										className={`hover:bg-gray-50 transition-colors ${
											i === transactionsMadeBy.length - 1
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
										<td className="p-4 text-gray-700">{t.buyer_name}</td>
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
				))}

			{activeTab === "received" &&
				(transactionsBuyed.length === 0 ? (
					<p className="text-gray-500"> No transactions in this category.</p>
				) : (
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
								{transactionsBuyed.map((t, i) => (
									<tr
										key={t.id}
										className={`hover:bg-gray-50 transition-colors ${
											i === transactionsBuyed.length - 1
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
										<td className="p-4 text-gray-700">{t.buyer_name}</td>
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
				))}

			<p className="text-gray-700 mt-4">
				<strong>Total BitSlow Currency:</strong> {totalBitSlowCurrency}
			</p>
			<p className="text-gray-700">
				<strong>Total Monetary Value:</strong> $
				{totalMonetaryValue.toLocaleString()}
			</p>

			<button
				type="button"
				onClick={onLogout}
				className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
			>
				Log out
			</button>
		</div>
	);
}
