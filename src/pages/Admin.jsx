import { useState } from "react";
import { Link } from "react-router-dom";

function Admin() {
  const [produto, setProduto] = useState({
    nome: "",
    descricao: "",
    material: "PLA",
    tempoImpressaoHoras: "",
    custoProducao: "",
    precoVenda: "",
    urlImagem: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduto({ ...produto, [name]: value });
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
            // Pega o token real salvo no navegador e coloca no formato padrão de mercado (Bearer)
            Authorization: `Bearer ${localStorage.getItem("tokenAdmin")}`,
          },
          body: JSON.stringify({
            ...produto,
            tempoImpressaoHoras: Number(produto.tempoImpressaoHoras),
            custoProducao: Number(produto.custoProducao),
            precoVenda: Number(produto.precoVenda),
          }),
        },
      );

      if (response.ok) {
        alert("🎉 Produto cadastrado com sucesso no banco de dados!");
        // Limpa o formulário
        setProduto({
          nome: "",
          descricao: "",
          material: "PLA",
          tempoImpressaoHoras: "",
          custoProducao: "",
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
        <p>Cadastre novos modelos e impressões 3D</p>
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
              <option value="PLA">PLA</option>
              <option value="ABS">ABS</option>
              <option value="PETG">PETG</option>
              <option value="Resina">Resina</option>
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
            Custo de Produção (R$):
            <input
              type="number"
              step="0.01"
              name="custoProducao"
              value={produto.custoProducao}
              onChange={handleChange}
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
