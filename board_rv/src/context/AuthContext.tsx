import { createContext, useContext, useState, useEffect } from 'react';

interface AuthUser {
    id: string; // 오브젝트ID (더 이상 사용 X)
    userId: string; // 실제 로그인 아이디 (문자열)
    nickname: string;
    type: string;
    team?: string; // team 필드 포함 필요!
}

interface AuthContextType {
    isLoggedIn: boolean;
    user: AuthUser | null;
    login: (token: string, userData: AuthUser) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    user: null,
    login: () => {
    },
    logout: () => {
    },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (token: string, userData: AuthUser) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{isLoggedIn: !!user, user, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

// Example function where the suggested code change would be applied
const updatePassword = async (oldPassword: string, newPassword: string) => {
    const response = await fetch('/api/update-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: user?.userId,
            old_password: oldPassword,
            new_password: newPassword,
            accountType: user?.type || "member", // user.type 사용
        }),
    });

    if (!response.ok) {
        throw new Error('Password update failed');
    }
};