import axios, { type AxiosInstance } from "axios"

const api: AxiosInstance = axios.create({
	baseURL: "http://localhost:3000/api",
})

// Add token to all requests if it exists
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("authToken")
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})


import { ILobby } from "../types";

export const getLobbies = () => api.get<ILobby[]>("/lobbies");
export const getLobbyById = (id: string) => api.get<ILobby>(`/lobbies/${id}`);
export const createLobby = (name: string) => api.post<ILobby>("/lobbies", { name });

export default api;
