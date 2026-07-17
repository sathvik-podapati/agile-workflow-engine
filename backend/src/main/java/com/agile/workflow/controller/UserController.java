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
    private final com.agile.workflow.service.EmailService emailService;
    private final java.util.Map<Long, String> activeOtps = new java.util.concurrent.ConcurrentHashMap<>();

    @Autowired
    public UserController(UserRepository userRepository,
                          WorkspaceRepository workspaceRepository,
                          TaskCardRepository taskCardRepository,
                          com.agile.workflow.service.EmailService emailService) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.taskCardRepository = taskCardRepository;
        this.emailService = emailService;
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
        
        String pwd = newUser.getPassword();
        newUser.setDeleted(false);
        User saved = userRepository.save(newUser);
        
        // Dispatch email notification to newly added user
        try {
            emailService.sendUserCreatedEmail(saved, pwd);
        } catch (Exception e) {
            System.err.println("User created email notification error: " + e.getMessage());
        }

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

        // Soft delete user and release email/username unique constraints
        targetUser.setDeleted(true);
        targetUser.setEmail(targetUser.getEmail() + ".deleted." + System.currentTimeMillis());
        targetUser.setUsername(targetUser.getUsername() + ".deleted." + System.currentTimeMillis());
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

    @PostMapping("/send-otp")
    public ResponseEntity<java.util.Map<String, String>> sendOtp(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        if (userId == null) {
            throw new com.agile.workflow.controller.AccessDeniedException("User authentication required");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));
                
        // Generate random 6-digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        activeOtps.put(userId, otp);
        
        // Dispatch OTP Email Notification
        try {
            emailService.sendOtpEmail(user, otp);
        } catch (Exception e) {
            System.err.println("OTP Email dispatch error: " + e.getMessage());
        }

        // Log to console for local testing
        System.out.println("\n==============================================");
        System.out.println("  [OTP SERVICE] Generated OTP for user: " + user.getUsername());
        System.out.println("  Registered Email: " + user.getEmail());
        System.out.println("  OTP Code: " + otp);
        System.out.println("==============================================\n");
        
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("message", "OTP sent successfully to " + maskEmail(user.getEmail()));
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @RequestBody java.util.Map<String, String> payload,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        if (userId == null) {
            throw new com.agile.workflow.controller.AccessDeniedException("User authentication required");
        }
        
        String inputOtp = payload.get("otp");
        String newPassword = payload.get("newPassword");
        
        if (inputOtp == null || newPassword == null || newPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("OTP code and new password are required");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));
                
        String activeOtp = activeOtps.get(userId);
        if (activeOtp == null || !activeOtp.equals(inputOtp.trim())) {
            throw new com.agile.workflow.controller.AccessDeniedException("Invalid or expired OTP code");
        }
        
        // Valid OTP - Update password & clear OTP from cache
        user.setPassword(newPassword);
        userRepository.save(user);
        activeOtps.remove(userId);
        
        return ResponseEntity.noContent().build();
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        int atIndex = email.indexOf("@");
        String local = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        if (local.length() <= 2) {
            return local.charAt(0) + "***" + domain;
        }
        return local.charAt(0) + "***" + local.charAt(local.length() - 1) + domain;
    }
}

