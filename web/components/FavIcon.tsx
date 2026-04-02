type FavIconProps = {
  className?: string
}

const FavIconBlack = ({className}: FavIconProps) => (
  <img
    src="https://compassmeet.com/favicon-black.svg"
    alt="Compass logo"
    className={`w-12 h-12 ${className ?? ''}`}
  />
)

export default FavIconBlack
