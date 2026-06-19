export default function PrivacyPolicy({ dark }) {
  const textPrimary = dark ? "text-gray-100" : "text-gray-900";
  const textSecondary = dark ? "text-gray-400" : "text-gray-600";
  const headingColor = dark ? "text-gray-100" : "text-gray-900";
  const borderColor = dark ? "border-white/10" : "border-black/10";
  const pageBg = dark ? "bg-[#2C2C2A]" : "bg-[#F1EFE8]";
  const cardBg = dark ? "bg-[#444441]" : "bg-white";

  return (
    <div className={`min-h-screen w-full ${pageBg} transition-colors`}>
      <div className={`mx-auto max-w-2xl px-4 py-12`}>
        <a href="/" className="inline-flex items-center gap-1 mb-6 text-xl font-extrabold tracking-tight">
          Stock<span className="text-emerald-500">Pulse</span>
        </a>
        <div className={`rounded-2xl ${cardBg} p-8 shadow-sm`}>
          <h1 className={`text-2xl font-bold mb-1 ${headingColor}`}>Privacy Policy</h1>
          <p className={`text-xs mb-8 ${textSecondary}`}>Last updated: June 19, 2025</p>

          {[
            {
              title: "1. Who We Are",
              body: "StockPulse is a stock analysis service operated by an individual based in Ontario, Canada. You can reach us at support@sundayvalue.ca - app managing team."
            },
            {
              title: "2. Information We Collect",
              body: "We collect your email address when you sign up, stock tickers you look up (to enforce daily limits), your favorites list, and basic usage data. Payment information is processed by Stripe — we never store your card details. We do not collect your name, address, or phone number."
            },
            {
              title: "3. How We Use Your Information",
              body: "We use your information to provide the StockPulse service, enforce free plan limits, process payments, and send transactional emails (receipts, account confirmation). We do not sell, rent, or share your information with third parties for marketing purposes."
            },
            {
              title: "4. Third-Party Services",
              body: "We use Supabase for authentication and database storage, Stripe for payment processing, Alpha Vantage for stock market data, and Vercel for hosting. Each has their own privacy policy."
            },
            {
              title: "5. Data Retention",
              body: "We retain your account data for as long as your account is active. If you delete your account, your data is permanently deleted within 30 days."
            },
            {
              title: "6. Your Rights (PIPEDA & Ontario)",
              body: "Under Canadian privacy law (PIPEDA), you have the right to access, correct, or request deletion of your personal information, and to withdraw consent to data processing. To exercise these rights, email us at support@sundayvalue.ca - app managing team."
            },
            {
              title: "7. Cookies",
              body: "We use essential cookies only — for authentication sessions and user preferences such as dark mode. We do not use advertising or tracking cookies."
            },
            {
              title: "8. Security",
              body: "We use industry-standard security measures including HTTPS, hashed passwords, and row-level security on our database. No method of transmission over the internet is 100% secure."
            },
            {
              title: "9. Children's Privacy",
              body: "StockPulse is not intended for users under the age of 18. We do not knowingly collect information from minors."
            },
            {
              title: "10. Changes to This Policy",
              body: "We may update this policy from time to time. We will notify you of significant changes by posting a notice in the app. Continued use of StockPulse after changes constitutes acceptance."
            },
            {
              title: "11. Contact",
              body: "Questions about this policy? Email us at support@sundayvalue.ca - app managing team."
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