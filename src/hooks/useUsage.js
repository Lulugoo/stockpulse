import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const FREE_LIMIT = 5;
const GUEST_LIMIT = 3;
const GUEST_KEY = "sp_guest_usage";

const todayStr = () => new Date().toISOString().slice(0, 10);

const getGuestUsage = () => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    return date === todayStr() ? count : 0;
  } catch {
    return 0;
  }
};

const incrementGuestUsage = () => {
  const count = getGuestUsage() + 1;
  localStorage.setItem(GUEST_KEY, JSON.stringify({ date: todayStr(), count }));
  return count;
};

export function useUsage(user) {
  const [usageCount, setUsageCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUsageCount(getGuestUsage());
      setIsPro(false);
      setLoading(false);
      return;
    }

    const fetchUsage = async () => {
      setLoading(true);

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("is_pro")
        .eq("id", user.id)
        .maybeSingle();


      setIsPro(profile?.is_pro === true);

      const { data: usage } = await supabase
        .from("user_usage")
        .select("lookup_count")
        .eq("user_id", user.id)
        .eq("date", todayStr())
        .maybeSingle();


      setUsageCount(usage?.lookup_count ?? 0);
      setLoading(false);
    };

    fetchUsage();
  }, [user]);

  const trackLookup = useCallback(async () => {
    if (isPro) return { allowed: true };

    const limit = user ? FREE_LIMIT : GUEST_LIMIT;

    if (usageCount >= limit) {
      return { allowed: false, count: usageCount, limit };
    }

    if (!user) {
      const newCount = incrementGuestUsage();
      setUsageCount(newCount);
      return { allowed: true, count: newCount, limit };
    }

    const newCount = usageCount + 1;
    setUsageCount(newCount);

    const { error } = await supabase
      .from("user_usage")
      .upsert(
        { user_id: user.id, date: todayStr(), lookup_count: newCount },
        { onConflict: "user_id,date" }
      );

    if (error) {
      console.error("Error tracking usage:", error);
      setUsageCount(usageCount);
    }

    return { allowed: true, count: newCount, limit };
  }, [user, usageCount, isPro]);

  const limit = user ? FREE_LIMIT : GUEST_LIMIT;
  const remaining = isPro ? Infinity : Math.max(0, limit - usageCount);
  const isAtLimit = !isPro && usageCount >= limit;

  return { usageCount, isPro, loading, trackLookup, remaining, isAtLimit, limit };
}