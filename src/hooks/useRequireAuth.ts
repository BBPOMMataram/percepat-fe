// hooks/useRequireAuth.ts
import { showAlert } from '@/features/alertSlice'
import { getUser } from '@/features/authSlice'
import { AppDispatch, RootState } from '@/redux/store'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export function useRequireAuth() {
    const pathname = usePathname()
    const dispatch = useDispatch<AppDispatch>()
    const { user, loading } = useSelector((state: RootState) => state.auth)
    const router = useRouter()

    useEffect(() => {
        dispatch(getUser())
    }, [dispatch])

    useEffect(() => {
        if (loading) return
        if (!user) {
            dispatch(showAlert({ type: 'error', message: 'You are logged out', description: 'Please login first' }))
            router.push(`/login?redirectUrl=${pathname}`)
        }
    }, [user, loading, router, pathname, dispatch])

    return { user, loading, pathname }
}