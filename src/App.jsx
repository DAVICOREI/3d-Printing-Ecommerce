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

  // Função ativada quando o cliente digita o CEP
  const handleCepChange = (e) => {
    const cepDigitado = e.target.value.replace(/\D/g, ""); // Remove letras e traços
    setCepCliente(cepDigitado);

    // Se o CEP tiver 8 números, calculamos o frete
    if (cepDigitado.length === 8) {
      // Exemplo de regra: CEPs começando com 899 (Região de SMO/SC) pagam frete fixo de R$ 15
      if (cepDigitado.startsWith("899")) {
        setValorFrete(15.0);
      } else {
        // Resto do Brasil
        setValorFrete(35.0);
      }
    } else {
      setValorFrete(0); // Zera o frete se o CEP estiver incompleto
    }
  };

  // Função para o cliente remover um item do carrinho
  const removerDoCarrinho = (cartItemId) => {
    // Mantém no carrinho apenas os itens que tem o ID diferente do que foi clicado
    const carrinhoAtualizado = carrinho.filter(
      (item) => item.cartItemId !== cartItemId,
    );
    setCarrinho(carrinhoAtualizado);
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

  const finalizarCompra = () => {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }

    // Trava de segurança: obriga o cliente a se identificar e colocar um CEP válido
    if (!nomeCliente.trim() || cepCliente.length !== 8) {
      alert(
        "Por favor, preencha o seu nome e um CEP válido com 8 dígitos para calcularmos o frete.",
      );
      return;
    }

    const numeroWhatsApp = "5549984134646";

    // Calcula o Total com o Frete embutido
    const totalComFrete = valorTotal + valorFrete;

    // 1. Monta o cabeçalho da mensagem com a identificação do cliente
    let textoMensagem = `Olá! Meu nome é *${nomeCliente}* e gostaria de fazer uma encomenda (CEP: ${cepCliente}):\n\n`;

    // 2. Varre o carrinho e lista os itens um por um
    carrinho.forEach((item) => {
      textoMensagem += `▪️ ${item.quantidade}x ${item.nome} (${item.materialEscolhido}) - R$ ${(item.precoVenda * item.quantidade).toFixed(2)}\n`;
    });

    // 3. Adiciona o subtotal, frete, total geral e o rodapé
    textoMensagem += `\n📦 Subtotal: R$ ${valorTotal.toFixed(2)}`;
    textoMensagem += `\n🚚 Frete: R$ ${valorFrete.toFixed(2)}`;
    textoMensagem += `\n*💰 Valor Total: R$ ${totalComFrete.toFixed(2)}*`;
    textoMensagem +=
      "\n\nAguardo retorno para combinarmos o pagamento e a entrega!";

    // 4. Converte o texto para a URL
    const textoCodificado = encodeURIComponent(textoMensagem);
    const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${textoCodificado}`;

    // 5. Limpa os dados
    setCarrinho([]);
    setNomeCliente("");
    setCepCliente("");
    setValorFrete(0);
    localStorage.removeItem("carrinhoEcommerce");

    // 6. Abre o WhatsApp
    window.open(linkWhatsApp, "_blank");
  };

  // O componente interno que representa a Vitrine
  const Vitrine = () => (
    <div className="container">
      {/* --- FORMULÁRIO DE IDENTIFICAÇÃO E FRETE --- */}
      {carrinho.length > 0 && (
        <div
          style={{
            marginTop: "15px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            backgroundColor: "#1e1e1e",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #333",
          }}
        >
          <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>Seus Dados:</h3>
          <input
            type="text"
            placeholder="Seu Nome Completo"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "#333",
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
              border: "none",
              backgroundColor: "#333",
              color: "#fff",
            }}
          />

          {/* Mostra o valor do frete apenas quando o CEP for validado (8 dígitos) */}
          {valorFrete > 0 ? (
            <p
              style={{
                color: "#4caf50",
                fontWeight: "bold",
                margin: "5px 0 0 0",
              }}
            >
              🚚 Frete Calculado: R$ {valorFrete.toFixed(2)}
            </p>
          ) : cepCliente.length === 8 ? (
            <p
              style={{
                color: "#4caf50",
                fontWeight: "bold",
                margin: "5px 0 0 0",
              }}
            >
              🚚 Frete Grátis!
            </p>
          ) : null}
        </div>
      )}
      {/* ------------------------------------------- */}
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
                    gap: "15px",
                  }}
                >
                  {/* Lado Esquerdo: Nome e Material */}
                  <div style={{ flex: 1 }}>
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

                  {/* Lado Direito: Valores e Botão de Remover */}
                  <div
                    style={{
                      textAlign: "right",
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    <div>
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

                    {/* Botão da Lixeira */}
                    <button
                      onClick={() => removerDoCarrinho(item.cartItemId)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#f44336",
                        cursor: "pointer",
                        fontSize: "18px",
                        padding: "5px",
                      }}
                      title="Remover do carrinho"
                    >
                      🗑️
                    </button>
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

                {/* Exibe o tempo de impressão SOMENTE se for Admin */}
                {isAdmin && (
                  <span>⏱️ {produto.tempoImpressaoHoras}h de impressão</span>
                )}
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
        <Route path="/" element={Vitrine()} />
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
