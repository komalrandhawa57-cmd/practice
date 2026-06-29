import { Router } from "express";
import { 
  getIssues, 
  createIssue, 
  voteIssue, 
  verifyIssue, 
  addComment, 
  updateIssueStatus 
} from "../controllers/issueController";

const router = Router();

router.get("/", getIssues);
router.post("/", createIssue);
router.post("/:id/vote", voteIssue);
router.post("/:id/verify", verifyIssue);
router.post("/:id/comment", addComment);
router.post("/:id/update-status", updateIssueStatus);

export default router;
