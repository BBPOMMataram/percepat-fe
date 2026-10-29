export interface AppData {
    id: number,
    name: string,
    link: string,
    desc: string,
    logo_path: string,
    pic: string,
    pics?: string[],
    users?: {
        id: string,
        name: string,
        call_name?: string | null,
    }[],
    clicks: number,
    expanation_name?: string,
}
