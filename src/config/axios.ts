import Axios from 'axios'
import Cookies from 'js-cookie'

const axios = Axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
})

// inject CSRF token dari cookie
axios.interceptors.request.use(config => {
    const token = Cookies.get('XSRF-TOKEN')
    if (token) {
        config.headers['X-XSRF-TOKEN'] = token
    }
    return config
})

export default axios
