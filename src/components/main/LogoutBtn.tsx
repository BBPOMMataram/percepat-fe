import { showAlert } from "@/features/alertSlice"
import { logout } from "@/features/authSlice"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"

export default function LogoutBtn() {
    const dispatch = useDispatch()
    const router = useRouter()

    const handleClick = () => {
        dispatch(logout())
        dispatch(showAlert({ type: 'success', message: 'You have been logged out', description: 'logout success' }))
        router.push('/login')
    }

    return (
        <button
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow-md"
            onClick={handleClick}
        >
            Logout
        </button>
    )
}