import { useState } from "react";
import { Link } from "react-router-dom";

function Admin() {
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
        <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>
          ← Voltar para a Vitrine
        </Link>
        <h1 style={{ marginTop: "10px" }}>Painel do Administrador</h1>
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
    </div>
  );
}

export default Admin;
