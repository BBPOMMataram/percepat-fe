import { ReactNode } from "react"

type ModalProps = {
    open: boolean
    onClose: () => void
    children: ReactNode
}

export const ModalListBarangPermintaanPercepat = ({ open, onClose, children }: ModalProps) => {
    return (
        <div
            className={`
            fixed inset-0 z-50 flex items-center justify-center
            transition-opacity duration-200
            ${open ? 'opacity-100 visible' : 'opacity-0 invisible'}
          `}
        >
            {/* backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/40"
            />

            {/* modal */}
            <div
                className={`
              relative z-10 w-full max-w-2xl mx-2 rounded-lg bg-white p-5 shadow-lg
              transition-transform duration-200
              ${open ? 'scale-100' : 'scale-95'}
            `}
            >
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
                {children}
            </div>
        </div>
    )
}
