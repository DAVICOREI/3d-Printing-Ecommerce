import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import MeusPedidos from "./pages/MeusPedidos";
import Admin from "./pages/Admin";
import "./App.css";
import Login from "./pages/Login";
import ProtectedRoute from "./Components/ProtectedRoute";

function App() {
  const isAdmin = localStorage.getItem("tokenAdmin") !== null;

  const [materialSelecionado, setMaterialSelecionado] = useState({});
  const handleMaterialChange = (produtoId, material) => {
    setMaterialSelecionado({ ...materialSelecionado, [produtoId]: material });
  };

  const [produtos, setProdutos] = useState([]);
  const [nomeCliente, setNomeCliente] = useState("");
  const [cepCliente, setCepCliente] = useState("");
  const [valorFrete, setValorFrete] = useState(0);
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
    const opcoesMaterial = produto.material.split(",").map((m) => m.trim());
    const escolhido = materialSelecionado[produto.id] || opcoesMaterial[0];
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
      setCarrinho([
        ...carrinho,
        { ...produto, cartItemId, materialEscolhido: escolhido, quantidade: 1 },
      ]);
    }
  };

  const handleCepChange = (e) => {
    const cepDigitado = e.target.value.replace(/\D/g, "");
    setCepCliente(cepDigitado);

    if (cepDigitado.length === 8) {
      if (cepDigitado.startsWith("899")) {
        setValorFrete(15.0);
      } else {
        setValorFrete(35.0);
      }
    } else {
      setValorFrete(0);
    }
  };

  const removerDoCarrinho = (cartItemId) => {
    const carrinhoAtualizado = carrinho.filter(
      (item) => item.cartItemId !== cartItemId,
    );
    setCarrinho(carrinhoAtualizado);
  };

  const deletarProduto = async (id) => {
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

  const finalizarCompra = () => {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }

    if (!nomeCliente.trim() || cepCliente.length !== 8) {
      alert(
        "Por favor, preencha o seu nome e um CEP válido com 8 dígitos para calcularmos o frete.",
      );
      return;
    }

    const numeroWhatsApp = "5549984134646";
    const totalComFrete = valorTotal + valorFrete;

    let textoMensagem = `Olá! Meu nome é *${nomeCliente}* e gostaria de fazer uma encomenda (CEP: ${cepCliente}):\n\n`;

    carrinho.forEach((item) => {
      textoMensagem += `▪️ ${item.quantidade}x ${item.nome} (${item.materialEscolhido}) - R$ ${(item.precoVenda * item.quantidade).toFixed(2)}\n`;
    });

    textoMensagem += `\n📦 Subtotal: R$ ${valorTotal.toFixed(2)}`;
    textoMensagem += `\n🚚 Frete: R$ ${valorFrete.toFixed(2)}`;
    textoMensagem += `\n*💰 Valor Total: R$ ${totalComFrete.toFixed(2)}*`;
    textoMensagem +=
      "\n\nAguardo retorno para combinarmos o pagamento e a entrega!";

    const textoCodificado = encodeURIComponent(textoMensagem);
    const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${textoCodificado}`;

    setCarrinho([]);
    setNomeCliente("");
    setCepCliente("");
    setValorFrete(0);
    localStorage.removeItem("carrinhoEcommerce");

    window.open(linkWhatsApp, "_blank");
  };

  const Vitrine = () => (
    <div className="container">
      <header className="cabecalho">
        {/* Adiciona a imagem da logo centralizada */}
        <img
          src="/logo.png"
          alt="Davi Ribeiro 3Decor"
          style={{
            width: "180px",
            height: "180px" /* Trava a altura igual à largura */,
            objectFit: "cover" /* Corta as sobras sem amassar a imagem */,
            borderRadius: "50%",
            marginBottom: "15px",
            boxShadow: "0 4px 15px rgba(212, 175, 55, 0.2)",
          }}
        />
        <h1 style={{ color: "#d4af37" }}>Davi Ribeiro 3Decor</h1>
        <p>Impressão 3D e Arte | Peças exclusivas sob demanda</p>

        {/* Resumo do Carrinho e Formulário agrupados */}
        <div
          className="resumo-carrinho"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            backgroundColor: "#1e1e1e",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #333",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <h3 style={{ margin: "0", color: "#fff", textAlign: "left" }}>
            🛒 Seu Carrinho
          </h3>

          {carrinho.length === 0 ? (
            <p style={{ color: "#aaa", textAlign: "left" }}>Carrinho vazio</p>
          ) : (
            <div style={{ textAlign: "left" }}>
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
                  <div style={{ flex: 1 }}>
                    <p
                      style={{ fontWeight: "bold", margin: "0", color: "#fff" }}
                    >
                      {item.nome}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#aaa",
                        margin: "2px 0",
                      }}
                    >
                      🛠️ {item.materialEscolhido}
                    </p>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    <div>
                      <p
                        style={{ margin: "0", fontSize: "14px", color: "#fff" }}
                      >
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
                    <button
                      onClick={() => removerDoCarrinho(item.cartItemId)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#f44336",
                        cursor: "pointer",
                        fontSize: "18px",
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulário de Identificação */}
          {carrinho.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <h4 style={{ margin: "0", color: "#fff", textAlign: "left" }}>
                Seus Dados para Envio:
              </h4>
              <input
                type="text"
                placeholder="Seu Nome Completo"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #444",
                  backgroundColor: "#222",
                  color: "#fff",
                }}
              />
              <input
                type="text"
                placeholder="Seu CEP (Apenas números)"
                value={cepCliente}
                onChange={handleCepChange}
                maxLength="8"
                style={{
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #444",
                  backgroundColor: "#222",
                  color: "#fff",
                }}
              />

              {valorFrete > 0 ? (
                <p
                  style={{
                    color: "#4caf50",
                    fontWeight: "bold",
                    margin: "0",
                    textAlign: "left",
                  }}
                >
                  🚚 Frete Calculado: R$ {valorFrete.toFixed(2)}
                </p>
              ) : cepCliente.length === 8 ? (
                <p
                  style={{
                    color: "#4caf50",
                    fontWeight: "bold",
                    margin: "0",
                    textAlign: "left",
                  }}
                >
                  🚚 Frete Grátis!
                </p>
              ) : null}
            </div>
          )}

          {/* Total e Botão Finalizar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "10px",
              borderTop: "1px solid #333",
              paddingTop: "15px",
            }}
          >
            <span
              style={{ fontSize: "18px", fontWeight: "bold", color: "#fff" }}
            >
              Total: R$ {(valorTotal + valorFrete).toFixed(2)}
            </span>
            <button
              className="btn-finalizar"
              onClick={finalizarCompra}
              disabled={carrinho.length === 0}
              style={{ opacity: carrinho.length === 0 ? 0.5 : 1 }}
            >
              Finalizar Compra
            </button>
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <Link
            to="/pedidos"
            className="btn-comprar"
            style={{
              background: "#555",
              display: "inline-block",
              textDecoration: "none",
              width: "auto",
              padding: "10px 20px",
            }}
          >
            Ver Meus Pedidos 📦
          </Link>
        </div>
      </header>

      <main className="vitrine">
        {produtos.length === 0 ? (
          <p style={{ color: "#fff" }}>Carregando produtos da impressora...</p>
        ) : (
          produtos.map((produto) => (
            <div key={produto.id} className="card-produto">
              {produto.urlImagem && (
                <img
                  src={produto.urlImagem}
                  alt={produto.nome}
                  className="produto-imagem"
                />
              )}
              <h2 style={{ color: "#222" }}>{produto.nome}</h2>
              <p className="descricao" style={{ color: "#555" }}>
                {produto.descricao}
              </p>

              <div
                className="detalhes-tecnicos"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  margin: "10px 0",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "14px",
                    color: "#222",
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
                      backgroundColor: "#eee",
                      color: "#222",
                      border: "1px solid #ccc",
                      cursor: "pointer",
                    }}
                  >
                    {produto.material.split(",").map((mat, index) => (
                      <option key={index} value={mat.trim()}>
                        {mat.trim()}
                      </option>
                    ))}
                  </select>
                </label>

                {isAdmin && (
                  <span style={{ color: "#555", fontSize: "14px" }}>
                    ⏱️ {produto.tempoImpressaoHoras}h de impressão
                  </span>
                )}
              </div>

              <h3 className="preco">R$ {produto.precoVenda.toFixed(2)}</h3>

              {isAdmin && (
                <div
                  className="painel-admin"
                  style={{
                    backgroundColor: "#2a2a2a",
                    padding: "10px",
                    marginTop: "auto",
                    marginBottom: "10px",
                    borderRadius: "5px",
                    border: "1px dashed #ff9800",
                    color: "#fff",
                  }}
                >
                  <p style={{ margin: "0" }}>
                    💰 Lucro: R$ {produto.lucroEstimado.toFixed(2)}
                  </p>
                  <small style={{ color: "#aaa" }}>
                    (Custo mat: R$ {produto.custoProducao.toFixed(2)})
                  </small>
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
                style={{ marginTop: isAdmin ? "0" : "auto" }}
              >
                Adicionar ao Carrinho
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={Vitrine()} />
        <Route path="/pedidos" element={<MeusPedidos />} />
        <Route path="/login" element={<Login />} />
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
