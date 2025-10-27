import Settings from "@/components/main/user-area/settings/Settings";
import { User } from "@/types/auth";

export default function AdminSettingsSiapMelayani({ user }: { user: User }) {
    return <Settings user={user} />
}