import './AdventureScreen.scss';
export const AdventureScreen: React.FC = () => {
  return (
    <div className="adventureScreen-content">
      <div className="imageWrapper">Image here</div>
      <div className="summary">
        Story introduction here: <br />
        Escape the dungeon, find the treasure, etc.
      </div>
    </div>
  );
};
