import VideoMaklumat from "./VideoMaklumat";

export default function VideoMaklumatSection() {
    return (
        <div className="flex flex-col justify-center p-4 w-full">
            <div>
                <h2 className="text-3xl font-bold text-center mb-14">Maklumat Pelayanan Publik</h2>
            </div>
            <VideoMaklumat />
        </div>
    )
}