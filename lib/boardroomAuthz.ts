import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSupabaseUserFromRequest } from '@/lib/supabaseAuthServer';

export type BoardroomActor = {
  userId: string;
  role: string;
};

export async function requireBoardroomActor(req: Request): Promise<BoardroomActor> {
  const user = await getSupabaseUserFromRequest(req);
  if (!user) {
    const err = new Error('Unauthorized');
    (err as any).status = 401;
    throw err;
  }

  const supabase = getSupabaseAdmin();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) throw profileError;

  return { userId: user.id, role: profile?.role ?? 'buyer' };
}

export async function requireCanManageProperty(req: Request, propertyId: string) {
  const actor = await requireBoardroomActor(req);
  const supabase = getSupabaseAdmin();

  if (actor.role === 'broker_admin') return actor;

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('owner_user_id, assigned_broker_user_id')
    .eq('id', propertyId)
    .maybeSingle();
  if (propertyError) throw propertyError;
  if (!property) {
    const err = new Error('Property not found');
    (err as any).status = 404;
    throw err;
  }

  const allowed = property.owner_user_id === actor.userId || property.assigned_broker_user_id === actor.userId;
  if (!allowed) {
    const err = new Error('Forbidden');
    (err as any).status = 403;
    throw err;
  }

  return actor;
}

