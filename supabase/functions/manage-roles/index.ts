import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("Missing env vars");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "No authorization header" }, 401);
    }

    // Verify the requesting user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Check if requesting user is admin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleCheck) {
      return jsonResponse({ error: "Forbidden: Admin only" }, 403);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST: Get all users with their roles
    if (req.method === "GET" && action === "list") {
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) throw listError;

      const { data: roles } = await adminClient.from("user_roles").select("*");

      const usersWithRoles = users.map((u) => {
        const userRole = roles?.find((r) => r.user_id === u.id);
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          role: userRole?.role || null,
          role_id: userRole?.id || null,
        };
      });

      return jsonResponse(usersWithRoles);
    }

    // CREATE: Create a new user
    if (req.method === "POST" && action === "create") {
      const { email, password, role } = await req.json();

      if (!email || !password) {
        return jsonResponse({ error: "email and password are required" }, 400);
      }

      if (password.length < 6) {
        return jsonResponse({ error: "Password must be at least 6 characters" }, 400);
      }

      const validRoles = ["admin", "data_entry", "viewer"];
      if (role && !validRoles.includes(role)) {
        return jsonResponse({ error: "Invalid role" }, 400);
      }

      // Create the user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        console.error("Create user error:", createError);
        const msg = createError.message?.includes("already")
          ? "User with this email already exists"
          : "Failed to create user";
        return jsonResponse({ error: msg }, 400);
      }

      // Assign role if provided
      if (role && newUser.user) {
        const { error: roleError } = await adminClient
          .from("user_roles")
          .insert({ user_id: newUser.user.id, role });
        if (roleError) {
          console.error("Assign role error:", roleError);
        }
      }

      console.log("User created:", newUser.user?.id);
      return jsonResponse({ success: true, user_id: newUser.user?.id });
    }

    // ASSIGN: Assign or update a role
    if (req.method === "POST" && action === "assign") {
      const { user_id, role } = await req.json();

      if (!user_id || !role) {
        return jsonResponse({ error: "user_id and role are required" }, 400);
      }

      const validRoles = ["admin", "data_entry", "viewer"];
      if (!validRoles.includes(role)) {
        return jsonResponse({ error: "Invalid role" }, 400);
      }

      if (user_id === user.id && role !== "admin") {
        return jsonResponse({ error: "Cannot change your own admin role" }, 400);
      }

      const { data: existing } = await adminClient
        .from("user_roles")
        .select("id")
        .eq("user_id", user_id)
        .maybeSingle();

      if (existing) {
        const { error } = await adminClient
          .from("user_roles")
          .update({ role })
          .eq("user_id", user_id);
        if (error) throw error;
      } else {
        const { error } = await adminClient
          .from("user_roles")
          .insert({ user_id, role });
        if (error) throw error;
      }

      return jsonResponse({ success: true });
    }

    // REMOVE: Remove a role
    if (req.method === "DELETE" && action === "remove") {
      const { user_id } = await req.json();

      if (user_id === user.id) {
        return jsonResponse({ error: "Cannot remove your own role" }, 400);
      }

      const { error } = await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", user_id);
      if (error) throw error;

      return jsonResponse({ success: true });
    }

    // DELETE USER: Delete a user entirely
    if (req.method === "DELETE" && action === "delete_user") {
      const { user_id } = await req.json();

      if (!user_id) {
        return jsonResponse({ error: "user_id is required" }, 400);
      }

      if (user_id === user.id) {
        return jsonResponse({ error: "Cannot delete yourself" }, 400);
      }

      // Remove role first
      await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", user_id);

      // Delete the user from auth
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
      if (deleteError) {
        console.error("Delete user error:", deleteError);
        return jsonResponse({ error: "Failed to delete user" }, 400);
      }

      console.log("User deleted:", user_id);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("Edge function error:", error);
    return jsonResponse({ error: "An internal error occurred. Please try again later." }, 500);
  }
});
