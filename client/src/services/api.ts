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

import { useToastStore } from "../stores/toast.store";

// Global Error Handling
api.interceptors.response.use(
	(response) => response,
	(error) => {
		const toastStore = useToastStore();

		if (error.response) {
			const message = error.response.data?.error || "An unexpected error occurred.";
			toastStore.add(message, 'error');

			if (error.response.status === 401) {
				// Token invalid or expired
				localStorage.removeItem("authToken");
				// Force redirect to login (avoiding router circular dependency)
				if (window.location.pathname !== '/') {
					window.location.href = "/";
				}
			}
		} else {
			toastStore.add("Network Error. Please check your connection.", 'error');
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
	palette?: string[];
	width?: number;
	height?: number;
}) => api.post<ILobby>("/lobbies", data);

export const deleteLobby = (id: string) => api.delete<{ message: string }>(`/lobbies/${id}`);

export const exportLobbyImage = (id: string, scale: number = 1) =>
	api.get(`/lobbies/${id}/image`, {
		params: { scale },
		responseType: 'blob'
	});

export const kickUser = (lobbyId: string, userId: string) =>
	api.post<{ message: string }>(`/lobbies/${lobbyId}/kick`, { targetUserId: userId });

export const banUser = (lobbyId: string, userId: string) =>
	api.post<{ message: string }>(`/lobbies/${lobbyId}/ban`, { targetUserId: userId });

export default api;
