import { Injectable } from '@nestjs/common';
import { ORG_HIERARCHY_ENABLED } from '../config/org.config.js';

@Injectable()
export class OrgCompatService {
  /**
   * Resolve organisation context from ward IDs
   * Returns empty object when hierarchy is disabled
   */
  async resolveOrgContext({ wardIds }: { wardIds?: string[] }): Promise<{ trustId?: string; hospitalId?: string }> {
    if (!ORG_HIERARCHY_ENABLED) {
      return {};
    }

    // TODO: Implement when hierarchy is enabled
    // For now, return empty object to maintain compatibility
    return {};
  }

  /**
   * Apply hospital filter to a where clause
   * Returns original where clause when hierarchy is disabled or no hospitalId provided
   */
  applyHospitalFilter<T extends { hospitalId?: string }>(where: any, hospitalId?: string): any {
    if (!ORG_HIERARCHY_ENABLED || !hospitalId) {
      return where;
    }

    // Check if this is a Staff model (has wards relation)
    if (where.wards !== undefined) {
      // For Staff model, filter through wards that belong to the hospital
      const existingWardsFilter = where.wards;
      return {
        ...where,
        wards: {
          some: {
            hospitalId,
            ...existingWardsFilter.some
          }
        }
      };
    } else {
      // For models with direct hospitalId field (like ShiftType), filter directly
      return { ...where, hospitalId };
    }
  }

  /**
   * Apply ward filter to a where clause
   * Returns original where clause when hierarchy is disabled or no wardId provided
   */
  applyWardFilter<T extends { wardId?: string }>(where: any, wardId?: string): any {
    if (!ORG_HIERARCHY_ENABLED || !wardId) {
      return where;
    }

    return { ...where, wardId };
  }

  /**
   * Check if organisation hierarchy is enabled
   */
  isHierarchyEnabled(): boolean {
    return ORG_HIERARCHY_ENABLED;
  }
}
