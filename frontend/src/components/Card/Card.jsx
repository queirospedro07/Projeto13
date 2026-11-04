import './Card.css';
import { classNames } from '../../utils/cssClasses';

export const Cartao = ({
  children: conteudoFilho,
  className: turmaNome,
  hover = false,
  glow: _glow = false,
  ...propriedades
}) => {
  return (
    <div
      className={classNames('card-panel', hover && 'card-panel-2', turmaNome)}
      {...propriedades}
    >
      {conteudoFilho}
    </div>
  );
};
