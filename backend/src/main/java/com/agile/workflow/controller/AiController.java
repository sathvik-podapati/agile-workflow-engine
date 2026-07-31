package com.agile.workflow.controller;

import com.agile.workflow.model.Comment;
import com.agile.workflow.model.Role;
import com.agile.workflow.model.Subtask;
import com.agile.workflow.model.TaskCard;
import com.agile.workflow.model.User;
import com.agile.workflow.repository.CommentRepository;
import com.agile.workflow.repository.TaskCardRepository;
import com.agile.workflow.repository.UserRepository;
import com.agile.workflow.service.AiService;
import com.agile.workflow.service.GitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;
    private final GitService gitService;
    private final TaskCardRepository taskCardRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    @Autowired
    public AiController(AiService aiService,
                        GitService gitService,
                        TaskCardRepository taskCardRepository,
                        CommentRepository commentRepository,
                        UserRepository userRepository) {
        this.aiService = aiService;
        this.gitService = gitService;
        this.taskCardRepository = taskCardRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    public static class SuggestRequest {
        public String title;
    }

    public static class AuditRequest {
        public Long taskId;
    }

    @PostMapping("/suggest-task")
    public ResponseEntity<AiService.TaskBreakdownResponse> suggestTask(@RequestBody SuggestRequest request) {
        if (request.title == null || request.title.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        AiService.TaskBreakdownResponse response = aiService.generateTaskBreakdown(request.title);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/audit-task")
    public ResponseEntity<Comment> auditTask(
            @RequestBody AuditRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {

        if (request.taskId == null) {
            return ResponseEntity.badRequest().build();
        }

        TaskCard task = taskCardRepository.findById(request.taskId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Task card not found"));

        if (task.isDeleted()) {
            throw new jakarta.persistence.EntityNotFoundException("Task card has been deleted");
        }

        // Gather subtask descriptions with completion status to pass to review prompt
        List<String> subtaskTitles = task.getSubtasks().stream()
                .map(s -> (s.isCompleted() ? "[DONE] " : "[PENDING] ") + s.getTitle())
                .collect(Collectors.toList());

        // Fetch Git Code Diff using GitService
        String gitDiff = gitService.fetchGitDiff(task.getGitRepo(), task.getGitCommitHash() != null ? task.getGitCommitHash() : task.getGitBranch());

        // Call Gemini Service with Git Code Diff Context
        String reviewText = aiService.generateAuditReview(
                task.getTitle(),
                task.getDescription() != null ? task.getDescription() : "",
                subtaskTitles,
                gitDiff
        );

        // Fetch or create "AI Auditor" system user
        User aiAuditor = getOrCreateAiAuditorUser();

        // Create and save review comment
        Comment comment = new Comment(reviewText, task, aiAuditor);
        Comment savedComment = commentRepository.save(comment);

        // Broadcast WebSockets update
        UpdateWebSocketHandler.broadcastUpdate();

        return ResponseEntity.ok(savedComment);
    }

    @GetMapping("/diff")
    public ResponseEntity<String> getGitDiff(
            @RequestParam(required = false) String repo,
            @RequestParam(required = false) String ref) {
        String diff = gitService.fetchGitDiff(repo, ref);
        return ResponseEntity.ok(diff != null ? diff : "No diff output available.");
    }



    @PostMapping("/webhooks/github")
    public ResponseEntity<java.util.Map<String, Object>> handleGitHubWebhook(@RequestBody(required = false) String payload) {
        System.out.println("[GitHub Webhook Event Received] Processing repository event...");
        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("status", "RECEIVED");
        res.put("message", "GitHub Webhook event logged and processed successfully.");
        return ResponseEntity.ok(res);
    }

    private synchronized User getOrCreateAiAuditorUser() {
        Optional<User> existing = userRepository.findByUsername("AI Auditor");
        if (existing.isPresent()) {
            return existing.get();
        }
        User auditor = new User(
                "AI Auditor",
                "ai.auditor@agileworkflow.com",
                Role.QUALITY_ASSURANCE,
                "ai_secure_hash_password_9988"
        );
        auditor.setDeleted(false);
        return userRepository.save(auditor);
    }
}
