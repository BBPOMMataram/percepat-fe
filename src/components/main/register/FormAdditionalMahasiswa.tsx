export default function FormRegisterAdditionalMahasiswa() {
    return (
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700 ar-label-required">
                    Universitas
                </label>
                <input
                    required
                    name="university"
                    type="text"
                    className="ar-input-text-purple w-full"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 ar-label-required">
                    NIM
                </label>
                <input
                    required
                    name="nim"
                    type="text"
                    className="ar-input-text-purple w-full"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 ar-label-required">
                    Jurusan
                </label>
                <input
                    required
                    name="jurusan"
                    type="text"
                    className="ar-input-text-purple w-full"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 ar-label-required">
                    Angkatan
                </label>
                <input
                    required
                    name="angkatan"
                    type="number"
                    className="ar-input-text-purple w-full"
                    min={new Date().getFullYear() - 7}
                    max={new Date().getFullYear()}
                    defaultValue={new Date().getFullYear() - 2}
                />
            </div>
        </>
    )
}