import './Prologue.scss';

interface Props {
  begin: () => void;
  introduction: string;
  beginLabel?: string;
}

export const Prologue: React.FC<Props> = ({
  begin,
  introduction,
  beginLabel = 'Begin Adventure',
}) => {
  return (
    <div className="Prologue-root">
      <div className="Prologue-content">
        <div className="Intro-title">Prologue</div>
        <div className="Prologue-description">{introduction}</div>
        <button className="basicButton" onClick={begin}>
          {beginLabel}
        </button>
      </div>
    </div>
  );
};
