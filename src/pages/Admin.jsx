import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function Admin() {
  const navigate = useNavigate();

  const [pedidosFila, setPedidosFila] = useState([]);

  // --- NOVOS ESTADOS PARA A FILA DE ESPERA MANUAL ---
  const [nomeClienteFila, setNomeClienteFila] = useState("");
  const [descricaoPedidoFila, setDescricaoPedidoFila] = useState("");
  const [filaEspera, setFilaEspera] = useState(() => {
    const filaSalva = localStorage.getItem("filaFabrica3D");
    return filaSalva ? JSON.parse(filaSalva) : [];
  });

  // Salva a fila manual automaticamente sempre que houver alterações
  useEffect(() => {
    localStorage.setItem("filaFabrica3D", JSON.stringify(filaEspera));
  }, [filaEspera]);

  useEffect(() => {
    const buscarFila = async () => {
      try {
        const response = await fetch(
          "https://threed-printing-api-fv1h.onrender.com/api/pedidos/admin",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("tokenAdmin")}`,
            },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setPedidosFila(data);
        }
      } catch (error) {
        console.error("Erro ao buscar fila de encomendas:", error);
      }
    };

    buscarFila();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tokenAdmin");
    navigate("/");
  };

  const [produto, setProduto] = useState({
    nome: "",
    descricao: "",
    material: [],
    tempoImpressaoHoras: "",
    pesoGramas: "",
    precoVenda: "",
    urlImagem: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduto({ ...produto, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    let novosMateriais = [...produto.material];

    if (checked) {
      novosMateriais.push(value);
    } else {
      novosMateriais = novosMateriais.filter((mat) => mat !== value);
    }

    setProduto({ ...produto, material: novosMateriais });
  };

  // --- REGRA DE NEGÓCIO DA IMPRESSÃO 3D ---
  const precoPorGrama = 130 / 1000;
  const custoMaterial = Number(produto.pesoGramas) * precoPorGrama;

  const custoPorHora = 1.5;
  const custoTempo = Number(produto.tempoImpressaoHoras) * custoPorHora;

  const custoProducaoCalculado = custoMaterial + custoTempo;
  const lucroEstimadoCalculado =
    Number(produto.precoVenda) - custoProducaoCalculado;

  // --- FUNÇÕES DA FILA DE ESPERA MANUAL ---
  const adicionarNaFila = () => {
    if (!nomeClienteFila.trim() || !descricaoPedidoFila.trim()) {
      alert("Por favor, preencha o nome do cliente e a descrição das peças.");
      return;
    }

    const novoPedido = {
      id: Date.now(),
      cliente: nomeClienteFila,
      descricao: descricaoPedidoFila,
      data:
        new Date().toLocaleDateString("pt-BR") +
        " às " +
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    };

    setFilaEspera([...filaEspera, novoPedido]);
    setNomeClienteFila("");
    setDescricaoPedidoFila("");
  };

  const concluirPedidoFila = (id) => {
    if (
      window.confirm(
        "Peça totalmente impressa? Deseja remover este pedido da fábrica?",
      )
    ) {
      setFilaEspera(filaEspera.filter((pedido) => pedido.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "https://threed-printing-api-fv1h.onrender.com/api/produtos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("tokenAdmin")}`,
          },
          body: JSON.stringify({
            nome: produto.nome,
            descricao: produto.descricao,
            material: produto.material.join(", "),
            tempoImpressaoHoras: Number(produto.tempoImpressaoHoras),
            precoVenda: Number(produto.precoVenda),
            urlImagem: produto.urlImagem,
            custoProducao: Number(custoProducaoCalculado.toFixed(2)),
          }),
        },
      );

      if (response.ok) {
        alert("🎉 Produto cadastrado com sucesso!");
        setProduto({
          nome: "",
          descricao: "",
          material: [],
          tempoImpressaoHoras: "",
          pesoGramas: "",
          precoVenda: "",
          urlImagem: "",
        });
      } else {
        alert("Erro ao cadastrar o produto.");
      }
    } catch (error) {
      console.error("Erro na API:", error);
    }
  };

  return (
    <div
      className="container"
      style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}
    >
      <header style={{ marginBottom: "30px", position: "relative" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            to="/"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Voltar para a Vitrine
          </Link>

          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #f44336",
              color: "#f44336",
              padding: "6px 15px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Sair 🔒
          </button>
        </div>

        {/* Adicionado line-height e isolamento para matar o bug de sobreposição visual */}
        <h1
          style={{
            marginTop: "25px",
            marginBottom: "5px",
            fontSize: "2.2rem",
            lineHeight: "1.2",
            color: "#fff",
          }}
        >
          Painel do Administrador
        </h1>
        <p style={{ margin: "0", color: "#aaa" }}>
          Cadastre novos modelos com cálculo automático de custo
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          textAlign: "left",
        }}
      >
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            color: "#fff",
          }}
        >
          Nome do Produto:
          <input
            type="text"
            name="nome"
            value={produto.nome}
            onChange={handleChange}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #444",
              backgroundColor: "#222",
              color: "#fff",
            }}
            required
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            color: "#fff",
          }}
        >
          Descrição:
          <textarea
            name="descricao"
            value={produto.descricao}
            onChange={handleChange}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #444",
              backgroundColor: "#222",
              color: "#fff",
              minHeight: "80px",
            }}
            required
          />
        </label>

        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <label
            style={{
              flex: 1,
              minWidth: "200px",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              color: "#fff",
            }}
          >
            Materiais Disponíveis:
            <div
              style={{
                display: "flex",
                gap: "15px",
                marginTop: "2px",
                backgroundColor: "#2a2a2a",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #444",
              }}
            >
              <label style={{ fontWeight: "normal", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  value="PLA"
                  checked={produto.material.includes("PLA")}
                  onChange={handleCheckboxChange}
                />{" "}
                PLA
              </label>
              <label style={{ fontWeight: "normal", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  value="ABS"
                  checked={produto.material.includes("ABS")}
                  onChange={handleCheckboxChange}
                />{" "}
                ABS
              </label>
              <label style={{ fontWeight: "normal", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  value="PETG"
                  checked={produto.material.includes("PETG")}
                  onChange={handleCheckboxChange}
                />{" "}
                PETG
              </label>
            </div>
          </label>

          <label
            style={{
              flex: 1,
              minWidth: "200px",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              color: "#fff",
            }}
          >
            Tempo de Impressão (Horas):
            <input
              type="number"
              name="tempoImpressaoHoras"
              value={produto.tempoImpressaoHoras}
              onChange={handleChange}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #444",
                backgroundColor: "#222",
                color: "#fff",
              }}
              required
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: "15px" }}>
          <label
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              color: "#fff",
            }}
          >
            Peso da Peça (Gramas):
            <input
              type="number"
              name="pesoGramas"
              value={produto.pesoGramas}
              onChange={handleChange}
              placeholder="ex: 250"
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #444",
                backgroundColor: "#222",
                color: "#fff",
              }}
              required
            />
          </label>

          <label
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              color: "#fff",
            }}
          >
            Preço de Venda (R$):
            <input
              type="number"
              step="0.01"
              name="precoVenda"
              value={produto.precoVenda}
              onChange={handleChange}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #444",
                backgroundColor: "#222",
                color: "#fff",
              }}
              required
            />
          </label>
        </div>

        {/* PAINEL DE FEEDBACK FINANCEIRO */}
        {(produto.pesoGramas || produto.tempoImpressaoHoras) && (
          <div
            style={{
              backgroundColor: "#1e1e1e",
              padding: "15px",
              borderRadius: "8px",
              border: "1px dashed #ff9800",
            }}
          >
            <h4 style={{ margin: "0 0 10px 0", color: "#ff9800" }}>
              📊 Projeção de Custos
            </h4>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                color: "#aaa",
              }}
            >
              <p style={{ margin: "2px 0" }}>
                Filamento ({produto.pesoGramas || 0}g):
              </p>
              <p style={{ margin: "2px 0" }}>R$ {custoMaterial.toFixed(2)}</p>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                color: "#aaa",
              }}
            >
              <p style={{ margin: "2px 0" }}>
                Máquina ({produto.tempoImpressaoHoras || 0}h):
              </p>
              <p style={{ margin: "2px 0" }}>R$ {custoTempo.toFixed(2)}</p>
            </div>
            <hr style={{ borderColor: "#333", margin: "10px 0" }} />
            <p style={{ margin: "5px 0", fontSize: "16px", color: "#fff" }}>
              ⚡ Custo Total de Produção:{" "}
              <strong style={{ color: "#f44336" }}>
                R$ {custoProducaoCalculado.toFixed(2)}
              </strong>
            </p>
            {produto.precoVenda && (
              <p style={{ margin: "5px 0", fontSize: "16px", color: "#fff" }}>
                💰 Lucro Líquido:{" "}
                <strong style={{ color: "#4caf50" }}>
                  R$ {lucroEstimadoCalculado.toFixed(2)}
                </strong>
              </p>
            )}
          </div>
        )}

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            color: "#fff",
          }}
        >
          URL da Imagem:
          <input
            type="url"
            name="urlImagem"
            value={produto.urlImagem}
            onChange={handleChange}
            placeholder="https://exemplo.com/imagem.jpg"
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #444",
              backgroundColor: "#222",
              color: "#fff",
            }}
          />
        </label>

        <button
          type="submit"
          className="btn-finalizar"
          style={{ width: "100%", padding: "12px", marginTop: "10px" }}
        >
          Salvar Produto na Nuvem
        </button>
      </form>

      {/* --- SEÇÃO COMPLETA: FILA DE ESPERA INTERATIVA DA FÁBRICA 3D --- */}
      <section
        style={{
          marginTop: "45px",
          backgroundColor: "#1a1a1a",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #333",
          textAlign: "left",
        }}
      >
        <h2 style={{ color: "#ff9800", marginBottom: "5px", marginTop: "0" }}>
          🏭 Fila de Espera da Fábrica 3D
        </h2>
        <p style={{ color: "#aaa", fontSize: "14px", margin: "0 0 20px 0" }}>
          Gerencie os pedidos fechados manualmente no WhatsApp
        </p>

        {/* Input de cadastro na fila */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "25px",
            backgroundColor: "#222",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #333",
          }}
        >
          <h4 style={{ margin: "0", color: "#fff" }}>
            Adicionar Nova Encomenda do WhatsApp:
          </h4>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Comprador (ex: Carlos Henrique)"
              value={nomeClienteFila}
              onChange={(e) => setNomeClienteFila(e.target.value)}
              style={{
                flex: 1,
                minWidth: "180px",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #444",
                backgroundColor: "#333",
                color: "#fff",
              }}
            />
            <input
              type="text"
              placeholder="Peças e Material (ex: 1x Vaso Casal - PLA Vermelho)"
              value={descricaoPedidoFila}
              onChange={(e) => setDescricaoPedidoFila(e.target.value)}
              style={{
                flex: 2,
                minWidth: "240px",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #444",
                backgroundColor: "#333",
                color: "#fff",
              }}
            />
          </div>
          <button
            onClick={adicionarNaFila}
            style={{
              backgroundColor: "#ff9800",
              color: "#000",
              border: "none",
              padding: "10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              marginTop: "5px",
            }}
          >
            + Inserir na Fila de Impressão
          </button>
        </div>

        {/* Listagem dos pedidos ativos na Fila Manual */}
        {filaEspera.length === 0 ? (
          <p style={{ color: "#aaa", textAlign: "center", margin: "20px 0" }}>
            Nenhum pedido manual na fila. Impressoras prontas!
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {filaEspera.map((pedido, idx) => (
              <div
                key={pedido.id}
                style={{
                  backgroundColor: "#222",
                  padding: "15px",
                  borderRadius: "8px",
                  borderLeft: "5px solid #ff9800",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      margin: "0 0 4px 0",
                      color: "#fff",
                      fontSize: "1.1rem",
                    }}
                  >
                    👤 {pedido.cliente}
                  </h3>
                  <p
                    style={{
                      margin: "0 0 6px 0",
                      color: "#ccc",
                      fontSize: "0.95rem",
                    }}
                  >
                    📦 {pedido.descricao}
                  </p>
                  <small style={{ color: "#666" }}>
                    Posição: #{idx + 1} | Registrado em: {pedido.data}
                  </small>
                </div>
                <button
                  onClick={() => concluirPedidoFila(pedido.id)}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #4caf50",
                    color: "#4caf50",
                    padding: "8px 14px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                  }}
                >
                  ✔️ Concluir
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mantido o histórico antigo de pedidos automáticos do banco caso queira monitorar logs anteriores */}
        {pedidosFila.length > 0 && (
          <div
            style={{
              marginTop: "30px",
              borderTop: "1px dashed #333",
              paddingTop: "20px",
            }}
          >
            <h4 style={{ color: "#888", margin: "0 0 15px 0" }}>
              📜 Histórico de Pedidos Anteriores (API):
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                opacity: 0.6,
              }}
            >
              {pedidosFila.map((p) => (
                <div
                  key={p.id}
                  style={{
                    fontSize: "13px",
                    color: "#aaa",
                    backgroundColor: "#111",
                    padding: "10px",
                    borderRadius: "6px",
                  }}
                >
                  <span>
                    Pedido #{p.id} - {p.status} - R$ {p.total?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Admin;
