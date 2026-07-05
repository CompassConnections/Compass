import clsx from 'clsx'
import {useT} from 'web/lib/locale'

// Full-bleed compass "app loading" splash shown on the home page while the
// user is still resolving. Ported from the Compass App Loading design: an
// igniting compass rose with a beating heart, radar sweep, sonar rings and a
// filling progress ring, over a warm radial backdrop. All colors are driven by
// the `--cl-*` custom properties below so the piece themes automatically:
// the design's dark palette in dark mode, a warm-cream variant in light mode.
export function HomeLoadingAnimation(props: {className?: string}) {
  const {className} = props
  const t = useT()

  const messages = [
    t('profiles.loading_dashboard_desc', 'The server is waking up, hang tight.'),
    t('profiles.loading_warming', 'Warming up the compass…'),
    t('profiles.loading_finding', 'Finding your people…'),
    t('profiles.loading_almost', 'Almost there…'),
  ]

  return (
    <div
      className={clsx('compass-load', className)}
      role="status"
      aria-live="polite"
      aria-label={t('profiles.loading_dashboard', 'Loading dashboard…')}
    >
      <style>{styles}</style>
      <div className="cl-screen">
        <div className="cl-vignette" />
        <div className="cl-stage">
          <div className="cl-glow" />

          <div className="cl-loadfx">
            {/* rotating radar sweep */}
            <div className="cl-lay cl-radar" />
            {/* expanding sonar rings */}
            <div className="cl-ring70 cl-sonar" style={{animationDelay: '2.1s'}} />
            <div className="cl-ring70 cl-sonar" style={{animationDelay: '2.65s'}} />
            <div className="cl-ring70 cl-sonar" style={{animationDelay: '3.2s'}} />
            <div className="cl-ring70 cl-sonar" style={{animationDelay: '3.75s'}} />
            {/* radar blips */}
            <svg viewBox="0 0 200 200" className="cl-lay">
              <circle
                cx="150"
                cy="72"
                r="2.5"
                className="cl-blip"
                style={{animationDelay: '2.4s'}}
              />
              <circle
                cx="62"
                cy="150"
                r="2.5"
                className="cl-blip"
                style={{animationDelay: '3.5s'}}
              />
              <circle
                cx="160"
                cy="140"
                r="2"
                className="cl-blip"
                style={{animationDelay: '3.8s'}}
              />
              <circle cx="70" cy="64" r="2" className="cl-blip" style={{animationDelay: '2.9s'}} />
              <circle
                cx="120"
                cy="160"
                r="2.5"
                className="cl-blip"
                style={{animationDelay: '3.2s'}}
              />
              <circle cx="44" cy="100" r="2" className="cl-blip" style={{animationDelay: '2.6s'}} />
            </svg>
            {/* progress ring */}
            <svg viewBox="0 0 200 200" className="cl-lay">
              <circle
                cx="100"
                cy="100"
                r="94"
                fill="none"
                className="cl-ringtrack"
                strokeWidth="2"
              />
              <circle
                cx="100"
                cy="100"
                r="94"
                fill="none"
                className="cl-prog"
                strokeWidth="2.6"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                transform="rotate(-90 100 100)"
              />
            </svg>
          </div>

          <div className="cl-dot" />
          <div className="cl-shock" />

          {/* compass rose + heart */}
          <svg viewBox="0 0 200 200" className="cl-lay">
            <g className="cl-rays">
              <polygon points="100,54 97,100 103,100" className="cl-ray-major" />
              <polygon
                points="100,54 97,100 103,100"
                className="cl-ray-major"
                transform="rotate(90 100 100)"
              />
              <polygon
                points="100,54 97,100 103,100"
                className="cl-ray-major"
                transform="rotate(180 100 100)"
              />
              <polygon
                points="100,54 97,100 103,100"
                className="cl-ray-major"
                transform="rotate(270 100 100)"
              />
              <polygon
                points="100,66 98,100 102,100"
                className="cl-ray-minor"
                transform="rotate(45 100 100)"
              />
              <polygon
                points="100,66 98,100 102,100"
                className="cl-ray-minor"
                transform="rotate(135 100 100)"
              />
              <polygon
                points="100,66 98,100 102,100"
                className="cl-ray-minor"
                transform="rotate(225 100 100)"
              />
              <polygon
                points="100,66 98,100 102,100"
                className="cl-ray-minor"
                transform="rotate(315 100 100)"
              />
            </g>
            <circle
              cx="100"
              cy="100"
              r="30"
              fill="none"
              className="cl-innerring"
              strokeWidth="1.5"
              pathLength={1}
              strokeDasharray="1"
            />
            <g className="cl-heart">
              <path
                d="M100 115 C89 105 79 99 79 90.5 C79 84.5 84 81 89.5 82 C94 82.8 98 86.5 100 90 C102 86.5 106 82.8 110.5 82 C116 81 121 84.5 121 90.5 C121 99 111 105 100 115 Z"
                className="cl-heart-path"
              />
            </g>
          </svg>
        </div>

        <div className="cl-textblock">
          <div className="cl-head">{t('profiles.loading_dashboard', 'Loading dashboard…')}</div>
          <div className="cl-subwrap">
            {messages.map((msg, i) => (
              <div key={i} className="cl-sub" style={{animationDelay: `${2.1 + i * 3}s`}}>
                {msg}
              </div>
            ))}
          </div>
        </div>

        <div className="cl-flash" />
      </div>
    </div>
  )
}

