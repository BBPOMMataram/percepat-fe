import { AppSectionProps } from "@/types/app-data";
import AppContainer from "./AppContainer"

export default function AppSection({ appData }: AppSectionProps) {
    return (
        <>
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-4">INOVASI</h2>
                <p className="text-center text-lg mb-4">Inovasi - inovasi Balai Besar POM di Mataram</p>
            </div>
            <div className="flex items-center justify-around gap-20 flex-wrap">
                {appData.map((app, index) => (
                    <AppContainer key={index} appData={app} />
                ))}
            </div>
        </>
    )
}