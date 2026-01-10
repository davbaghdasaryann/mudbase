interface UserRoleData {
    id: string;
    name: string;
}

export type UserRole = 'R' | 'A' | "S" | "X"


export const userRoles: UserRoleData[] = [
    {
        id: "R",
        name: "Regular",
    },
    {
        id: "A",
        name: "Admin",
    },
    {
        id: "S",
        name: "Super Admin",
    },
    {
        id: "X",
        name: "Dev",
    },


]
