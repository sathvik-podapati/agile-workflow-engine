package com.agile.workflow.controller;

import com.agile.workflow.model.Priority;
import com.agile.workflow.model.TaskCard;
import com.agile.workflow.model.Comment;
import com.agile.workflow.model.Subtask;
import com.agile.workflow.model.User;
import com.agile.workflow.repository.CommentRepository;
import com.agile.workflow.repository.SubtaskRepository;
import com.agile.workflow.repository.UserRepository;
import com.agile.workflow.service.TaskCardService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class TaskCardController {

    private final TaskCardService taskCardService;
    private final CommentRepository commentRepository;
    private final SubtaskRepository subtaskRepository;
    private final UserRepository userRepository;

    @Autowired
    public TaskCardController(TaskCardService taskCardService,
                              CommentRepository commentRepository,
                              SubtaskRepository subtaskRepository,
                              UserRepository userRepository) {
        this.taskCardService = taskCardService;
        this.commentRepository = commentRepository;
        this.subtaskRepository = subtaskRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/columns/{columnId}/tasks")
    public ResponseEntity<List<TaskCard>> getTasksByColumnId(@PathVariable Long columnId, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(taskCardService.getTasksByColumnId(columnId, userId));
    }

    @PostMapping("/columns/{columnId}/tasks")
    public ResponseEntity<TaskCard> createTask(@PathVariable Long columnId, @Valid @RequestBody TaskCard task, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        TaskCard created = taskCardService.createTask(columnId, task, userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<TaskCard> updateTask(@PathVariable Long id, @Valid @RequestBody TaskCard task, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        TaskCard updated = taskCardService.updateTask(id, task, userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        taskCardService.deleteTask(id, userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/tasks/{id}/move")
    public ResponseEntity<TaskCard> moveTask(@PathVariable Long id, @Valid @RequestBody MoveTaskRequest moveRequest, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        TaskCard moved = taskCardService.moveTask(id, moveRequest.getTargetColumnId(), moveRequest.getNewSequenceIndex(), userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.ok(moved);
    }

    @GetMapping("/workspaces/{workspaceId}/tasks/filter")
    public ResponseEntity<List<TaskCard>> getFilteredTasks(
            @PathVariable Long workspaceId,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Boolean overdue,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        List<TaskCard> filtered = taskCardService.getFilteredTasks(workspaceId, priority, overdue, search, sortBy, sortOrder, userId);
        return ResponseEntity.ok(filtered);
    }

    @PatchMapping("/tasks/{id}/approve")
    public ResponseEntity<TaskCard> approveTask(@PathVariable Long id, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        TaskCard approved = taskCardService.approveTask(id, userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.ok(approved);
    }

    @PatchMapping("/tasks/{id}/reject")
    public ResponseEntity<TaskCard> rejectTask(@PathVariable Long id, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        TaskCard rejected = taskCardService.rejectTask(id, userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.ok(rejected);
    }

    @PostMapping("/tasks/{id}/comments")
    public ResponseEntity<Comment> addComment(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        if (userId == null) {
            throw new AccessDeniedException("User authentication required");
        }
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));
        
        TaskCard task = taskCardService.getTaskById(id, userId);
        
        String text = payload.get("text");
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Comment text cannot be empty");
        }
        
        Comment comment = new Comment(text, task, author);
        Comment saved = commentRepository.save(comment);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/tasks/{id}/subtasks")
    public ResponseEntity<Subtask> addSubtask(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        if (userId == null) {
            throw new AccessDeniedException("User authentication required");
        }
        TaskCard task = taskCardService.getTaskById(id, userId);
        
        String title = payload.get("title");
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Subtask title is required");
        }
        
        Subtask subtask = new Subtask(title, task);
        Subtask saved = subtaskRepository.save(subtask);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PatchMapping("/subtasks/{subtaskId}/toggle")
    public ResponseEntity<Subtask> toggleSubtask(
            @PathVariable Long subtaskId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        if (userId == null) {
            throw new AccessDeniedException("User authentication required");
        }
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Subtask not found"));
        
        taskCardService.getTaskById(subtask.getTaskCard().getId(), userId);
        
        subtask.setCompleted(!subtask.isCompleted());
        Subtask saved = subtaskRepository.save(subtask);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/subtasks/{subtaskId}")
    public ResponseEntity<Void> deleteSubtask(
            @PathVariable Long subtaskId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        if (userId == null) {
            throw new AccessDeniedException("User authentication required");
        }
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Subtask not found"));
        
        taskCardService.getTaskById(subtask.getTaskCard().getId(), userId);
        
        subtaskRepository.delete(subtask);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.noContent().build();
    }
}

