/**
 * Home Page - Order Placement Interface
 */

import { 
  fetchProducts, 
  fetchDesignOptions, 
  fetchCustomizationOptions, 
  fetchCategories,
  fetchMergedConfigForStore,
  fetchStores 
} from '@/lib/googleSheets'
import OrderPageClient from '@/components/order/OrderPageClient'
import NewOrderForm from '@/components/order/NewOrderForm'
import { getEnvironment } from '@/lib/config'
import Image from 'next/image'

export default async function Home({
  searchParams,
}: {
  searchParams: { store?: string }
}) {
  // Get store from URL query param
  const storeSlug = searchParams.store

  // If no store is specified, we'll handle it on the client side
  // (checking localStorage and redirecting if needed)
  if (!storeSlug) {
    return <OrderPageClient />
  }

  // Fetch all required data (with store-specific filtering and config)
  const [products, designOptions, customizationOptions, categories, config] = await Promise.all([
    fetchProducts(storeSlug),
    fetchDesignOptions(),
    fetchCustomizationOptions(),
    fetchCategories(),
    fetchMergedConfigForStore(storeSlug),
  ])
  
  const environment = getEnvironment()
  const getCfgStr = (key: string) => (typeof config[key] === 'string' ? (config[key] as string).trim() : '')
  const pageTitle = getCfgStr('Page_Title')
  const headerTitle = getCfgStr('Header_Title')
  const headerSubtitle = getCfgStr('Header_Subtitle')
  const headerStoreSubtitle = getCfgStr('Header_Store_Subtitle')
  const headerLogo = getCfgStr('Header_Logo')
  const headerLogoSrc = headerLogo
    ? (headerLogo.startsWith('/') || headerLogo.startsWith('http')
        ? headerLogo
        : `/images/brand/${headerLogo}`)
    : '/images/brand/VL Design Logo.png'
  
  // Store-specific logo
  const storeLogoFile = getCfgStr('Store_Header_Logo')
  const storeLogoSrc = storeLogoFile
    ? (storeLogoFile.startsWith('/') || storeLogoFile.startsWith('http')
        ? storeLogoFile
        : `/images/brand/${storeLogoFile}`)
    : null
  
  const logoSizePx = Number(config.Logo_Size || 80)
  const instruction = getCfgStr('Page_Instruction')
  const businessName = (config.BusinessName as string) || 'CVL Designs'
  const catalogTitle = (config.Product_Catalog_Title as string) || ''
  const catalogInstruction = (config.Product_Catalog_Instruction as string) || ''
  const detailTitle = (config.Product_Detail_Title as string) || ''
  const detailInstruction = (config.Product_Detail_Instruction as string) || ''
  const primaryColor = getCfgStr('Store_Primary_Color')
  const accentColor = getCfgStr('Store_Accent_Color')
  const bgTransparency = Number(config.Background_Trans || 20) / 100 // Convert percentage to decimal
  const addProductBtn = getCfgStr('Add_Product_Button') || 'Add Product'
  const addAnotherProductBtn = getCfgStr('Add_Another_Product_Button') || 'Add Another Product'
  
  // Design and Customization Option labels
  const designOptionTitle = getCfgStr('Design_Option_Title')
  const designOptionInstructionRequired = getCfgStr('Design_Option_Instruction_Required')
  const designOptionInstructionOptional = getCfgStr('Design_Option_Instruction_Optional')
  const customizationOptionTitle = getCfgStr('Customization_Option_Title')
  const customizationOptionInstructionRequired = getCfgStr('Customization_Option_Instruction_Required')
  const customizationOptionInstructionOptional = getCfgStr('Customization_Option_Instruction_Optional')
  const noCostOptionLabel = getCfgStr('No_Cost_Option_Label')
  const submissionConfirmationMessage = getCfgStr('Submission_Confirmation_Message')
  const successfulSubmissionMessage = getCfgStr('Successful_Submission_Message')
  const pageInstructionReturn = getCfgStr('Page_Instruction_Return')
  const paymentMessage = getCfgStr('Payment_Message')
  const venmoMessage = getCfgStr('Venmo_Message')
  const zelleMessage = getCfgStr('Zelle_Message')
  const cashAppMessage = getCfgStr('CashApp_Message')
  const paymentQuestions = getCfgStr('Payment_Questions')
  const contactMeEmail = getCfgStr('ContactMeEmail') || getCfgStr('Contact_Me_Email')
  const contactMePhone = getCfgStr('ContactMePhone') || getCfgStr('Contact_Me_Phone')
  const confirmRemoveItem = getCfgStr('Confirm_Remove_Item')
  
  // Convert hex color to rgba with transparency
  const hexToRgba = (hex: string, alpha: number) => {
    if (!hex) return `rgba(249, 250, 251, ${alpha})`
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  
  const bgColorWithAlpha = primaryColor ? hexToRgba(primaryColor, bgTransparency) : '#f9fafb'
  
  return (
    <main className="min-h-screen" style={{ backgroundColor: bgColorWithAlpha }}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: CVLD Logo */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0" style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}>
                <Image
                  src={headerLogoSrc}
                  alt={`${businessName} Logo`}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-left">
                {headerTitle ? (<h1 className="text-3xl font-bold text-gray-900">{headerTitle}</h1>) : null}
                {headerSubtitle ? (<p className="text-gray-600">{headerSubtitle}</p>) : null}
                {headerStoreSubtitle ? (<p className="text-sm text-gray-500 italic">{headerStoreSubtitle}</p>) : null}
              </div>
            </div>
            
            {/* Right: Store Logo and Dev Badge */}
            <div className="flex items-center gap-4">
              {environment === 'development' && (
                <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded">
                  Development Mode
                </span>
              )}
              {storeLogoSrc && (
                <div className="relative flex-shrink-0" style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}>
                  <Image
                    src={storeLogoSrc}
                    alt="Store Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title and Instruction moved into NewOrderForm to hide after Add Product */}
        
        {/* Order Form */}
        <NewOrderForm
          products={products}
          designOptions={designOptions}
          customizationOptions={customizationOptions}
          categories={categories}
          pageTitle={pageTitle}
          instruction={instruction}
          productTitle={catalogTitle}
          productInstruction={catalogInstruction}
          productDetailTitle={detailTitle}
          productDetailInstruction={detailInstruction}
          storeSlug={storeSlug}
          accentColor={accentColor}
          addProductButtonLabel={addProductBtn}
          addAnotherProductButtonLabel={addAnotherProductBtn}
          designOptionTitle={designOptionTitle}
          designOptionInstructionRequired={designOptionInstructionRequired}
          designOptionInstructionOptional={designOptionInstructionOptional}
          customizationOptionTitle={customizationOptionTitle}
          customizationOptionInstructionRequired={customizationOptionInstructionRequired}
          customizationOptionInstructionOptional={customizationOptionInstructionOptional}
          noCostOptionLabel={noCostOptionLabel}
          submissionConfirmationMessage={submissionConfirmationMessage}
          successfulSubmissionMessage={successfulSubmissionMessage}
          pageInstructionReturn={pageInstructionReturn}
          paymentMessage={paymentMessage}
          venmoMessage={venmoMessage}
          zelleMessage={zelleMessage}
          cashAppMessage={cashAppMessage}
          paymentQuestions={paymentQuestions}
          contactMeEmail={contactMeEmail}
          contactMePhone={contactMePhone}
          confirmRemoveItem={confirmRemoveItem}
        />
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-sm">
              {config.Footer || `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`}
            </p>
            {contactMeEmail && (
              <a
                href={`mailto:${contactMeEmail}`}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Contact Us
              </a>
            )}
          </div>
        </div>
      </footer>
    </main>
  )
}

// Revalidate page every 5 minutes to fetch fresh products
export const revalidate = 300

