interface PageProps {
	totalTransactions: number;
	transactionsPerPage: number;
	setCurrentPage: (arg0: number) => void;
	currentPage: number;
}

export function Pagination({
	totalTransactions,
	transactionsPerPage,
	setCurrentPage,
	currentPage,
}: PageProps) {
	const totalPages = Math.ceil(totalTransactions / transactionsPerPage);
	const pages: (number | string)[] = [];

	const maxPageButtons = 5;

	if (totalPages <= 5) {
		for (let i = 1; i <= totalPages; i++) {
			pages.push(i);
		}
	} else {
		let startPage = Math.max(2, currentPage - Math.floor(maxPageButtons / 2));
		let endPage = Math.min(
			totalPages - 1,
			currentPage + Math.floor(maxPageButtons / 2),
		);

		if (currentPage - Math.floor(maxPageButtons / 2) < 1) {
			endPage = Math.min(
				totalPages,
				endPage + (1 - (currentPage - Math.floor(maxPageButtons / 2))),
			);
		}
		if (currentPage + Math.floor(maxPageButtons / 2) > totalPages) {
			startPage = Math.max(
				1,
				startPage - (currentPage + Math.floor(maxPageButtons / 2) - totalPages),
			);
		}

		pages.push(1);
		if (startPage > 2) {
			pages.push("...");
		}

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}

		if (endPage < totalPages - 1) {
			pages.push("...");
		}

		if (totalPages > 1) {
			pages.push(totalPages);
		}
	}

	return (
		<div className="flex justify-center mt-2">
			<nav className="flex flex-wrap gap-2">
				{pages.map((page, index) => (
					<button
						type="button"
						key={page}
						onClick={() => {
							if (typeof page === "number") {
								setCurrentPage(page);
							}
						}}
						disabled={page === "..."}
						className={`px-4 py-2 rounded-lg text-sm font-medium border transition duration-200
				${
					page === currentPage
						? "bg-blue-500 text-white border-blue-500 shadow"
						: page === "..."
							? "bg-white text-gray-700 border-gray-300"
							: "bg-white text-gray-700 border-gray-300 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-600"
				}
				`}
					>
						{page}
					</button>
				))}
			</nav>
		</div>
	);
}
