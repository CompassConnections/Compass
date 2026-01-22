import {PageBase} from 'web/components/page-base'
import {SEO} from "web/components/SEO";
import {useLocale, useT} from "web/lib/locale";
import Link from "next/link";

type PressItem = {
  title: string;
  source: string;
  date: string;
  url: string;
  language: 'en' | 'fr' | 'de';
};

const pressItems: PressItem[] = [
  {
    title: 'Un Havelangeois lance Compass, une appli de rencontre qui mise avant tout sur la personnalité : "Les recherches se font via des mots-clés spécifiques"',
    source: 'La DH',
    date: '2026-01-21',
    url: 'https://www.dhnet.be/regions/namur/2026/01/21/un-havelangeois-lance-compass-une-appli-de-rencontre-qui-mise-avant-tout-sur-la-personnalite-les-recherches-se-font-via-des-mots-cles-specifiques-6ZBEE4GNVZHHZBWH5PFXNLD4WI/',
    language: 'fr',
  },
  {
    title: 'Un Havelangeois lance Compass, une appli de rencontre qui mise avant tout sur la personnalité : "Les recherches se font via des mots-clés spécifiques"',
    source: "L'Avenir",
    date: '2026-01-21',
    url: 'https://www.lavenir.net/regions/namur/2026/01/21/un-havelangeois-lance-compass-une-appli-de-rencontre-qui-mise-avant-tout-sur-la-personnalite-les-recherches-se-font-via-des-mots-cles-specifiques-LPAHVUX5VFAOFGZ4X3UJDXZD2Q/',
    language: 'fr',
    //   TODO: add unpaywalled PDF, word or txt
  },
  {
    title: 'Martin Braquet, un jeune ingénieur havelangeois, sort son appli de rencontre éthique.',
    source: 'Matélé (Facebook Reel)',
    date: '2026-01-17',
    url: 'https://www.facebook.com/reel/757129776892904',
    language: 'fr',
  },
  {
    title: 'Une application qui réinvente les rencontres en ligne développée par un Havelangeois',
    source: 'Matélé (Video Reportage)',
    date: '2026-01-15',
    url: 'https://www.matele.be/une-application-qui-reinvente-les-rencontres-en-ligne-developpee-par-un-havelangeois',
    language: 'fr',
  },
];

const PressItem = ({item}: { item: PressItem, locales: Intl.LocalesArgument }) => (
  <div className="mb-8 px-6 pb-4 border border-canvas-200 rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <h3 className="text-xl font-semibold mb-2">
      <Link href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
        {item.title}
      </Link>
    </h3>
    <div className="flex flex-col sm:flex-row sm:justify-between text-sm mb-2">
      <span>{item.source}</span>
      {/*<span>{new Date(item.date).toLocaleDateString(locales, { year: 'numeric', month: 'long', day: 'numeric' })}</span>*/}
      <span>{item.date}</span>
    </div>
    {/*<div className="mt-2">*/}
    {/*  <span className="inline-block px-2 py-1 text-xs rounded-full">*/}
    {/*    {item.language.toUpperCase()}*/}
    {/*  </span>*/}
    {/*</div>*/}
  </div>
);

export default function PressPage() {
  const t = useT();

  const pressByLanguage = pressItems.reduce<Record<string, PressItem[]>>((acc, item) => {
    if (!acc[item.language]) {
      acc[item.language] = [];
    }
    acc[item.language].push(item);
    return acc;
  }, {});

  const {locale} = useLocale()

  return (
    <PageBase trackPageView={'press'}>
      <SEO
        title={t('press.seo.title', 'Press - Compass')}
        description={t('press.seo.description', 'Latest press coverage and media mentions of Compass')}
        url={'/press'}
      />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {t('press.title', 'Press')}
          </h1>
          <p className="text-xl max-w-3xl mx-auto">
            {t('press.subtitle', 'Latest news and media coverage about Compass')}
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">
            {t('press.media_kit', 'Media Kit')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="px-6 pb-4 border border-canvas-200 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-3">{t('press.brand_assets', 'Brand Assets')}</h3>
              <p className=" mb-4">
                {t('press.brand_assets_description', 'Download our logo and brand guidelines.')}
              </p>
              <a
                href="https://github.com/CompassConnections/assets/archive/refs/heads/main.zip"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t('press.download_assets', 'Download Assets')}
              </a>
            </div>
            <div className="px-6 pb-4 border border-canvas-200 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-3">{t('press.contact', 'Press Contact')}</h3>
              <p className="-300 mb-4">
                {t('press.contact_description', 'For press inquiries, please contact our team.')}
              </p>
              <a
                href="mailto:hello@compassmeet.com"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t('press.contact_us', 'Contact Us')}
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(pressByLanguage).map(([language, items]) => (
            <div key={language}>
              <h2 className="text-2xl font-semibold mb-6">
                {t(`languages.${language}`, language.toUpperCase())}
              </h2>
              <div className="space-y-6">
                {items.map((item, index) => (
                  <PressItem key={index} item={item} locales={locale}/>
                ))}
              </div>
            </div>
          ))}

          {pressItems.length === 0 && (
            <div className="text-center py-12">
              <p className="">
                {t('press.no_articles', 'No press articles available at the moment. Please check back later.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </PageBase>
  );
}
