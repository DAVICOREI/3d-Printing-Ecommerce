import { useState, useEffect } from "react";
// Importando as ferramentas de rota
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import MeusPedidos from "./pages/MeusPedidos";
import Admin from "./pages/Admin";
import "./App.css";
import Login from "./pages/Login";
import ProtectedRoute from "./Components/ProtectedRoute"; // ou "./components/ProtectedRoute"

function App() {
  const isAdmin = localStorage.getItem("tokenAdmin") !== null;

  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState(() => {
    const carrinhoSalvo = localStorage.getItem("carrinhoEcommerce");
    return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
  });

  useEffect(() => {
    fetch("https://threed-printing-api-fv1h.onrender.com/api/produtos")
      .then((response) => response.json())
      .then((data) => setProdutos(data))
      .catch((error) =>
        console.error("Erro ao buscar produtos da API:", error),
      );
  }, []);

  useEffect(() => {
    localStorage.setItem("carrinhoEcommerce", JSON.stringify(carrinho));
  }, [carrinho]);

  const adicionarAoCarrinho = (produto) => {
    const itemExistente = carrinho.find((item) => item.id === produto.id);
    if (itemExistente) {
      const carrinhoAtualizado = carrinho.map((item) =>
        item.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item,
      );
      setCarrinho(carrinhoAtualizado);
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
    }
  };

  const valorTotal = carrinho.reduce(
    (total, item) => total + item.precoVenda * item.quantidade,
    0,
  );

  const finalizarCompra = async () => {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }

    try {
      // 1. Avisa o Java para gerar o link de pagamento do Mercado Pago
      const response = await fetch(
        "https://threed-printing-api-fv1h.onrender.com/api/checkout/pagar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Nota: Futuramente enviaremos o 'carrinho' aqui no body para calcular o valor dinâmico.
          // Por enquanto, o Java vai gerar aquele link de teste de R$ 150,00 que configuramos.
        },
      );

      const data = await response.json();

      // 2. Se o Java devolver a URL oficial do Mercado Pago...
      if (data.url) {
        // Limpa o carrinho local pois o cliente já vai para o pagamento
        setCarrinho([]);
        localStorage.removeItem("carrinhoEcommerce");

        // 3. A MÁGICA: Redireciona a aba do cliente para o ambiente seguro do Mercado Pago!
        window.location.href = data.url;
      } else {
        alert("Erro ao gerar link de pagamento no Mercado Pago.");
      }
    } catch (error) {
      console.error("Erro ao conectar com a API de Checkout:", error);
      alert("Servidor de pagamentos indisponível no momento.");
    }
  };

  // O componente interno que representa a Vitrine
  const Vitrine = () => (
    <div className="container">
      <header className="cabecalho">
        <h1>Loja de Decoração 3D</h1>
        <p>Peças exclusivas fabricadas sob demanda</p>

        <div className="resumo-carrinho">
          <span>
            🛒 Itens: {carrinho.reduce((acc, item) => acc + item.quantidade, 0)}{" "}
            | Total: R$ {valorTotal.toFixed(2)}
          </span>
          <button className="btn-finalizar" onClick={finalizarCompra}>
            Finalizar Compra
          </button>
        </div>

        {/* Link de navegação para a nova tela */}
        <div style={{ marginTop: "20px" }}>
          <Link to="/pedidos" className="btn-comprar">
            Ver Meus Pedidos 📦
          </Link>
        </div>
      </header>

      <main className="vitrine">
        {produtos.length === 0 ? (
          <p>Carregando produtos da impressora...</p>
        ) : (
          produtos.map((produto) => (
            <div key={produto.id} className="card-produto">
              {/* O React verifica se a URL existe antes de tentar mostrar a imagem */}
              {produto.urlImagem && (
                <img
                  src={produto.urlImagem}
                  alt={produto.nome}
                  className="produto-imagem"
                />
              )}
              <h2>{produto.nome}</h2>
              <p className="descricao">{produto.descricao}</p>
              <div className="detalhes-tecnicos">
                <span>🛠️ {produto.material}</span>
                <span>⏱️ {produto.tempoImpressaoHoras}h</span>
              </div>
              <h3 className="preco">R$ {produto.precoVenda.toFixed(2)}</h3>
              /* Painel de Lucro (Visão do Admin) */
              {isAdmin && (
                <div className="painel-admin">
                  <p>💰 Lucro: R$ {produto.lucroEstimado.toFixed(2)}</p>
                  <small>
                    (Custo mat: R$ {produto.custoProducao.toFixed(2)})
                  </small>
                </div>
              )}
              <button
                className="btn-comprar"
                onClick={() => adicionarAoCarrinho(produto)}
              >
                Adicionar ao Carrinho
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  );

  // Aqui o BrowserRouter gerencia quem aparece na tela
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Vitrine />} />
        <Route path="/pedidos" element={<MeusPedidos />} />
        <Route path="/login" element={<Login />} />

        {/* A rota admin agora está TRANCADA dentro do ProtectedRoute */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
