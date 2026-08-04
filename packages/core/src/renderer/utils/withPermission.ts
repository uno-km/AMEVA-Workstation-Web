import { useProcessStore } from '../stores/useProcessStore';
import type { PermissionScope } from '../stores/useProcessStore';

/**
 * HOC decorator for functions to require a specific permission.
 * If the user does not have the permission, it throws an error or returns a fallback.
 */
export function withPermission<T extends (...args: any[]) => any>(
  scope: PermissionScope,
  fn: T,
  fallback?: ReturnType<T>
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return (...args: Parameters<T>) => {
    const hasPermission = useProcessStore.getState().hasPermission;
    if (hasPermission(scope)) {
      return fn(...args);
    }
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Permission denied: Requires ${scope}`);
  };
}
