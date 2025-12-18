import Settings from "@/components/main/user-area/settings/Settings";
import { User } from "@/types/auth";

export default function AdminSettingsBestEmployee({ user }: { user: User }) {
    return <Settings user={user} />
}