import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

interface PageProps {
	onFilter: (filters: {
		startDate: string;
		finishDate: string;
		minBitSlowValue: number | "";
		maxBitSlowValue: number | "";
		buyerName: string;
		sellerName: string;
	}) => void;
	resetFilter: () => void;
}

export function FilteringBox({ onFilter, resetFilter }: PageProps) {
	const [startDate, setStartDate] = useState<string>("");
	const [finishDate, setFinishDate] = useState<string>("");
	const [minBitSlowValue, setMinBitSlowValue] = useState<number | "">("");
	const [maxBitSlowValue, setMaxBitSlowValue] = useState<number | "">("");
	const [buyers, setBuyers] = useState<[string]>();
	const [sellers, setSellers] = useState<[string]>();
	const [buyerName, setBuyerName] = useState<string>("");
	const [sellerName, setSellerName] = useState<string>("");
	const [errorMessage, setErrorMessage] = useState("");

	const resetFilters = () => {
		setStartDate("");
		setFinishDate("");
		setMinBitSlowValue("");
		setMaxBitSlowValue("");
		setBuyerName("");
		setSellerName("");
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch("/api/buyerssellers", {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (!res.ok) {
					setErrorMessage("Failed to fetch user data");
				} else {
					const data = await res.json();
					setBuyers(data.buyers);
					setSellers(data.sellers);
				}
			} catch (err) {
				console.error({ error: "Error fetching data: ", err });
				setErrorMessage("An error occurred while fetching data.");
			}
		};

		fetchData();
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleFilter();
		}
	};

	const handleFilter = () => {
		onFilter({
			startDate,
			finishDate,
			minBitSlowValue,
			maxBitSlowValue,
			buyerName,
			sellerName,
		});
	};

	return (
		<div className="bg-white shadow-md rounded-xl p-4 mb-6 overflow-x-auto">
			<form
				className="flex flex-wrap gap-4 items-end"
				onKeyDown={handleKeyDown}
			>
				<div className="flex flex-col text-sm">
					<label htmlFor="startdate" className="mb-1 text-gray-600 font-medium">
						Start
					</label>
					<input
						id="startdate"
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
						className="border border-gray-300 rounded-md px-2 py-1 text-sm w-36 focus:ring-orange-400 focus:outline-none"
					/>
				</div>

				<div className="flex flex-col text-sm">
					<label
						htmlFor="finishdate"
						className="mb-1 text-gray-600 font-medium"
					>
						Finish
					</label>
					<input
						id="finishdate"
						type="date"
						value={finishDate}
						onChange={(e) => setFinishDate(e.target.value)}
						className="border border-gray-300 rounded-md px-2 py-1 text-sm w-36 focus:ring-orange-400 focus:outline-none"
					/>
				</div>

				<div className="flex flex-col text-sm">
					<label htmlFor="minValue" className="mb-1 text-gray-600 font-medium">
						Min Value
					</label>
					<input
						id="minValue"
						type="number"
						value={minBitSlowValue}
						placeholder="-"
						onChange={(e) =>
							setMinBitSlowValue(
								e.target.value === "" ? "" : Number(e.target.value),
							)
						}
						className="border border-gray-300 rounded-md px-2 py-1 text-sm w-28 focus:ring-orange-400 focus:outline-none"
					/>
				</div>

				<div className="flex flex-col text-sm">
					<label htmlFor="maxValue" className="mb-1 text-gray-600 font-medium">
						Max Value
					</label>
					<input
						id="maxValue"
						type="number"
						value={maxBitSlowValue}
						placeholder="-"
						onChange={(e) =>
							setMaxBitSlowValue(
								e.target.value === "" ? "" : Number(e.target.value),
							)
						}
						className="border border-gray-300 rounded-md px-2 py-1 text-sm w-28 focus:ring-orange-400 focus:outline-none"
					/>
				</div>

				<div className="flex flex-col text-sm">
					<label
						htmlFor="selectSeller"
						className="mb-1 text-gray-600 font-medium"
					>
						Seller
					</label>
					<select
						id="selectSeller"
						value={sellerName}
						onChange={(e) => setSellerName(e.target.value)}
						className="border border-gray-300 rounded-md px-2 py-1 text-sm w-32 focus:ring-orange-400 focus:outline-none max-h-32 overflow-y-auto"
					>
						<option value="">All</option>
						{sellers?.map((seller) => (
							<option key={seller} value={seller}>
								{seller}
							</option>
						))}
					</select>
				</div>

				<div className="flex flex-col text-sm">
					<label
						htmlFor="selectBuyer"
						className="mb-1 text-gray-600 font-medium"
					>
						Buyer
					</label>
					<select
						id="selectBuyer"
						value={buyerName}
						onChange={(e) => setBuyerName(e.target.value)}
						className="border border-gray-300 rounded-md px-2 py-1 text-sm w-32 focus:ring-orange-400 focus:outline-none max-h-32 overflow-y-auto"
					>
						<option value="">All</option>
						{buyers?.map((buyer) => (
							<option key={buyer} value={buyer}>
								{buyer}
							</option>
						))}
					</select>
				</div>

				<div className="flex gap-2">
					<button
						type="button"
						onClick={handleFilter}
						className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-1.5 rounded-md text-sm transition duration-200"
					>
						Filter
					</button>
					<button
						type="button"
						onClick={() => {
							resetFilters();
							resetFilter();
						}}
						className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition duration-200"
					>
						<RotateCcw className="w-4 h-4" />
						Reset filters
					</button>
				</div>
			</form>
		</div>
	);
}
