import { BiLoaderCircle } from "@react-icons/all-files/bi/BiLoaderCircle";

export default function Loading() {
    return (
        <div className="text-center">
            <BiLoaderCircle className="mx-auto mt-24 mb-6 text-5xl text-quaternary animate-spin"></BiLoaderCircle>
            <div>Terimakasih atas kesabaran Anda menunggu ;)</div>
        </div>
    )
}