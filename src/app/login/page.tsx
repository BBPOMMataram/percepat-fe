import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
    title: 'Login',
    description: 'Login Form Aplikasi Percepat BBPOM di Mataram'
}

export default function Login() {
    return <>
        <AuthForm mode="login" />
    </>
}