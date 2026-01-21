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

export default api
