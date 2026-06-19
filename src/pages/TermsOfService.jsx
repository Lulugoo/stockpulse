export default function TermsOfService({ dark }) {
  const textSecondary = dark ? "text-gray-400" : "text-gray-600";
  const headingColor = dark ? "text-gray-100" : "text-gray-900";
  const borderColor = dark ? "border-white/10" : "border-black/10";
  const pageBg = dark ? "bg-[#2C2C2A]" : "bg-[#F1EFE8]";
  const cardBg = dark ? "bg-[#444441]" : "bg-white";

  return (
    <div className={`min-h-screen w-full ${pageBg} transition-colors`}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <a href="/" className="inline-flex items-center mb-6 text-xl font-extrabold tracking-tight text-gray-900">
          Stock<span className="text-emerald-500">Pulse</span>
        </a>
        <div className={`rounded-2xl ${cardBg} p-8 shadow-sm`}>
          <h1 className={`text-2xl font-bold mb-1 ${headingColor}`}>Terms of Service</h1>
          <p className={`text-xs mb-8 ${textSecondary}`}>Last updated: June 19, 2025</p>

          {[
            {
              title: "1. Acceptance of Terms",
              body: "By creating an account or using StockPulse, you agree to these Terms of Service. If you do not agree, please do not use the service."
            },
            {
              title: "2. Description of Service",
              body: "StockPulse is a stock analysis tool that provides fundamental scoring based on publicly available financial data. It is for informational purposes only and does not constitute financial, investment, or professional advice. We are not a registered investment advisor. Nothing on StockPulse should be construed as a recommendation to buy or sell any security."
            },
            {
              title: "3. Eligibility",
              body: "You must be at least 18 years old to use StockPulse. By using the service, you represent that you meet this requirement."
            },
            {
              title: "4. Account Responsibilities",
              body: "You are responsible for maintaining the confidentiality of your account credentials and all activity that occurs under your account. You may not share your account with others or create multiple accounts to circumvent usage limits."
            },
            {
              title: "5. Free Plan and Pro Subscription",
              body: "The free plan includes up to 5 stock lookups per day, resetting at midnight UTC. The Pro plan includes unlimited lookups, compare mode, and other Pro features. Billed monthly ($6.99/mo) or annually ($49/yr). Subscriptions auto-renew unless cancelled. Prices may change with 30 days' notice."
            },
            {
              title: "6. Acceptable Use",
              body: "You agree not to use StockPulse for any unlawful purpose, attempt to circumvent usage limits, scrape or redistribute data from the service, reverse engineer the software, or use automated tools or bots to access the service."
            },
            {
              title: "7. Intellectual Property",
              body: "All content, branding, scoring algorithms, and software on StockPulse are owned by us. You may not copy, reproduce, or distribute any part of the service without written permission. Financial data is sourced from Alpha Vantage and subject to their terms."
            },
            {
              title: "8. Disclaimer of Warranties",
              body: "StockPulse is provided 'as is' without warranties of any kind. We do not guarantee the accuracy of financial data, uninterrupted access to the service, or that the service will meet your investment needs. Market data may be delayed and should not be used for time-sensitive trading decisions."
            },
            {
              title: "9. Limitation of Liability",
              body: "To the maximum extent permitted by Ontario law, our total liability for any claim shall not exceed the amount you paid us in the 12 months prior to the claim. We are not liable for any indirect, incidental, or consequential damages."
            },
            {
              title: "10. Governing Law",
              body: "These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein. Any disputes shall be resolved in the courts of Ontario."
            },
            {
              title: "11. Changes to Terms",
              body: "We may update these terms from time to time. We will notify you of material changes by posting a notice in the app or by email. Continued use after changes constitutes acceptance."
            },
            {
              title: "12. Contact",
              body: "Questions about these terms? Email us at support@sundayvalue.ca - app managing team."
            },
          ].map((section) => (
            <div key={section.title} className={`mb-6 pb-6 border-b last:border-b-0 last:mb-0 last:pb-0 ${borderColor}`}>
              <h2 className={`text-sm font-semibold mb-2 ${headingColor}`}>{section.title}</h2>
              <p className={`text-sm leading-relaxed ${textSecondary}`}>{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}