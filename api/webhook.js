import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId || session.client_reference_id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (!userId) {
      return res.status(400).json({ error: "No userId found in session" });
    }

    const { error } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        is_pro: true,
        pro_since: new Date().toISOString(),
        stripe_customer_id: customerId,
      }, { onConflict: "id" });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Failed to update user profile" });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (profile) {
      await supabase
        .from("user_profiles")
        .update({ is_pro: false })
        .eq("id", profile.id);
    }
  }

  return res.status(200).json({ received: true });
}