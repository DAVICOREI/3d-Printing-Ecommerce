import { Navigate } from "react-router-dom";

// Esse componente "abraça" as rotas que precisam de proteção
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("tokenAdmin");

  // Se não tiver o token guardado no navegador, expulsa para a tela de login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Se tiver, deixa o componente (children) ser renderizado normalmente
  return children;
}

export default ProtectedRoute;
