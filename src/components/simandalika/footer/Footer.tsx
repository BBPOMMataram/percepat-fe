import FooterBottomSiMandalika from "./FooterBottom";

export default function Footer() {
    return (
        <footer className="bg-gray-900/20">
            <div className="py-8 px-12 border-t-2 border-t-teal-100">
                <h2 className="text-center text-xl mb-3">Links</h2>
                <ul className="grid grid-cols-3 gap-4 text-center [&>li]:underline text-sm">
                    <li><a href="https://siasn.pom.go.id/">SIASN</a></li>
                    <li><a href="https://srikandi.arsip.go.id/">SRIKANDI</a></li>
                    <li><a href="https://mail.pom.go.id/">EMAIL POM</a></li>
                    <li><a href="https://sipt.pom.go.id/">SIPT</a></li>
                    <li><a href="https://sakti.kemenkeu.go.id/">SAKTI</a></li>
                </ul>
            </div>
            <FooterBottomSiMandalika />
        </footer>
    )
}