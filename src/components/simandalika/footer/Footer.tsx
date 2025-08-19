import Social from "@/components/main/Social";

export default function Footer() {
    return (
        <>
            <div className="py-8 px-12 border-teal-100 border-t-2 border-double">
                <h2 className="text-center text-xl mb-3">Links</h2>
                <ul className="grid grid-cols-3 gap-4 text-center [&>li]:underline text-sm">
                    <li><a href="https://siasn.pom.go.id/">SIASN</a></li>
                    <li><a href="https://srikandi.arsip.go.id/">SRIKANDI</a></li>
                    <li><a href="https://mail.pom.go.id/">EMAIL POM</a></li>
                    <li><a href="https://sipt.pom.go.id/">SIPT</a></li>
                    <li><a href="https://sakti.kemenkeu.go.id/">SAKTI</a></li>
                </ul>
            </div>
            <div className='p-4 grid sm:grid-cols-2 border-t-2'>
                <div className="socials flex items-center justify-center mb-4 sm:order-2">
                    <Social />
                </div>
                <div className="flex items-center justify-center">
                    <p className="text-sm text-gray-500">© 2021 - {new Date().getFullYear()} BBPOM di Mataram. All rights reserved.</p>
                </div>
            </div>
        </>
    )
}