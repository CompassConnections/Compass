
import Image from "next/image";

type FavIconProps = React.SVGProps<SVGSVGElement>;

const FavIcon: React.FC<FavIconProps> = ({ className }) => (
  // Need full domain for favicon to work properly on Webview
  <Image src="https://compassmeet.com/favicon.ico" alt="Compass logo" width={500} height={500} className={"w-12 h-12 " + className}/>
);

export default FavIcon;
