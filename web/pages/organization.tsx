import {LovePage} from 'web/components/love-page'
import {GeneralButton} from "web/components/buttons/general-button";
import clsx from "clsx";
import {Col} from "web/components/layout/col";


export default function Organization() {
  return (
    <LovePage trackPageView={'social'}>
      <h3 className="text-4xl font-bold text-center mt-8 mb-8">Organization</h3>
      <Col
        className={clsx(
          'pb-[58px] lg:pb-0', // bottom bar padding
          'text-ink-1000 mx-auto w-full grid grid-cols-1 gap-8 max-w-3xl sm:grid-cols-2 lg:min-h-0 lg:pt-4 mt-4',
        )}
      >
        <GeneralButton url={'/support'} content={'Support'}/>
        <GeneralButton url={'/constitution'} content={'Constitution'}/>
        <GeneralButton url={'/vote'} content={'Proposals'}/>
        <GeneralButton url={'/financials'} content={'Financials'}/>
        <GeneralButton url={'/stats'} content={'Growth & Stats'}/>
        <GeneralButton url={'/terms'} content={'Terms and Conditions'}/>
        <GeneralButton url={'/privacy'} content={'Privacy Policy'}/>
      </Col>
    </LovePage>
  )
}
