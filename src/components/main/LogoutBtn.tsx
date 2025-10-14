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
            className="flex items-center p-2"
            onClick={handleClick}
        >
            <span className="material-symbols-outlined">
                chip_extraction
            </span>
            <span>Logout</span>
        </button>
    )
}