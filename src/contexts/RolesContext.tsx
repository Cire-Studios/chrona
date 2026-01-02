import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Role {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

interface RolesContextType {
  roles: Role[];
  activeRole: Role | null;
  loading: boolean;
  setActiveRole: (role: Role | null) => void;
  createRole: (role: Omit<Role, "id" | "user_id" | "created_at" | "updated_at">) => Promise<Role | null>;
  updateRole: (id: string, updates: Partial<Role>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  archiveRole: (id: string) => Promise<void>;
  canDeleteRole: (id: string) => Promise<boolean>;
  refreshRoles: () => Promise<void>;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

export const RolesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    if (!user) {
      setRoles([]);
      setActiveRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRoles(data || []);
      
      // Set first active role as default if no active role selected
      if (!activeRole && data && data.length > 0) {
        const firstActive = data.find(r => r.is_active) || data[0];
        setActiveRole(firstActive);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [user]);

  const createRole = async (
    roleData: Omit<Role, "id" | "user_id" | "created_at" | "updated_at">
  ): Promise<Role | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("roles")
        .insert({
          ...roleData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setRoles((prev) => [data, ...prev]);
      
      // Set as active if it's the first role
      if (roles.length === 0) {
        setActiveRole(data);
      }

      toast({
        title: "Role created",
        description: `${data.title} has been added to your career roles.`,
      });

      return data;
    } catch (error) {
      console.error("Error creating role:", error);
      toast({
        title: "Error",
        description: "Failed to create role. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateRole = async (id: string, updates: Partial<Role>) => {
    try {
      const { error } = await supabase
        .from("roles")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setRoles((prev) =>
        prev.map((role) => (role.id === id ? { ...role, ...updates } : role))
      );

      if (activeRole?.id === id) {
        setActiveRole({ ...activeRole, ...updates });
      }

      toast({
        title: "Role updated",
        description: "Your role has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canDeleteRole = async (id: string): Promise<boolean> => {
    try {
      // Check if role has any journal entries
      const { count: entriesCount } = await supabase
        .from("journal_entries")
        .select("id", { count: "exact", head: true })
        .eq("role_id", id);

      if (entriesCount && entriesCount > 0) return false;

      // Check if role has any weekly reflections
      const { count: reflectionsCount } = await supabase
        .from("weekly_reflections")
        .select("id", { count: "exact", head: true })
        .eq("role_id", id);

      if (reflectionsCount && reflectionsCount > 0) return false;

      // Check if role has any quarterly records
      const { count: recordsCount } = await supabase
        .from("quarterly_records")
        .select("id", { count: "exact", head: true })
        .eq("role_id", id);

      if (recordsCount && recordsCount > 0) return false;

      return true;
    } catch (error) {
      console.error("Error checking role data:", error);
      return false;
    }
  };

  const archiveRole = async (id: string) => {
    try {
      const { error } = await supabase
        .from("roles")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      setRoles((prev) =>
        prev.map((role) => (role.id === id ? { ...role, is_active: false } : role))
      );

      if (activeRole?.id === id) {
        const remaining = roles.filter((r) => r.id !== id && r.is_active);
        setActiveRole(remaining[0] || null);
      }

      toast({
        title: "Role archived",
        description: "The role has been archived and can be restored later.",
      });
    } catch (error) {
      console.error("Error archiving role:", error);
      toast({
        title: "Error",
        description: "Failed to archive role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteRole = async (id: string) => {
    try {
      // First check if deletion is allowed
      const canDelete = await canDeleteRole(id);
      
      if (!canDelete) {
        toast({
          title: "Cannot delete role",
          description: "This role has associated data. Archive it instead.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("roles").delete().eq("id", id);

      if (error) throw error;

      setRoles((prev) => prev.filter((role) => role.id !== id));

      if (activeRole?.id === id) {
        const remaining = roles.filter((r) => r.id !== id);
        setActiveRole(remaining[0] || null);
      }

      toast({
        title: "Role deleted",
        description: "The role has been permanently removed.",
      });
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshRoles = async () => {
    await fetchRoles();
  };

  return (
    <RolesContext.Provider
      value={{
        roles,
        activeRole,
        loading,
        setActiveRole,
        createRole,
        updateRole,
        deleteRole,
        archiveRole,
        canDeleteRole,
        refreshRoles,
      }}
    >
      {children}
    </RolesContext.Provider>
  );
};

export const useRoles = () => {
  const context = useContext(RolesContext);
  if (context === undefined) {
    throw new Error("useRoles must be used within a RolesProvider");
  }
  return context;
};
