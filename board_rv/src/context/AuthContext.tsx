import { createContext, useContext, useState, useEffect } from 'react';

// 사용자 인증 정보를 담는 타입
interface AuthUser {
    id: string;
    userId: string; 
    nickname: string;
    type: string;
    team?: string;
}

// 인증 컨텍스트에서 제공하는 값의 타입
interface AuthContextType {
    isLoggedIn: boolean;
    user: AuthUser | null;
    login: (token: string, userData: AuthUser) => void;
    logout: () => void;
}

// 인증 컨텍스트 생성, 기본값은 비로그인 상태
const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    user: null,
    login: () => {},
    logout: () => {},
});

// 인증 상태를 관리하는 Provider 컴포넌트
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [user, setUser] = useState<AuthUser | null>(null);

    // 마운트 시 localStorage에서 사용자 정보 복원
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // 로그인 시 토큰과 사용자 정보를 저장
    const login = (token: string, userData: AuthUser) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    // 로그아웃 시 정보 삭제 및 메인으로 이동
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = "/";
    };

    // 컨텍스트 값 제공
    return (
        <AuthContext.Provider value={{isLoggedIn: !!user, user, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};

// 인증 컨텍스트를 사용하는 커스텀 훅
export const useAuth = () => useContext(AuthContext);