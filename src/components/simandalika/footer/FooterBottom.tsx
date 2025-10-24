import Social from "@/components/main/Social";

export default function FooterBottomSiMandalika() {
    return (
        <div className="p-4 grid sm:grid-cols-2 border-t-2 border-t-gray-400">
            <div className="socials flex items-center justify-center mb-4 sm:order-2">
                <Social />
            </div>
            <div className="flex items-center justify-center">
                <p className="text-sm text-gray-500">© 2021 - {new Date().getFullYear()} BBPOM di Mataram. All rights reserved.</p>
            </div>
        </div>
    )
}