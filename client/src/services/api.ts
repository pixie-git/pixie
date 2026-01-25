import axios, { type AxiosInstance } from "axios"

const api: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "http://localhost:3000/api",
})

// Add token to all requests if it exists
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("authToken")
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

// Global Error Handling
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response && (error.response.status === 401 || error.response.status === 403)) {
			// Token invalid or expired
			localStorage.removeItem("authToken");
			// Force redirect to login (avoiding router circular dependency)
			window.location.href = "/";
		}
		return Promise.reject(error);
	}
)


import { ILobby } from "../types";

export const getLobbies = () => api.get<ILobby[]>("/lobbies");
export const getLobbyById = (id: string) => api.get<ILobby>(`/lobbies/${id}`);
export const createLobby = (data: {
	name: string;
	ownerId?: string;
	description?: string;
	maxCollaborators?: number;
	palette?: string;
	width?: number;
	height?: number;
}) => api.post<ILobby>("/lobbies", data);

export default api;
