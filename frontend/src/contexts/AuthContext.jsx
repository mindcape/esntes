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
        const mockUser = {
            id: 1,
            name: role === 'resident' ? 'John Doe' : 'Jane Smith',
            role: role,
            address: role === 'resident' ? '123 Maple St, Unit 4B' : '100 Community Way, Office 1',
            avatar: `https://ui-avatars.com/api/?name=${role}&background=random`
        };
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
