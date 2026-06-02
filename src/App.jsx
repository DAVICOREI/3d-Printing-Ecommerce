import { useState, useEffect } from "react";
// Importando as ferramentas de rota
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import MeusPedidos from "./pages/MeusPedidos";
import "./App.css";

function App() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState(() => {
    const carrinhoSalvo = localStorage.getItem("carrinhoEcommerce");
    return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
  });

  useEffect(() => {
    fetch("http://localhost:8080/api/produtos")
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

  const finalizarCompra = () => {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }

    const pedidoParaEnviar = {
      usuarioId: 1,
      total: valorTotal,
      itens: carrinho.map((item) => ({
        produto: { id: item.id },
        quantidade: item.quantidade,
        precoUnitario: item.precoVenda,
      })),
    };

    fetch("http://localhost:8080/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedidoParaEnviar),
    })
      .then((response) => {
        if (response.ok) {
          alert(
            "🎉 Pedido finalizado com sucesso! Indo para a fila de impressão 3D.",
          );
          setCarrinho([]);
          localStorage.removeItem("carrinhoEcommerce");
        } else {
          alert("Erro ao processar o pedido. Tente novamente.");
        }
      })
      .catch((error) => console.error("Erro:", error));
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
              <div className="painel-admin">
                <p>💰 Lucro: R$ {produto.lucroEstimado.toFixed(2)}</p>
                <small>
                  (Custo mat: R$ {produto.custoProducao.toFixed(2)})
                </small>
              </div>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
