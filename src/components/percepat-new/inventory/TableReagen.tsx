import { faBan, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Fragment, useCallback, useEffect, useState } from "react";
import axiosInstance from "../../../config/axios";
import LoadingWithoutText from "../admin/layouts/LoadingWithoutText";

export default function TableReagen(props: any) {
    const [reagen, setReagen] = useState<any>()
    const [valuePerPage, setValuePerPage] = useState('5')
    const [nameToSearch, setNameToSearch] = useState('')

    const getData = useCallback(async (url = `${props.url}?value_per_page=${valuePerPage}&name=${nameToSearch}&page=${reagen?.current_page}`) => {
        const { data } = await axiosInstance.get(url)

        setReagen(data);
    }, [valuePerPage, reagen, nameToSearch, props])

    useEffect(() => {
        getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valuePerPage, nameToSearch])

    const items = () => {
        let number = 1

        if (reagen?.current_page !== 1) {
            number = (reagen?.current_page - 1) * parseInt(valuePerPage) + 1
        }
        return reagen?.data?.map((item: any, index: number) => {
            return (
                <tr key={index}>
                    <td>{number++}</td>
                    <td>{item.name}</td>
                    <td>{item.satuan}</td>
                    <td>{new Date(item.expired).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td>{item.stock}</td>
                    <td className="text-center">{item.msds && <a href={item.msds} target="_blank"><FontAwesomeIcon icon={faExternalLinkAlt} className="text-quaternary" /></a> || <FontAwesomeIcon icon={faBan} className="text-red-500" />}</td>
                </tr>
            )
        })
    }

    return !reagen ? <LoadingWithoutText />
        : (
            <>
                <h2 className="text-2xl sm:text-3xl xl:text-5xl my-2">{props.title}</h2>
                <div className="table-header flex">
                    <select className="block my-2 p-2 [&>option]:p-2 rounded focus:outline-quaternary border border-quaternary" name="value-per-page"
                        value={valuePerPage}
                        onChange={e => setValuePerPage(e.target.value)}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                    <div className="search ml-auto">
                        <input type="text" className="p-2 border border-quaternary focus:outline-none"
                            placeholder="Cari berdasarkan nama"
                            value={nameToSearch}
                            onChange={e => setNameToSearch(e.target.value)}
                            onClick={(e: any) => e.target.select()}
                        />
                    </div>
                </div>
                <table className="w-full border-collapse">
                    <thead className="[&_th]:border [&_th]:border-quaternary text-left">
                        <tr className="bg-quaternary [&>th]:p-2">
                            <th>No</th>
                            <th>Nama</th>
                            <th>Satuan</th>
                            <th>Kedaluarsa</th>
                            <th>Stok</th>
                            <th>MSDS</th>
                        </tr>
                    </thead>
                    <tbody className="[&_td]:border [&_td]:border-quaternary [&_td]:px-2 [&_td]:py-1">
                        {items()}
                    </tbody>
                </table>
                <div className="table-footer flex items-center">
                    <div className="grow">
                        {reagen.links?.map((item: any, i: number) => {
                            let { url, label, active } = item

                            // remove words 'Previous' and 'Next'
                            label = label === '&laquo; Previous' ? "<"
                                : label === 'Next &raquo;' ? '>' : label

                            let disabled = reagen.current_page === reagen.last_page && label === '>'
                                || reagen.current_page === 1 && label === '<'


                            const isShowLink =
                                label == '<' ||
                                label == '>' ||
                                label == '1' || //first page
                                label == reagen.current_page ||
                                label == reagen.last_page

                            return isShowLink ? (
                                <Fragment key={i}>
                                    <button className={`p-2 rounded py-1 mx-[.1rem] my-2 ${active ? 'bg-quaternary' : disabled ? 'bg-gray-200 text-gray-400' : 'bg-quaternary '}`}
                                        dangerouslySetInnerHTML={{ __html: label }
                                        }
                                        onClick={() => getData(url)}
                                        disabled={disabled}
                                    />
                                </Fragment >
                            ) : (label >= reagen.current_page && label <= reagen.last_page) ? <span key={i} className="align-bottom">.</span>
                                : null
                        })}
                    </div>
                    <div className="py-2 px-4 rounded bg-quaternary">{`${reagen.data?.length} dari ${reagen.total}`}</div>
                </div>
            </>
        )
}