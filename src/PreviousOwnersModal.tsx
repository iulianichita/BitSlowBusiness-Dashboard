import type React from "react";

interface PreviousOwnersModalProps {
	isOpen: boolean;
	onClose: () => void;
	owners: string[] | null;
}

export const PreviousOwnersModal: React.FC<PreviousOwnersModalProps> = ({
	isOpen,
	onClose,
	owners,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-[rgba(0,0,0,0.65)] flex justify-center items-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
				<h2 className="text-xl font-semibold mb-4 text-gray-800">
					Previous Owners
				</h2>
				{owners?.length === 0 ? (
					<p className="text-gray-600">No previous owners known.</p>
				) : (
					<div className="list-disc pl-5 text-gray-700">
						{owners?.map((owner, index) => (
							<p key={`${owner}`}>- &nbsp;{owner}</p>
						))}
					</div>
				)}

				<div className="flex justify-end mt-6">
					<button
						type="button"
						className="px-4 py-2 text-sm bg-gray-300 rounded hover:bg-gray-400 transition"
						onClick={onClose}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};
