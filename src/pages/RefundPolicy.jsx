export default function RefundPolicy({ dark }) {
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
          <h1 className={`text-2xl font-bold mb-1 ${headingColor}`}>Refund Policy</h1>
          <p className={`text-xs mb-8 ${textSecondary}`}>Last updated: June 19, 2026</p>

          {[
            {
              title: "14-Day Money-Back Guarantee",
              body: "If you are not satisfied with StockPulse Pro for any reason, you may request a full refund within 14 days of your initial purchase. No questions asked. Email us at support@sundayvalue.ca - app managing team with the subject line 'Refund Request' and include your account email. Refunds are processed within 5–10 business days to the original payment method."
            },
            {
              title: "After the 14-Day Period",
              body: "After the 14-day guarantee window, we do not offer refunds for partial billing periods, unused portions of an annual plan, or accounts that have been actively used during that billing period."
            },
            {
              title: "Cancellations",
              body: "You may cancel your Pro subscription at any time. Cancellation takes effect at the end of the current billing period — you retain Pro access until then and will not be charged for the next cycle. Annual plans are not prorated after the 14-day refund window."
            },
            {
              title: "Exceptions",
              body: "We may issue refunds outside the standard policy at our discretion in cases of billing errors, duplicate charges, or technical issues that prevented access to the service for an extended period. Contact us at support@sundayvalue.ca - app managing team if you believe you were charged in error."
            },
            {
              title: "Consumer Rights (Ontario)",
              body: "As an Ontario consumer, you may have additional rights under the Consumer Protection Act, 2002. Nothing in this policy limits those statutory rights. For more information, visit ontario.ca/consumerprotection."
            },
            {
              title: "Contact",
              body: "Refund requests and billing questions: support@sundayvalue.ca - app managing team. We typically respond within 3–5 business days."
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