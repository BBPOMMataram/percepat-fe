export default function VideoMaklumat() {
    return (
        <div className="relative w-full md:w-[569px] md:mx-auto lg:w-[682px] pt-[56.25%] md:pt-[45%] lg:pt-[40%]">
            <iframe
                loading="lazy"
                className="absolute top-0 left-0 w-full h-full md:h-80 lg:h-96 rounded"
                src="https://www.youtube.com/embed/CIWgXbGpdjA?&loop=1&playlist=CIWgXbGpdjA"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        </div>
    )
}