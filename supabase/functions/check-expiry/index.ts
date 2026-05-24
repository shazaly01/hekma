import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth guard: require shared secret or valid service-role Authorization
  const cronSecret = Deno.env.get("CRON_SECRET");
  const incomingSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("Authorization");

  const isAuthorizedViaCron = cronSecret && incomingSecret === cronSecret;
  const isAuthorizedViaServiceRole = authHeader?.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "NONE");

  if (!isAuthorizedViaCron && !isAuthorizedViaServiceRole) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);
    const in14 = new Date(now);
    in14.setDate(in14.getDate() + 14);
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);

    const todayStr = now.toISOString().split("T")[0];
    const in7Str = in7.toISOString().split("T")[0];
    const in14Str = in14.toISOString().split("T")[0];
    const in30Str = in30.toISOString().split("T")[0];

    // Fetch cards expiring within 30 days or already expired (not destroyed)
    const { data: expiringCards, error: cardsError } = await supabase
      .from("employee_cards")
      .select("id, expiry_date, employee_id, card_types(name), employees(name)")
      .or(`is_destroyed.is.null,is_destroyed.eq.false`)
      .not("expiry_date", "is", null)
      .lte("expiry_date", in30Str)
      .order("expiry_date", { ascending: true });

    if (cardsError) throw cardsError;
    if (!expiringCards || expiringCards.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expiring cards found", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all admin users to notify them
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) throw rolesError;
    const adminUserIds = (adminRoles || []).map((r: any) => r.user_id);

    if (adminUserIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No admin users to notify", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check existing notifications from today to avoid duplicates
    const { data: existingNotifs } = await supabase
      .from("notifications")
      .select("entity_id")
      .eq("entity_type", "card_expiry")
      .gte("created_at", `${todayStr}T00:00:00Z`);

    const existingCardIds = new Set(
      (existingNotifs || []).map((n: any) => n.entity_id)
    );

    const notifications: any[] = [];

    for (const card of expiringCards) {
      if (existingCardIds.has(card.id)) continue;

      const expDate = new Date(card.expiry_date);
      const diffDays = Math.ceil(
        (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const employeeName = (card as any).employees?.name || "غير معروف";
      const cardTypeName = (card as any).card_types?.name || "بطاقة";

      let title: string;
      let type: string;

      if (diffDays < 0) {
        title = `بطاقة منتهية الصلاحية`;
        type = "error";
      } else if (diffDays <= 7) {
        title = `بطاقة تنتهي خلال ${diffDays} يوم`;
        type = "warning";
      } else if (diffDays <= 14) {
        title = `بطاقة تنتهي خلال ${diffDays} يوم`;
        type = "warning";
      } else {
        title = `بطاقة تنتهي خلال ${diffDays} يوم`;
        type = "info";
      }

      const message = `${cardTypeName} للموظف "${employeeName}" تنتهي بتاريخ ${card.expiry_date}`;

      for (const userId of adminUserIds) {
        notifications.push({
          user_id: userId,
          title,
          message,
          type,
          entity_type: "card_expiry",
          entity_id: card.id,
        });
      }
    }

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);
      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({
        message: "Expiry check completed",
        notificationsCreated: notifications.length,
        cardsChecked: expiringCards.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-expiry:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
