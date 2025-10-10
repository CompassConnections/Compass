import {LovePage} from 'web/components/love-page'
import {GeneralButton} from "web/components/buttons/general-button";


export default function Organization() {
  return (
    <LovePage trackPageView={'social'}>
      <div className="text-gray-600 dark:text-white min-h-screen p-6">
        <div className="w-full">
          <div className="relative py-8 mt-12 overflow-hidden">
            <div className="relative z-10 max-w-3xl mx-auto px-4">
              <h3 className="text-4xl font-bold text-center mt-8 mb-8">Organization</h3>
              <GeneralButton url={'/support'} content={'Support'}/>
              <GeneralButton url={'/constitution'} content={'Constitution'}/>
              <GeneralButton url={'/financials'} content={'Financials'}/>
              <GeneralButton url={'/terms'} content={'Terms and Conditions'}/>
              <GeneralButton url={'/privacy'} content={'Privacy Policy'}/>
            </div>
          </div>
        </div>
      </div>
    </LovePage>
  )
}
