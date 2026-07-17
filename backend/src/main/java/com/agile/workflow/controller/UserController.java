package com.agile.workflow.controller;

import com.agile.workflow.model.User;
import com.agile.workflow.model.Workspace;
import com.agile.workflow.model.TaskCard;
import com.agile.workflow.repository.UserRepository;
import com.agile.workflow.repository.WorkspaceRepository;
import com.agile.workflow.repository.TaskCardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final TaskCardRepository taskCardRepository;

    @Autowired
    public UserController(UserRepository userRepository,
                          WorkspaceRepository workspaceRepository,
                          TaskCardRepository taskCardRepository) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.taskCardRepository = taskCardRepository;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> all = userRepository.findAll();
        List<User> active = new java.util.ArrayList<>();
        for (User u : all) {
            if (!u.isDeleted()) {
                active.add(u);
            }
        }
        return ResponseEntity.ok(active);
    }

    @PostMapping
    public ResponseEntity<User> createUser(
            @jakarta.validation.Valid @RequestBody User newUser,
            @RequestHeader(value = "X-User-Id", required = false) Long creatorId) {
        
        if (creatorId == null) {
            throw new com.agile.workflow.controller.AccessDeniedException("User authentication required");
        }
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Admin user not found"));
        
        if (creator.getRole() != com.agile.workflow.model.Role.WORKSPACE_ADMIN) {
            throw new com.agile.workflow.controller.AccessDeniedException("Only Workspace Admins can create new users");
        }
        
        newUser.setDeleted(false);
        User saved = userRepository.save(newUser);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long creatorId) {
        
        if (creatorId == null) {
            throw new com.agile.workflow.controller.AccessDeniedException("User authentication required");
        }
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Admin user not found"));
        
        if (creator.getRole() != com.agile.workflow.model.Role.WORKSPACE_ADMIN) {
            throw new com.agile.workflow.controller.AccessDeniedException("Only Workspace Admins can delete users");
        }

        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found with id: " + id));

        if (targetUser.getRole() == com.agile.workflow.model.Role.WORKSPACE_ADMIN) {
            throw new com.agile.workflow.controller.AccessDeniedException("Administrator accounts cannot be deleted");
        }

        // Soft delete user
        targetUser.setDeleted(true);
        userRepository.save(targetUser);

        // Cascade membership cleanup
        List<Workspace> workspaces = workspaceRepository.findAll();
        for (Workspace ws : workspaces) {
            java.util.Set<User> members = ws.getAssignedMembers();
            boolean changed = false;
            User toRemove = null;
            for (User u : members) {
                if (u.getId().equals(id)) {
                    toRemove = u;
                    break;
                }
            }
            if (toRemove != null) {
                members.remove(toRemove);
                changed = true;
            }
            if (changed) {
                workspaceRepository.save(ws);
            }
        }

        // Cascade task assignment cleanup
        List<TaskCard> tasks = taskCardRepository.findAll();
        for (TaskCard task : tasks) {
            if (task.getAssignee() != null && task.getAssignee().getId().equals(id)) {
                task.setAssignee(null);
                taskCardRepository.save(task);
            }
        }

        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody java.util.Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        if (username == null || password == null) {
            throw new IllegalArgumentException("Username and password are required");
        }
        User user = userRepository.findAll().stream()
                .filter(u -> !u.isDeleted() && u.getUsername().equalsIgnoreCase(username))
                .findFirst()
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found: " + username));
                
        if (!password.equals(user.getPassword())) {
            throw new com.agile.workflow.controller.AccessDeniedException("Invalid username or password");
        }
        return ResponseEntity.ok(user);
    }
}

