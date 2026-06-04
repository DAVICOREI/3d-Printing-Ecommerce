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
  // Guarda qual material o cliente escolheu para cada produto
  const [materialSelecionado, setMaterialSelecionado] = useState({});
  const handleMaterialChange = (produtoId, material) => {
    setMaterialSelecionado({ ...materialSelecionado, [produtoId]: material });
  };
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
    // 1. Pega a lista de materiais que vieram do banco (ex: "PLA, PETG") e transforma em uma lista (Array)
    const opcoesMaterial = produto.material.split(",").map((m) => m.trim());

    // 2. Descobre qual material o cliente escolheu. Se não mexeu, pega o primeiro da lista por padrão
    const escolhido = materialSelecionado[produto.id] || opcoesMaterial[0];

    // 3. Cria um ID único para o carrinho (ex: "1-PLA")
    const cartItemId = `${produto.id}-${escolhido}`;

    const itemExistente = carrinho.find(
      (item) => item.cartItemId === cartItemId,
    );

    if (itemExistente) {
      const carrinhoAtualizado = carrinho.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantidade: item.quantidade + 1 }
          : item,
      );
      setCarrinho(carrinhoAtualizado);
    } else {
      // Adiciona o produto no carrinho junto com a etiqueta do material exato que foi escolhido
      setCarrinho([
        ...carrinho,
        { ...produto, cartItemId, materialEscolhido: escolhido, quantidade: 1 },
      ]);
    }
  };

  // Função exclusiva do Admin para deletar um produto
  const deletarProduto = async (id) => {
    // Confirmação de segurança para evitar cliques acidentais
    if (
      !window.confirm("🚨 Tem certeza que deseja deletar este modelo da loja?")
    )
      return;

    try {
      const response = await fetch(
        `https://threed-printing-api-fv1h.onrender.com/api/produtos/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("tokenAdmin")}`,
          },
        },
      );

      if (response.ok) {
        // Atualiza a tela instantaneamente removendo o produto deletado
        setProdutos(produtos.filter((produto) => produto.id !== id));
        alert("Produto removido com sucesso!");
      } else {
        alert("Erro ao deletar. O seu token pode estar expirado.");
      }
    } catch (error) {
      console.error("Erro ao deletar o produto:", error);
      alert("Erro de conexão com o servidor.");
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

        <div
          className="resumo-carrinho"
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#222",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>
              🛒 Itens:{" "}
              {carrinho.reduce((acc, item) => acc + item.quantidade, 0)} |
              Total: R$ {valorTotal.toFixed(2)}
            </span>
            <button className="btn-finalizar" onClick={finalizarCompra}>
              Finalizar Compra
            </button>
          </div>

          {/* --- NOVA LISTA VISUAL DO CARRINHO --- */}
          {carrinho.length > 0 && (
            <div
              style={{
                backgroundColor: "#1e1e1e",
                padding: "15px",
                borderRadius: "8px",
                textAlign: "left",
                border: "1px solid #333",
              }}
            >
              <h3
                style={{
                  margin: "0 0 10px 0",
                  paddingBottom: "5px",
                  borderBottom: "1px solid #444",
                }}
              >
                Seu Pedido:
              </h3>

              {carrinho.map((item) => (
                <div
                  key={item.cartItemId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px dashed #333",
                    padding: "10px 0",
                  }}
                >
                  <div>
                    <p style={{ fontWeight: "bold", margin: "0" }}>
                      {item.nome}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#aaa",
                        margin: "2px 0",
                      }}
                    >
                      🛠️ Material:{" "}
                      <span style={{ color: "#fff" }}>
                        {item.materialEscolhido}
                      </span>
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0", fontSize: "14px" }}>
                      {item.quantidade}x R$ {item.precoVenda.toFixed(2)}
                    </p>
                    <p
                      style={{
                        margin: "0",
                        fontWeight: "bold",
                        color: "#4caf50",
                      }}
                    >
                      R$ {(item.precoVenda * item.quantidade).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* -------------------------------------- */}
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
              <div
                className="detalhes-tecnicos"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  margin: "10px 0",
                }}
              >
                {/* Menu interativo de seleção de materiais */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "14px",
                  }}
                >
                  <span>🛠️ Material:</span>
                  <select
                    value={
                      materialSelecionado[produto.id] ||
                      produto.material.split(",")[0].trim()
                    }
                    onChange={(e) =>
                      handleMaterialChange(produto.id, e.target.value)
                    }
                    style={{
                      padding: "5px",
                      borderRadius: "5px",
                      backgroundColor: "#333",
                      color: "#fff",
                      border: "1px solid #555",
                      cursor: "pointer",
                    }}
                  >
                    {/* Pega a string "PLA, PETG", corta nas vírgulas e cria uma <option> para cada */}
                    {produto.material.split(",").map((mat, index) => (
                      <option key={index} value={mat.trim()}>
                        {mat.trim()}
                      </option>
                    ))}
                  </select>
                </label>

                <span>⏱️ {produto.tempoImpressaoHoras}h de impressão</span>
              </div>
              <h3 className="preco">R$ {produto.precoVenda.toFixed(2)}</h3>
              {isAdmin && (
                /* Painel de Lucro e Controles (Visão do Admin) */
                <div
                  className="painel-admin"
                  style={{
                    backgroundColor: "#2a2a2a",
                    padding: "10px",
                    marginTop: "10px",
                    borderRadius: "5px",
                    border: "1px dashed #ff9800",
                  }}
                >
                  <p style={{ margin: "0" }}>
                    💰 Lucro: R$ {produto.lucroEstimado.toFixed(2)}
                  </p>
                  <small style={{ color: "#aaa" }}>
                    (Custo mat: R$ {produto.custoProducao.toFixed(2)})
                  </small>

                  {/* --- BOTÃO DE DELETAR --- */}
                  <button
                    onClick={() => deletarProduto(produto.id)}
                    style={{
                      width: "100%",
                      marginTop: "10px",
                      backgroundColor: "transparent",
                      border: "1px solid #f44336",
                      color: "#f44336",
                      padding: "5px",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                  >
                    🗑️ Deletar Modelo
                  </button>
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
