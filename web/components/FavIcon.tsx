type FavIconProps = {
  className?: string;
};

const FavIcon = ({ className }: FavIconProps) => (
  <img
    src="favicon.svg"
    alt="Compass logo"
    className={`w-12 h-12 ${className ?? ""}`}
  />
);

export default FavIcon;
