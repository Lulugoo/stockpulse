import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useFavorites(user) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------- helpers ----------

  const getLocalFavorites = () => {
    try {
      return JSON.parse(localStorage.getItem("sp_favorites") || "[]");
    } catch {
      return [];
    }
  };

  const setLocalFavorites = (favs) => {
    localStorage.setItem("sp_favorites", JSON.stringify(favs));
  };

  // ---------- load ----------

  useEffect(() => {
    if (!user) {
      // Guest: read from localStorage
      setFavorites(getLocalFavorites());
      setLoading(false);
      return;
    }

    // Logged-in: fetch from Supabase
    const fetchFavorites = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_favorites")
        .select("symbol")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching favorites:", error);
        // Fall back to localStorage so UI doesn't break
        setFavorites(getLocalFavorites());
      } else {
        const symbols = data.map((row) => row.symbol);
        setFavorites(symbols);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  // When a user logs in, migrate any localStorage favorites up to Supabase
  useEffect(() => {
    if (!user || loading) return;

    const localFavs = getLocalFavorites();
    if (localFavs.length === 0) return;

    const migrateToSupabase = async () => {
      // Insert local favs that aren't already in the DB (upsert ignores duplicates)
      const rows = localFavs.map((symbol) => ({
        user_id: user.id,
        symbol,
      }));

      const { error } = await supabase
        .from("user_favorites")
        .upsert(rows, { onConflict: "user_id,symbol", ignoreDuplicates: true });

      if (!error) {
        // Clear localStorage after successful migration
        localStorage.removeItem("sp_favorites");
        setFavorites((prev) => {
          const merged = Array.from(new Set([...prev, ...localFavs]));
          return merged;
        });
      }
    };

    migrateToSupabase();
  }, [user, loading]);

  // ---------- toggle ----------

  const toggleFavorite = useCallback(
    async (symbol) => {
      const isFav = favorites.includes(symbol);

      // Optimistic update
      setFavorites((prev) =>
        isFav ? prev.filter((t) => t !== symbol) : [symbol, ...prev]
      );

      if (!user) {
        // Guest: persist to localStorage
        const updated = isFav
          ? getLocalFavorites().filter((t) => t !== symbol)
          : [symbol, ...getLocalFavorites()];
        setLocalFavorites(updated);
        return;
      }

      // Logged-in: sync with Supabase
      if (isFav) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("symbol", symbol);

        if (error) {
          console.error("Error removing favorite:", error);
          // Revert optimistic update
          setFavorites((prev) => [symbol, ...prev]);
        }
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, symbol });

        if (error) {
          console.error("Error adding favorite:", error);
          // Revert optimistic update
          setFavorites((prev) => prev.filter((t) => t !== symbol));
        }
      }
    },
    [favorites, user]
  );

  return { favorites, loading, toggleFavorite };
}