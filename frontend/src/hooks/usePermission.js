import { useAuth } from '../contexts/AuthContext';

export const usePermission = (permissionName) => {
    const { user } = useAuth();

    if (!user || !user.permissions) return false;

    if (Array.isArray(permissionName)) {
        return permissionName.some(p => user.permissions.includes(p));
    }

    return user.permissions.includes(permissionName);
};
