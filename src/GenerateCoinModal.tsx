import React from "react";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (amount: number) => void;
}

export const GenerateCoinModal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
}) => {
	const [amount, setAmount] = React.useState<number>(0);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-[rgba(0,0,0,0.65)] flex justify-center items-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
				<h2 className="text-xl font-semibold mb-4 text-gray-800">
					A new BitSlow coin will be generated...
				</h2>

				<label
					htmlFor="amount"
					className="block mb-2 text-sm font-medium text-gray-700"
				>
					Enter the value for the new BitSlow coin:
				</label>
				<input
					id="amount"
					type="number"
					className="w-full border rounded px-3 py-2 mb-4"
					value={amount}
					onChange={(e) => setAmount(Number(e.target.value))}
					placeholder="Ex: 30000"
				/>

				<div className="flex justify-end gap-x-3">
					<button
						type="button"
						className="px-4 py-2 text-sm bg-gray-300 rounded hover:bg-gray-400 transition"
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						type="submit"
						className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
						onClick={() => {
							onSubmit(amount);
							onClose();
						}}
					>
						Generate
					</button>
				</div>
			</div>
		</div>
	);
};
