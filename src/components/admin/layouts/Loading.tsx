import { faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

export default function Loading() {
    const [mounded, setMounded] = useState(false);
    useEffect(() => {
        setMounded(true);
    }, []);
    return (
        <div className="text-center">
            {mounded && (
                <>
                    <FontAwesomeIcon icon={faSun} className="text-4xl mt-24 mb-6 text-quaternary animate-spin" />
                    <div>Terimakasih atas kesabaran Anda menunggu ^^</div>
                </>
            )}
        </div>
    )
}