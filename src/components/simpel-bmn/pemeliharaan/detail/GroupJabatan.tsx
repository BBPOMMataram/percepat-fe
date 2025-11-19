export default function GroupJabatan(disposisi: any) {
    const groupJabatan = disposisi?.disposisi?.from_user?.auth_user?.employee?.group_jabatan.name || '';
    const isPetugasBmn = disposisi?.disposisi?.from_user?.auth_user?.employee?.petugas_bmn?.name;
    const isKatimPengujian = disposisi?.disposisi?.from_user?.auth_user?.employee?.is_katim_pengujian;

    return <div className="text-xs uppercase font-semibold opacity-60">
        {`${isKatimPengujian ? 'Katim Pengujian' : isPetugasBmn ? `Petugas ${isPetugasBmn}` : groupJabatan}`}
    </div>
}