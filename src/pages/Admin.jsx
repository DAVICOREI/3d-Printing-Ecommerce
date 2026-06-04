import { useState } from "react";
import { Link } from "react-router-dom";

function Admin() {
  const [produto, setProduto] = useState({
    nome: "",
    descricao: "",
    material: "PLA",
    tempoImpressaoHoras: "",
    pesoGramas: "", // Substituímos o custo bruto pelo peso em gramas
    precoVenda: "",
    urlImagem: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduto({ ...produto, [name]: value });
  };

  // --- REGRA DE NEGÓCIO DA IMPRESSÃO 3D ---
  // Carretel de PLA padrão = R$ 130.00 por 1kg (1000g) -> R$ 0.13 por grama
  const precoPorGrama = 130 / 1000;
  const custoMaterialCalculado = Number(produto.pesoGramas) * precoPorGrama;
  const lucroEstimadoCalculado =
    Number(produto.precoVenda) - custoMaterialCalculado;

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
            material: produto.material,
            tempoImpressaoHoras: Number(produto.tempoImpressaoHoras),
            precoVenda: Number(produto.precoVenda),
            urlImagem: produto.urlImagem,
            // Enviamos o custo calculado automaticamente pela regra de negócio
            custoProducao: Number(custoMaterialCalculado.toFixed(2)),
          }),
        },
      );

      if (response.ok) {
        alert("🎉 Produto cadastrado com sucesso com cálculo automatizado!");
        setProduto({
          nome: "",
          descricao: "",
          material: "PLA",
          tempoImpressaoHoras: "",
          pesoGramas: "",
          precoVenda: "",
          urlImagem: "",
        });
      } else {
        alert("Erro ao cadastrar o produto. Verifique os dados.");
      }
    } catch (error) {
      console.error("Erro ao conectar com a API:", error);
      alert("Não foi possível conectar ao servidor.");
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
            Material:
            <select
              name="material"
              value={produto.material}
              onChange={handleChange}
            >
              <option value="PLA">PLA (R$ 130/kg)</option>
              <option value="ABS">ABS</option>
              <option value="PETG">PETG</option>
            </select>
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

        {/* --- PAINEL DE FEEDBACK EM TEMPO REAL --- */}
        {produto.pesoGramas && (
          <div
            style={{
              backgroundColor: "#1e1e1e",
              padding: "15px",
              borderRadius: "8px",
              border: "1px dashed #ff9800",
            }}
          >
            <h4 style={{ margin: "0 0 10px 0", color: "#ff9800" }}>
              📊 Projeção Financeira (PLA)
            </h4>
            <p style={{ margin: "5px 0" }}>
              ⚡ Custo do Material:{" "}
              <strong style={{ color: "#f44336" }}>
                R$ {custoMaterialCalculado.toFixed(2)}
              </strong>
            </p>
            {produto.precoVenda && (
              <p style={{ margin: "5px 0" }}>
                💰 Lucro Estimado:{" "}
                <strong style={{ color: "#4caf50" }}>
                  R$ {lucroEstimadoCalculado.toFixed(2)} (
                  {(
                    (lucroEstimadoCalculado / Number(produto.precoVenda)) *
                    100
                  ).toFixed(0)}
                  %)
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