const styles = `
.compass-load{
  /* fill the <main> content area rather than the whole viewport, so the
     app chrome (left sidebar / bottom nav) stays visible around it. */
  position:relative;flex:1 1 auto;align-self:stretch;min-height:24rem;
  /* light (default) — warm cream variant */
  --cl-bg1:#F7F4EF; --cl-bg2:#EDE8E0;
  --cl-vignette:rgba(0,0,0,.10);
  --cl-struct:30 26 20;   /* rays / rings — dark ink on cream */
  --cl-heading:#1E1A14;
  --cl-sub:#8C8070;
  --cl-amber:193 127 62;  /* primary-500 */
  --cl-gold:193 127 62;   /* heart — deeper amber for contrast on cream */
  --cl-ignite:208 147 82; /* ignition highlights — primary-400 */
  --cl-blip:166 104 46;   /* radar blips — primary-600 */
}
.dark .compass-load{
  /* dark — faithful to the original design palette */
  --cl-bg1:#241E15; --cl-bg2:#1E1A14;
  --cl-vignette:rgba(0,0,0,.42);
  --cl-struct:247 244 239;
  --cl-heading:#F7F4EF;
  --cl-sub:#8C8070;
  --cl-amber:193 127 62;
  --cl-gold:222 180 121;
  --cl-ignite:240 222 185;
  --cl-blip:232 201 157;
}
.cl-screen{position:absolute;inset:0;z-index:0;overflow:hidden;
  background:radial-gradient(130% 100% at 50% 44%,var(--cl-bg1) 0%,var(--cl-bg2) 58%);
  display:flex;flex-direction:column;align-items:center;justify-content:center}
.cl-vignette{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(120% 90% at 50% 46%,transparent 46%,var(--cl-vignette))}
.cl-stage{position:relative;width:220px;height:220px;transform:translateY(-8px)}
.cl-lay{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.cl-glow{position:absolute;inset:-46px;border-radius:50%;
  background:radial-gradient(circle,rgb(var(--cl-amber)/.24),rgb(var(--cl-amber)/0) 62%);
  opacity:0;animation:cl-glowBloom 1.2s ease .85s both,cl-c1Glow 1.8s ease-in-out 2.1s infinite}
.cl-loadfx{position:absolute;inset:0;opacity:0;animation:cl-fxReveal .6s ease 2.1s both}
.cl-radar{border-radius:50%;margin:6px;
  background:conic-gradient(from 0deg,rgb(var(--cl-gold)/.16),rgb(var(--cl-gold)/.02) 55deg,transparent 90deg);
  animation:cl-c1Radar 4s linear 2.1s infinite}
.cl-ring70{position:absolute;left:50%;top:50%;width:70px;height:70px;margin:-35px 0 0 -35px;
  border-radius:50%;border:1.5px solid rgb(var(--cl-gold)/.55)}
.cl-sonar{animation:cl-c1Sonar 2.4s ease-out infinite}
.cl-blip{fill:rgb(var(--cl-blip));transform-box:fill-box;transform-origin:center;
  animation:cl-c1Blip 2.4s ease-in-out infinite}
.cl-ringtrack{stroke:rgb(var(--cl-struct)/.07)}
.cl-prog{stroke:rgb(var(--cl-amber));stroke-dashoffset:1;animation:cl-progFill 10s ease-in-out 2.1s infinite}
.cl-dot{position:absolute;left:50%;top:50%;width:11px;height:11px;margin:-5.5px 0 0 -5.5px;border-radius:50%;
  background:rgb(var(--cl-ignite));box-shadow:0 0 16px 3px rgb(var(--cl-ignite)/.9);
  opacity:0;animation:cl-dotIgnite 1s ease .05s both}
.cl-shock{position:absolute;left:50%;top:50%;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;
  border:1.6px solid rgb(var(--cl-ignite)/.7);opacity:0;animation:cl-shockwave .85s cubic-bezier(.2,.7,.3,1) 1s both}
.cl-rays{transform-box:fill-box;transform-origin:center;animation:cl-raysIn .95s cubic-bezier(.2,.8,.2,1) .3s both}
.cl-ray-major{fill:rgb(var(--cl-struct)/.42)}
.cl-ray-minor{fill:rgb(var(--cl-struct)/.28)}
.cl-innerring{stroke:rgb(var(--cl-struct)/.4);stroke-dashoffset:1;animation:cl-ringDraw .8s ease .2s both}
.cl-heart{transform-box:fill-box;transform-origin:center;
  animation:cl-heartPop .7s cubic-bezier(.2,.8,.2,1) .95s both,cl-c1Beat 1.8s ease-in-out 2.1s infinite}
.cl-heart-path{fill:rgb(var(--cl-gold));filter:drop-shadow(0 0 6px rgb(var(--cl-gold)/.9))}
.cl-textblock{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;margin-top:8px}
.cl-head{margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:28px;
  letter-spacing:.3px;color:var(--cl-heading);opacity:0;animation:cl-headIn .7s cubic-bezier(.2,.8,.2,1) 1.45s both}
.cl-subwrap{position:relative;height:22px;width:min(340px,90vw);margin-top:12px}
.cl-sub{position:absolute;inset:0;text-align:center;white-space:nowrap;font-size:14.5px;letter-spacing:.2px;
  color:var(--cl-sub);opacity:0;animation:cl-msgFade 12s ease-in-out infinite}
.cl-flash{position:absolute;inset:0;pointer-events:none;z-index:4;
  background:radial-gradient(circle at 50% 47%,rgb(var(--cl-ignite)/.5),rgb(var(--cl-ignite)/0) 55%);
  opacity:0;animation:cl-flash .7s ease .95s both}
@keyframes cl-glowBloom{0%{opacity:0;transform:scale(.4)}55%{opacity:.95;transform:scale(1.16)}100%{opacity:.5;transform:scale(1)}}
@keyframes cl-c1Glow{0%{opacity:.5;transform:scale(1)}8%{opacity:.95;transform:scale(1.14)}40%{opacity:.5;transform:scale(1)}100%{opacity:.5;transform:scale(1)}}
@keyframes cl-dotIgnite{0%{transform:scale(0);opacity:0}28%{transform:scale(1);opacity:1}72%{opacity:.9}100%{transform:scale(2.6);opacity:0}}
@keyframes cl-ringDraw{0%{stroke-dashoffset:1;opacity:0}18%{opacity:1}100%{stroke-dashoffset:0;opacity:1}}
@keyframes cl-raysIn{0%{transform:scale(0) rotate(-75deg);opacity:0}70%{opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes cl-heartPop{0%{transform:scale(0);opacity:0}55%{transform:scale(1.3);opacity:1}78%{transform:scale(.93)}100%{transform:scale(1)}}
@keyframes cl-shockwave{0%{transform:scale(.35);opacity:0}18%{opacity:.85}100%{transform:scale(3.3);opacity:0}}
@keyframes cl-flash{0%{opacity:0}42%{opacity:.24}100%{opacity:0}}
@keyframes cl-headIn{0%{opacity:0;transform:translateY(11px)}100%{opacity:1;transform:translateY(0)}}
@keyframes cl-fxReveal{0%{opacity:0}100%{opacity:1}}
@keyframes cl-msgFade{0%{opacity:0;transform:translateY(5px)}4%{opacity:1;transform:translateY(0)}21%{opacity:1;transform:translateY(0)}25%{opacity:0;transform:translateY(-5px)}100%{opacity:0;transform:translateY(-5px)}}
@keyframes cl-progFill{0%{stroke-dashoffset:1}86%{stroke-dashoffset:0}100%{stroke-dashoffset:0}}
@keyframes cl-c1Beat{0%{transform:scale(1)}8%{transform:scale(1.17)}16%{transform:scale(1.02)}26%{transform:scale(1.12)}40%{transform:scale(1)}100%{transform:scale(1)}}
@keyframes cl-c1Sonar{0%{transform:scale(.5);opacity:0}12%{opacity:.7}100%{transform:scale(3.4);opacity:0}}
@keyframes cl-c1Radar{to{transform:rotate(360deg)}}
@keyframes cl-c1Blip{0%,44%{opacity:.1;transform:scale(.5)}54%{opacity:1;transform:scale(1.4)}64%{opacity:.15;transform:scale(.9)}100%{opacity:.1;transform:scale(.5)}}
@media (prefers-reduced-motion: reduce){
  .compass-load *{animation-duration:.001s!important;animation-iteration-count:1!important;
    animation-delay:0s!important;transition:none!important}
  .cl-sub:not(:first-child){display:none}
}
`
