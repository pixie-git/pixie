import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios"

// Extend Axios Request Config to support custom flags
declare module 'axios' {
	export interface AxiosRequestConfig {
		skipGlobalErrorHandler?: boolean;
	}
}

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
		// Check if the request explicitly asked to skip global error handling
		if (error.config && error.config.skipGlobalErrorHandler) {
			return Promise.reject(error);
		}

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


import { ILobby, INotification } from "../types";

export const getLobbies = (config?: AxiosRequestConfig) => api.get<ILobby[]>("/lobbies", config);
export const getLobbyById = (id: string, config?: AxiosRequestConfig) => api.get<ILobby>(`/lobbies/${id}`, config);

export const createLobby = (data: {
	name: string;
	ownerId?: string;
	description?: string;
	maxCollaborators?: number;
	palette?: string[];
	width?: number;
	height?: number;
}, config?: AxiosRequestConfig) => api.post<ILobby>("/lobbies", data, config);

export const deleteLobby = (id: string, config?: AxiosRequestConfig) => api.delete<{ message: string }>(`/lobbies/${id}`, config);

export const exportLobbyImage = (id: string, scale: number = 1, config?: AxiosRequestConfig) =>
	api.get(`/lobbies/${id}/image`, {
		params: { scale },
		responseType: 'blob',
		...config
	});

export const kickUser = (lobbyId: string, userId: string, config?: AxiosRequestConfig) =>
	api.post<{ message: string }>(`/lobbies/${lobbyId}/kick`, { targetUserId: userId }, config);

export const banUser = (lobbyId: string, userId: string, config?: AxiosRequestConfig) =>
	api.post<{ message: string }>(`/lobbies/${lobbyId}/ban`, { targetUserId: userId }, config);

export const getNotifications = (config?: AxiosRequestConfig) => api.get<INotification[]>("/notifications", config);
export const markNotificationAsRead = (id: string, config?: AxiosRequestConfig) => api.put(`/notifications/${id}/read`, {}, config);
export const markAllNotificationsAsRead = (config?: AxiosRequestConfig) => api.put("/notifications/read-all", {}, config);

export default api;
