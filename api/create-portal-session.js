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

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  // Get the Stripe customer ID from Supabase
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error || !profile?.stripe_customer_id) {
    return res.status(404).json({ error: "No Stripe customer found" });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: "https://stockpulse-delta-eight.vercel.app/",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Portal error:", err);
    return res.status(500).json({ error: err.message });
  }
}