import { faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function LoadingWithoutText() {
    return (
        <div className="text-center">
            <FontAwesomeIcon icon={faSun} size="4x" className="mt-24 mb-6 text-quaternary" spin />
        </div>
    )
}