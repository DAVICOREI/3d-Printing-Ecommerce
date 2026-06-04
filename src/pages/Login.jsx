import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Faz a requisição POST para o Java pedindo o Token
      const response = await fetch(
        "https://threed-printing-api-fv1h.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, senha }), // Envia os dados digitados
        },
      );

      if (response.ok) {
        // Se o Java aprovar, pegamos o Token que ele devolveu
        const data = await response.json();

        // Guardamos o Token REAL e criptografado no navegador
        localStorage.setItem("tokenAdmin", data.token);

        // Redireciona o Administrador para o painel
        navigate("/admin");
      } else {
        // Se o Java negar (Erro 401), avisamos na tela
        alert("Credenciais incorretas! Acesso negado pelo servidor.");
      }
    } catch (error) {
      console.error("Erro ao conectar com a API de login:", error);
      alert("Servidor indisponível no momento.");
    }
  };

  return (
    <div
      className="container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
      }}
    >
      <div
        style={{
          padding: "40px",
          backgroundColor: "#1e1e1e",
          borderRadius: "10px",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Acesso Restrito
        </h2>

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <label>
            E-mail:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
            />
          </label>

          <label>
            Senha:
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              style={{ width: "100%", padding: "10px", marginTop: "5px" }}
            />
          </label>

          <button
            type="submit"
            className="btn-finalizar"
            style={{ marginTop: "10px", padding: "12px" }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
