import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JWTPayload, ROLE } from '../auth.types';

class RoleGuard implements CanActivate {
  private role: ROLE;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const payload: JWTPayload = request['user'];

    if ((payload.role = this.role)) return true;

    return false;
  }

  setRole(role: ROLE) {
    this.role = role;
  }
}

/** create role based guard
 * * used only after AuthGuard
 */
export function roleGuardFactory(role: ROLE): RoleGuard {
  const guard = new RoleGuard();
  guard.setRole(role);
  return guard;
}
