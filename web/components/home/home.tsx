import {useEffect} from "react";
import {Col} from "web/components/layout/col";
import {Button} from "web/components/buttons/button";
import {signupRedirect} from "web/lib/util/signup";

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
  useEffect(() => {
    const text = "Search.";
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
  }, []);

  return (
    <>
      <Col className="mb-4 gap-2 lg:hidden">
        <Button
          className="flex-1"
          color="gradient"
          size="xl"
          onClick={signupRedirect}
        >
          Sign up
        </Button>
        {/*<SignUpAsMatchmaker className="flex-1"/>*/}
      </Col>
      <h1
        className="pt-12 pb-2 text-7xl md:text-8xl xs:text-6xl font-extrabold max-w-4xl leading-tight xl:whitespace-nowrap md:whitespace-nowrap">
        Don't Swipe.<br/>
        <span id="typewriter"></span>
        <span id="cursor" className="animate-pulse">|</span>
      </h1>
      <div className="w-full bg-gray-50 dark:bg-gray-900 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <AboutBox title="Radically Transparent" text="No algorithms. Every profile searchable."/>
            <AboutBox title="Built for Depth" text="Filter by any keyword and what matters most."/>
            <AboutBox title="Community Owned" text="Free forever. Built by users, for users."/>
          </div>
        </div>
      </div>
    </>
  );
}

