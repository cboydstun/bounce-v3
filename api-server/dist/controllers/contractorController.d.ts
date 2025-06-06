import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
declare class ContractorController {
  /**
   * Get contractor profile
   */
  getProfile(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Update contractor profile
   */
  updateProfile(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Update contractor profile photo
   */
  updateProfilePhoto(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Get contractor earnings summary
   */
  getEarningsSummary(req: AuthenticatedRequest, res: Response): Promise<void>;
  /**
   * Helper method to categorize skills
   */
  private getSkillCategory;
}
export declare const contractorController: ContractorController;
export default contractorController;
//# sourceMappingURL=contractorController.d.ts.map
