import { useContext } from 'react';
import { SiteContext } from '../utilities/context/site-context';
import './Prologue.scss';

interface Props {
  begin: () => void;
}

export const Prologue: React.FC<Props> = ({ begin }) => {
  const { game } = useContext(SiteContext);

  return (
    <div className="Prologue-root">
      <div className="Prologue-content">
        <div className="Prologue-title">Prologue</div>
        <div className="Prologue-description">{game?.introduction}</div>
        <button className="basicButton" onClick={begin}>
          Begin Adventure
        </button>
      </div>
    </div>
  );
};
