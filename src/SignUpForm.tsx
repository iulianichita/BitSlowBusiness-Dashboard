import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { fetchWithRefresh } from "./fetchWithRefresh";
import type { userData } from "./types";

export function SignUpForm({
	onAuthSuccess,
}: { onAuthSuccess: (user: userData) => void }) {
	const navigate = useNavigate();
	const [isRegistering, setIsRegistering] = useState(true); // true = Register, false = Login

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [address, setAddress] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	const resetForm = () => {
		setName("");
		setEmail("");
		setPassword("");
		setConfirmPassword("");
		setPhoneNumber("");
		setAddress("");
		setErrorMessage("");
		setSuccessMessage("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMessage("");
		setSuccessMessage("");

		if (isRegistering) {
			if (name[0] !== name[0]?.toUpperCase()) {
				setErrorMessage("Name should start with capital letter.");
				return;
			}
			if (!email.includes("@")) {
				setErrorMessage("Email should contain @ to be valid.");
				return;
			}
			if (password !== confirmPassword) {
				setErrorMessage("Passwords are not the same");
				return;
			}
			if (phoneNumber.length < 10) {
				setErrorMessage("Phone number must be at least 10 digits");
				return;
			}

			const response = await fetch("/api/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, password, phoneNumber, address }),
			});

			if (!response.ok) {
				setErrorMessage("Failed to register.");
			} else {
				setSuccessMessage("Client created successfully!");
				resetForm();

				const token = response.headers.get("Authentificate");
				if (token) {
					localStorage.setItem("authToken", token);

					const userResponse = await fetchWithRefresh("/api/protected", {
						method: "GET",
						headers: {
							Authentificate: token,
						},
					});

					if (userResponse.ok) {
						const data = await userResponse.json();
						onAuthSuccess(data.user);
						navigate("/profile");
					}
				}
			}
		} else {
			if (!email || !password) {
				setErrorMessage("Please enter both email and password.");
				return;
			}

			const response = await fetch("/api/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				setErrorMessage("Invalid login credentials.");
			} else {
				setSuccessMessage("Logged in successfully!");
				resetForm();

				const token = response.headers.get("Authentificate");
				if (token) {
					localStorage.setItem("authToken", token);

					const userResponse = await fetchWithRefresh("/api/protected", {
						method: "GET",
						headers: {
							Authentificate: token,
						},
					});

					if (userResponse.ok) {
						const data = await userResponse.json();
						onAuthSuccess(data.user);
						navigate("/profile");
					}
				}
			}
		}
	};

	return (
		<div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
			<div className="flex justify-center mb-6">
				<button
					type="button"
					onClick={() => setIsRegistering(true)}
					className={`px-4 py-2 rounded-l-md ${isRegistering ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"}`}
				>
					Register
				</button>
				<button
					type="button"
					onClick={() => setIsRegistering(false)}
					className={`px-4 py-2 rounded-r-md ${!isRegistering ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"}`}
				>
					Login
				</button>
			</div>

			<h3 className="text-2xl font-semibold text-center mb-4">
				{isRegistering ? "Sign Up" : "Sign In"}
			</h3>

			{errorMessage && (
				<p className="text-red-500 text-center mb-4">{errorMessage}</p>
			)}
			{successMessage && (
				<p className="text-green-500 text-center mb-4">{successMessage}</p>
			)}

			<form onSubmit={handleSubmit}>
				{isRegistering && (
					<div className="mb-4">
						<label
							htmlFor="name"
							className="block text-sm font-medium text-gray-700"
						>
							Name
						</label>
						<input
							type="text"
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						/>
					</div>
				)}

				<div className="mb-4">
					<label
						htmlFor="email"
						className="block text-sm font-medium text-gray-700"
					>
						Email
					</label>
					<input
						type="email"
						id="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				<div className="mb-4">
					<label
						htmlFor="password"
						className="block text-sm font-medium text-gray-700"
					>
						Password
					</label>
					<input
						type="password"
						id="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					/>
				</div>

				{isRegistering && (
					<>
						<div className="mb-4">
							<label
								htmlFor="confirmPassword"
								className="block text-sm font-medium text-gray-700"
							>
								Confirm Password
							</label>
							<input
								type="password"
								id="confirmPassword"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
						<div className="mb-4">
							<label
								htmlFor="phoneNumber"
								className="block text-sm font-medium text-gray-700"
							>
								Phone Number
							</label>
							<input
								type="text"
								id="phoneNumber"
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.target.value)}
								required
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
						<div className="mb-4">
							<label
								htmlFor="address"
								className="block text-sm font-medium text-gray-700"
							>
								Address
							</label>
							<input
								type="text"
								id="address"
								value={address}
								onChange={(e) => setAddress(e.target.value)}
								required
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							/>
						</div>
					</>
				)}

				<button
					type="submit"
					className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
				>
					{isRegistering ? "Register" : "Login"}
				</button>
			</form>
		</div>
	);
}
