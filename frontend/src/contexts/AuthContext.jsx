import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Mock initial login check
    useEffect(() => {
        const storedUser = localStorage.getItem('esntes_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (role) => {
        let mockUser = {
            id: 1,
            role: role,
            avatar: `https://ui-avatars.com/api/?name=${role}&background=random`
        };

        if (role === 'resident') {
            mockUser.name = 'John Doe';
            mockUser.address = '123 Maple St, Unit 4B';
        } else if (role === 'board') {
            mockUser.name = 'Jane Smith';
            mockUser.address = '100 Community Way, Office 1';
        } else if (role === 'super_admin') {
            mockUser.name = 'System Admin';
            mockUser.address = 'Global HQ';
        } else if (role === 'management_company') {
            mockUser.name = 'Prestige Management';
            mockUser.address = '500 Corporate Blvd';
        }

        setUser(mockUser);
        localStorage.setItem('esntes_user', JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('esntes_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
