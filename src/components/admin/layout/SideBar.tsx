//sidebar
export default function Sidebar() {
    return (
        <div className="w-64 h-screen flex flex-col border-r border-bpom-green/20">
            <div className="p-4 border-b border-bpom-green/20">
                <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
            <nav className="flex-1 p-4">
                <ul>
                    <li className="mb-4">
                        <a href="/admin/dashboard" className="hover:underline">Dashboard</a>
                    </li>
                    <li className="mb-4">
                        <a href="/admin/users" className="hover:underline">Users</a>
                    </li>
                    <li className="mb-4">
                        <a href="/admin/settings" className="hover:underline">Settings</a>
                    </li>
                </ul>
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button className="w-full bg-red-700 hover:bg-red-800 text-white py-2 rounded">Logout</button>
            </div>
        </div>
    );
}