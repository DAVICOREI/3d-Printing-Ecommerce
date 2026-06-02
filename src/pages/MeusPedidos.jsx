import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Buscando os pedidos do Cliente (ID 1)
    fetch("https://threed-printing-api-fv1h.onrender.com/api/pedidos/usuario/1")
      .then((response) => response.json())
      .then((data) => {
        setPedidos(data);
        setCarregando(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar pedidos:", error);
        setCarregando(false);
      });
  }, []);

  return (
    <div className="container">
      <header className="cabecalho">
        <h1>Meus Pedidos</h1>
        <p>Acompanhe o status das suas impressões 3D</p>
        <Link to="/" className="btn-voltar">
          ⬅ Voltar para a Loja
        </Link>
      </header>

      <main>
        {carregando ? (
          <p>Carregando histórico...</p>
        ) : pedidos.length === 0 ? (
          <p>Você ainda não fez nenhum pedido.</p>
        ) : (
          <div className="lista-pedidos">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="card-pedido">
                <div className="pedido-header">
                  <h3>Pedido #{pedido.id}</h3>
                  <span
                    className={`status-badge ${pedido.status.toLowerCase()}`}
                  >
                    {pedido.status}
                  </span>
                </div>
                <p>
                  <strong>Data:</strong>{" "}
                  {new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}
                </p>
                <p>
                  <strong>Total:</strong> R$ {pedido.total.toFixed(2)}
                </p>

                <div className="pedido-itens">
                  <strong>Itens:</strong>
                  <ul>
                    {pedido.itens.map((item) => (
                      <li key={item.id}>
                        {item.produto?.nome || "Produto Antigo"} - Quantidade:{" "}
                        {item.quantidade} (R$ {item.precoUnitario.toFixed(2)} /
                        un)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MeusPedidos;
