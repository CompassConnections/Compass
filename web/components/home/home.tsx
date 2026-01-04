import {useEffect} from "react";
import {Col} from "web/components/layout/col";
import {SignUpButton} from "web/components/nav/sidebar";
import {useUser} from "web/hooks/use-user";
import {useT} from "web/lib/locale";

export function AboutBox(props: {
  title: string
  text: string
}) {
  const {title, text} = props
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">
        {text}
      </p>
    </div>
  )
}

export function LoggedOutHome() {
  const user = useUser()
  const t = useT()

  const typewriterText = t('home.typewriter', 'Search.')

  useEffect(() => {
    const text = typewriterText;
    const el = document.getElementById("typewriter");
    if (!el) return;

    let i = 0;
    let timeoutId: any;
    el.textContent = "";

    function typeWriter() {
      if (i < text.length && el) {
        el.textContent = text.substring(0, i + 1);
        i++;
        timeoutId = setTimeout(typeWriter, 150);
      }
    }

    const startId = setTimeout(typeWriter, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(startId);
      if (el) el.textContent = text;
    };
  }, [typewriterText]);

  return (
    <>
      {user === null && <Col className="mb-4 gap-2 lg:hidden">
          <SignUpButton
              className="mt-4 flex-1 fixed bottom-[calc(55px+env(safe-area-inset-bottom))] w-full left-0 right-0 z-10 mx-auto px-4"
              size="xl"
              text={t('home.sign_up','Sign up')}
          />
        {/*<SignUpAsMatchmaker className="flex-1"/>*/}
      </Col>}
      <h1
        className="pt-12 pb-2 text-7xl md:text-8xl xs:text-6xl font-extrabold leading-tight xl:whitespace-nowrap md:whitespace-nowrap text-center">
        {t('home.title', "Don't Swipe.")}<br/>
        <span id="typewriter"></span>
        <span id="cursor" className="animate-pulse">|</span>
      </h1>
      <div className="py-8"></div>
      <h3
        className="text-2xl font-bold text-center">
        {t('home.subtitle', 'Find people who share your values, ideas, and intentions — not just your photos.')}
      </h3>
      <div className="w-full py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <AboutBox title={t('home.feature1.title','Radically Transparent')}
                      text={t('home.feature1.text','No algorithms. Every profile searchable. You decide who to discover.')}/>
            <AboutBox title={t('home.feature2.title','Built for Depth')}
                      text={t('home.feature2.text','Search and filter by values, interests, goals, and keywords — from “stoicism” to “sustainable living.” Surface the connections that truly matter.')}/>
            <AboutBox title={t('home.feature3.title','Community Owned & Open Source')}
                      text={t('home.feature3.text','Free forever. No ads, no subscriptions. Built by the people who use it, for the benefit of everyone.')}/>
          </div>
          <div className="mt-10 max-w-xl mx-auto">
            <p className="text-center">
              {t('home.bottom', 'Compass is to human connection what Linux is to software, Wikipedia is to knowledge, and Firefox is to browsing — a public digital good designed to serve people, not profit.')}
            </p>
          </div>
        </div>
      </div>
      <div className="block lg:hidden h-12"></div>
    </>
  );
}
