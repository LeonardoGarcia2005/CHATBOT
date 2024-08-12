import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";

// Crear un contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para acceder al contexto de autenticación
export const useAuth = () => {
  return useContext(AuthContext);
};

// Proveedor de contexto de autenticación
export const AuthProvider = ({ children }) => {
  // Estado para almacenar el token desde localStorage
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // Estado para indicar si la autenticación está en progreso
  const [loading, setLoading] = useState(true);

  // Estado para verificar si el usuario está autenticado
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  // Función para manejar el registro e inicio de sesión
  const authenticate = (newToken, userInfo) => {
    console.log('procediendo a setear token: '+newToken);
    setToken(newToken);
    localStorage.setItem("token", newToken);
    //localStorage.setItem("user", JSON.stringify(userInfo));
    setIsAuthenticated(true);
  };

  // Función para cerrar sesión
  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
  };

  // Función para verificar la autenticación basada en el token
  const checkAuthentication = () => {
    const storedToken = localStorage.getItem("token");
    setIsAuthenticated(!!storedToken);
    setLoading(false);
  };

  // Efecto para verificar la autenticación al cargar la página
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Proporcionar el contexto de autenticación a los componentes hijos
  return (
    <AuthContext.Provider
      value={{ token, authenticate, logout, isAuthenticated, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// PropType para 'children' del componente 'AuthProvider'.
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
