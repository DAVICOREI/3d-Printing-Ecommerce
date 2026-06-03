import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // TEMPORÁRIO: Simulando o login até conectarmos com o Java
    if (email === "admin@loja3d.com" && senha === "123456") {
      // Guarda um "passe de entrada" no navegador
      localStorage.setItem("tokenAdmin", "meu-token-secreto");
      navigate("/admin"); // Joga o usuário para o painel
    } else {
      alert("Credenciais incorretas!");
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
