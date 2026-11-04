import './CoursePriceFields.css';

export function CursoPrecoCampos({
  isGratuito,
  preco,
  precoReferencia,
  onGratuitoChange,
  onPrecoChange,
  onPrecoReferenciaChange,
}) {
  return (
    <>
      <fieldset className="curso-preco-opcoes">
        <legend>Como podem os alunos entrar no curso?</legend>
        <div className="curso-preco-linha">
          <p aria-hidden="true">Como podem os alunos entrar no curso?</p>
          <div className="curso-preco-escolhas">
            <label>
              <input
                type="radio"
                name="acesso-curso"
                checked={isGratuito}
                onChange={() => onGratuitoChange(true)}
              />
              <span>Gratuitamente</span>
            </label>
            <label>
              <input
                type="radio"
                name="acesso-curso"
                checked={!isGratuito}
                onChange={() => onGratuitoChange(false)}
              />
              <span>Com pagamento</span>
            </label>
          </div>
        </div>
      </fieldset>
      {!isGratuito && (
        <div className="curso-precos">
          <div className="curso-preco-valor">
            <label htmlFor="curso-preco">Preço por inscrição</label>
            <div>
              <input
                id="curso-preco"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={preco}
                onChange={(evento) => onPrecoChange(evento.target.value)}
                placeholder="0,00"
              />
              <span aria-hidden="true">€</span>
            </div>
          </div>
          <div className="curso-preco-valor">
            <label htmlFor="curso-preco-anterior">
              Preço anterior <span>(opcional)</span>
            </label>
            <div>
              <input
                id="curso-preco-anterior"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={precoReferencia}
                onChange={(evento) => onPrecoReferenciaChange(evento.target.value)}
                placeholder="0,00"
              />
              <span aria-hidden="true">€</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
