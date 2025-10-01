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
                <label className="block text-sm font-medium text-gray-700">
                    NIM
                </label>
                <input
                    name="nim"
                    type="text"
                    className="ar-input-text-purple w-full"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Jurusan
                </label>
                <input
                    name="jurusan"
                    type="text"
                    className="ar-input-text-purple w-full"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Angkatan
                </label>
                <input
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