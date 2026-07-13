import {Img, staticFile} from 'remotion';
import {colors} from '../theme';

// The Compass rose (public/logo.svg is a copy of web/public/favicon.svg),
// framed in a soft cream disc so it reads on the dark background.
export const Logo: React.FC<{size: number}> = ({size}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: colors.creamGlow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 30px 90px ${colors.amberDeep}55, 0 0 0 ${
          size * 0.03
        }px ${colors.amber}33`,
        overflow: 'hidden',
      }}
    >
      <Img
        src={staticFile('logo.svg')}
        style={{width: size, height: size}}
      />
    </div>
  );
};
