import { Fragment, useCallback, useEffect, useState } from "react";
import axiosInstance from "../../../config/axios";
import LoadingWithoutText from "../admin/layouts/LoadingWithoutText";

export default function TableAtk(props: any) {
    const [data, setReagen] = useState<any>()
    const [valuePerPage, setValuePerPage] = useState('5')
    const [nameToSearch, setNameToSearch] = useState('')

    const getData = useCallback(async (url = `${props.url}?value_per_page=${valuePerPage}&name=${nameToSearch}&page=${data?.current_page}`) => {
        const res = await axiosInstance.get(url)

        setReagen(res.data);
    }, [valuePerPage, data, nameToSearch, props])

    useEffect(() => {
        getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valuePerPage, nameToSearch])

    const items = () => {
        let number = 1

        if (data?.current_page !== 1) {
            number = (data?.current_page - 1) * parseInt(valuePerPage) + 1
        }
        return data?.data?.map((item: any, index: number) => {
            return (
                <tr key={index}>
                    <td>{number++}</td>
                    <td>{item.name}</td>
                    <td>{item.satuan}</td>
                    <td>{item.stock}</td>
                    <td>{item.description}</td>
                </tr>
            )
        })
    }

    return !data ? <LoadingWithoutText />
        : (
            <>
                <h2 className="text-2xl sm:text-3xl xl:text-5xl my-2">{props.title}</h2>
                <div className="table-header flex">
                    <select className="block my-2 p-2 [&>option]:p-2 rounded focus:outline-quaternary border border-quaternary bg-primary" name="value-per-page"
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
                        <tr className="bg-secondary [&>th]:p-2">
                            <th>No</th>
                            <th>Nama</th>
                            <th>Satuan</th>
                            <th>Stok</th>
                            <th>Keterangan</th>
                        </tr>
                    </thead>
                    <tbody className="[&_td]:border [&_td]:border-quaternary [&_td]:px-2 [&_td]:py-1">
                        {data && items()}
                    </tbody>
                </table>
                <div className="table-footer flex items-center">
                    <div className="grow">
                        {data?.links?.map((item: any, i: number) => {
                            let { url, label, active } = item

                            // remove words 'Previous' and 'Next'
                            label = label === '&laquo; Previous' ? "<"
                                : label === 'Next &raquo;' ? '>' : label

                            let disabled = data.current_page === data.last_page && label === '>'
                                || data.current_page === 1 && label === '<'


                            const isShowLink =
                                label == '<' ||
                                label == '>' ||
                                label == '1' || //first page
                                label == data.current_page ||
                                // label == data.current_page + 1 ||
                                // label == data.last_page - 1 ||
                                label == data.last_page

                            return isShowLink ? (
                                <Fragment key={i}>
                                    <button className={`p-2 rounded py-1 mx-[.1rem] my-2 ${active ? 'bg-teriary' : disabled ? 'bg-gray-200 text-gray-400' : 'bg-secondary '}`}
                                        dangerouslySetInnerHTML={{ __html: label }
                                        }
                                        onClick={() => getData(url)}
                                        disabled={disabled}
                                    />
                                </Fragment >
                            ) : (label >= data.current_page && label <= data.last_page) ? <span key={i} className="align-bottom">.</span>
                                : null
                        })}
                    </div>
                    <div className="py-2 px-4 rounded bg-secondary">{`${data?.data?.length} dari ${data?.total} `}</div>
                </div>
            </>
        )
}