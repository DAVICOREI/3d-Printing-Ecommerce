import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function Admin() {
  const navigate = useNavigate(); // <-- Inicializa o hook de navegação

  const [pedidosFila, setPedidosFila] = useState([]);

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

  // Função que apaga o token e chuta o usuário para a vitrine
  const handleLogout = () => {
    localStorage.removeItem("tokenAdmin");
    navigate("/");
  };

  const [produto, setProduto] = useState({
    nome: "",
    descricao: "",
    material: [], // <-- Agora é uma lista (Array) vazia
    tempoImpressaoHoras: "",
    pesoGramas: "",
    precoVenda: "",
    urlImagem: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduto({ ...produto, [name]: value });
  };

  // Função para gerenciar os checkboxes de material
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    let novosMateriais = [...produto.material];

    if (checked) {
      novosMateriais.push(value); // Adiciona na lista se marcou
    } else {
      novosMateriais = novosMateriais.filter((mat) => mat !== value); // Tira da lista se desmarcou
    }

    setProduto({ ...produto, material: novosMateriais });
  };

  // --- REGRA DE NEGÓCIO DA IMPRESSÃO 3D ---

  // 1. Custo do Material (PLA a R$ 130/kg)
  const precoPorGrama = 130 / 1000;
  const custoMaterial = Number(produto.pesoGramas) * precoPorGrama;

  // 2. Custo de Tempo de Máquina (Energia + Desgaste = ~R$ 1.50/hora)
  const custoPorHora = 1.5;
  const custoTempo = Number(produto.tempoImpressaoHoras) * custoPorHora;

  // 3. Custo Total de Produção
  const custoProducaoCalculado = custoMaterial + custoTempo;

  // 4. Margem de Lucro
  const lucroEstimadoCalculado =
    Number(produto.precoVenda) - custoProducaoCalculado;

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
            // Transforma a lista ["PLA", "ABS"] no texto "PLA, ABS" para o Java
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
        // Limpa o formulário garantindo que o material volte a ser uma lista vazia
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
      <header style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>
            ← Voltar para a Vitrine
          </Link>

          {/* Botão de Logout */}
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #f44336",
              color: "#f44336",
              padding: "5px 15px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Sair 🔒
          </button>
        </div>

        <h1 style={{ marginTop: "15px" }}>Painel do Administrador</h1>
        <p>Cadastre novos modelos com cálculo automático de custo</p>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <label>
          Nome do Produto:
          <input
            type="text"
            name="nome"
            value={produto.nome}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Descrição:
          <textarea
            name="descricao"
            value={produto.descricao}
            onChange={handleChange}
            required
          />
        </label>

        <div style={{ display: "flex", gap: "10px" }}>
          <label style={{ flex: 1 }}>
            Materiais Disponíveis:
            <div
              style={{
                display: "flex",
                gap: "15px",
                marginTop: "8px",
                backgroundColor: "#2a2a2a",
                padding: "10px",
                borderRadius: "5px",
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

          <label style={{ flex: 1 }}>
            Tempo de Impressão (Horas):
            <input
              type="number"
              name="tempoImpressaoHoras"
              value={produto.tempoImpressaoHoras}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <label style={{ flex: 1 }}>
            Peso da Peça (Gramas):
            <input
              type="number"
              name="pesoGramas"
              value={produto.pesoGramas}
              onChange={handleChange}
              placeholder="ex: 250"
              required
            />
          </label>

          <label style={{ flex: 1 }}>
            Preço de Venda (R$):
            <input
              type="number"
              step="0.01"
              name="precoVenda"
              value={produto.precoVenda}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        {/* --- PAINEL DE FEEDBACK FINANCEIRO --- */}
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

            <p style={{ margin: "5px 0", fontSize: "16px" }}>
              ⚡ Custo Total de Produção:{" "}
              <strong style={{ color: "#f44336" }}>
                R$ {custoProducaoCalculado.toFixed(2)}
              </strong>
            </p>

            {produto.precoVenda && (
              <p style={{ margin: "5px 0", fontSize: "16px" }}>
                💰 Lucro Líquido:{" "}
                <strong style={{ color: "#4caf50" }}>
                  R$ {lucroEstimadoCalculado.toFixed(2)}
                </strong>
              </p>
            )}
          </div>
        )}

        <label>
          URL da Imagem:
          <input
            type="url"
            name="urlImagem"
            value={produto.urlImagem}
            onChange={handleChange}
            placeholder="https://exemplo.com/imagem.jpg"
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

      {/* --- SEÇÃO: FILA DE ESPERA DE ENCOMENDAS --- */}
      <section
        style={{
          marginTop: "40px",
          backgroundColor: "#1a1a1a",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #333",
        }}
      >
        <h2 style={{ color: "#ff9800", marginBottom: "15px" }}>
          🏭 Fila de Espera da Fábrica 3D
        </h2>

        {pedidosFila.length === 0 ? (
          <p style={{ color: "#aaa" }}>
            Nenhuma encomenda pendente no momento.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {pedidosFila.map((pedido, index) => (
              <div
                key={pedido.id}
                style={{
                  backgroundColor: "#222",
                  padding: "15px",
                  borderRadius: "6px",
                  borderLeft: "5px solid #ff9800",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <strong>
                    # Posição na Fila: {index + 1} (Pedido ID: {pedido.id})
                  </strong>
                  <span
                    style={{
                      backgroundColor:
                        pedido.status === "PENDENTE" ? "#ff9800" : "#4caf50",
                      color: "#000",
                      padding: "3px 8px",
                      borderRadius: "3px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {pedido.status}
                  </span>
                </div>

                <p style={{ margin: "5px 0", fontSize: "14px", color: "#aaa" }}>
                  📅 Data da Compra:{" "}
                  <strong>
                    {new Date(pedido.dataPedido).toLocaleString("pt-BR")}
                  </strong>
                </p>

                <p style={{ margin: "5px 0", fontSize: "14px", color: "#aaa" }}>
                  💰 Valor Total:{" "}
                  <strong>
                    R$ {pedido.total ? pedido.total.toFixed(2) : "0.00"}
                  </strong>
                </p>

                <div
                  style={{
                    marginTop: "10px",
                    backgroundColor: "#111",
                    padding: "10px",
                    borderRadius: "4px",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#888" }}>
                    Peças a serem fabricadas:
                  </span>
                  {pedido.itens?.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "14px",
                        marginTop: "5px",
                      }}
                    >
                      <span>• {item.produto?.nome || "Produto Deletado"}</span>
                      <span>Qtd: {item.quantidade}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Admin;
