import axios from "axios"

// Create an Axios instance with a base URL
const apiService = axios.create({
  baseURL: "https://maqsaddosh-backend-o2af.onrender.com/api", // Your backend API base URL
})

// Add a request interceptor to include the auth token in headers
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default apiService
