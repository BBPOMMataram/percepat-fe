import { AppData } from '@/types/app-data';
import Link from 'next/link';
import CardAppGreen from './CardAppGreen';
import VisitButton from './VisitButton';

const AppContainer = ({ appData }: { appData: AppData }) => {
    return (
        <>
            <div
                className="relative flex items-center gap-8 px-12 shadow-lg 
                bg-fixed bg-center bg-cover w-full mx-8 lg:mx-20 rounded-lg"
                style={{ backgroundImage: `url(${appData.logo_path})` }}
            >
                {/* Overlay gelap + blur */}
                <div className="absolute inset-0 glass z-0 rounded-lg"></div>
                {/* konten */}
                <div className="desc flex-1 relative z-10">
                    <h1 className="text-3xl font-bold mb-4">{appData.name}</h1>
                    <p className="text-lg">
                        {appData.desc}
                    </p>

                    <div className="mt-10">
                        {
                            // JIKA URL EXTERNAL MAKA GUNAKAN ANCHOR
                            // Jika link mengandung 'http', berarti itu adalah link eksternal
                            // Jika tidak, gunakan Link dari Next.js untuk navigasi internal
                            appData.link.includes('http') ? (
                                <a href={appData.link} target="_blank" rel="noopener noreferrer">
                                    <VisitButton />
                                </a>
                            ) : (
                                <Link href={appData.link}>
                                    <VisitButton />
                                </Link>
                            )
                        }
                    </div>
                </div>
                <div className="card-container flex-1 flex justify-center relative z-10">
                    <CardAppGreen appData={appData} />
                </div>
            </div>
        </>
    )
}

export default AppContainer