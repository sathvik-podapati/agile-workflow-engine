package com.agile.workflow.service;

import com.agile.workflow.model.*;
import com.agile.workflow.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ColumnBlockRepository columnBlockRepository;
    private final TaskCardRepository taskCardRepository;
    private final SubtaskRepository subtaskRepository;
    private final CommentRepository commentRepository;

    @Autowired
    public DataInitializer(UserRepository userRepository, 
                           WorkspaceRepository workspaceRepository,
                           ColumnBlockRepository columnBlockRepository, 
                           TaskCardRepository taskCardRepository,
                           SubtaskRepository subtaskRepository,
                           CommentRepository commentRepository) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.columnBlockRepository = columnBlockRepository;
        this.taskCardRepository = taskCardRepository;
        this.subtaskRepository = subtaskRepository;
        this.commentRepository = commentRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Safely rename legacy demo users (Sarah, David, Alice) in place
        List<User> existing = userRepository.findAll();
        for (User u : existing) {
            if (u.getUsername().contains("Sarah")) {
                u.setUsername("Admin");
                u.setEmail("admin@company.com");
                u.setRole(Role.WORKSPACE_ADMIN);
                u.setPassword("admin123");
                userRepository.save(u);
            } else if (u.getUsername().contains("David")) {
                u.setUsername("Developer");
                u.setEmail("dev@company.com");
                u.setRole(Role.CONTRIBUTOR);
                u.setPassword("dev123");
                userRepository.save(u);
            } else if (u.getUsername().contains("Alice")) {
                u.setUsername("QA Auditor");
                u.setEmail("qa@company.com");
                u.setRole(Role.QUALITY_ASSURANCE);
                u.setPassword("qa123");
                userRepository.save(u);
            }
        }

        // Rename legacy workspaces if present
        List<Workspace> legacyWorkspaces = workspaceRepository.findAll();
        for (Workspace w : legacyWorkspaces) {
            if (w.getName().contains("Audit & Launch") || w.getName().contains("Enterprise Sprint")) {
                w.setName("My Project Workspace");
                workspaceRepository.save(w);
            }
        }

        // Seed clean minimal demo users if missing
        if (userRepository.findAll().stream().noneMatch(u -> u.getRole() == Role.WORKSPACE_ADMIN)) {
            userRepository.save(new User("Admin", "admin@company.com", Role.WORKSPACE_ADMIN, "admin123"));
        }
        if (userRepository.findAll().stream().noneMatch(u -> u.getRole() == Role.CONTRIBUTOR)) {
            userRepository.save(new User("Developer", "dev@company.com", Role.CONTRIBUTOR, "dev123"));
        }
        if (userRepository.findAll().stream().noneMatch(u -> u.getRole() == Role.QUALITY_ASSURANCE)) {
            userRepository.save(new User("QA Auditor", "qa@company.com", Role.QUALITY_ASSURANCE, "qa123"));
        }

        User admin = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.WORKSPACE_ADMIN)
                .findFirst().orElse(null);
        User dev = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.CONTRIBUTOR)
                .findFirst().orElse(null);
        User qa = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.QUALITY_ASSURANCE)
                .findFirst().orElse(null);

        // 2. Consolidate to 1 single clean active workspace
        List<Workspace> allWorkspaces = workspaceRepository.findAll();
        Workspace ws;
        if (allWorkspaces.isEmpty()) {
            ws = new Workspace("My Project Workspace", admin);
        } else {
            ws = allWorkspaces.get(0);
            ws.setName("My Project Workspace");
            ws.setCreator(admin);
            ws.setDeleted(false);
            // Delete extra duplicate workspaces
            for (int i = 1; i < allWorkspaces.size(); i++) {
                try {
                    workspaceRepository.delete(allWorkspaces.get(i));
                } catch (Exception ignored) {}
            }
        }

        Set<User> members = new HashSet<>();
        if (admin != null) members.add(admin);
        if (dev != null) members.add(dev);
        if (qa != null) members.add(qa);
        ws.setAssignedMembers(members);
        ws = workspaceRepository.save(ws);

        List<ColumnBlock> allCols = columnBlockRepository.findByWorkspaceIdOrderBySequenceIndexAsc(ws.getId());
        java.util.Map<String, ColumnBlock> uniqueColsMap = new java.util.LinkedHashMap<>();
        for (ColumnBlock c : allCols) {
            String key = c.getName().trim().toUpperCase();
            if (!uniqueColsMap.containsKey(key)) {
                c.setDeleted(false);
                columnBlockRepository.save(c);
                uniqueColsMap.put(key, c);
            } else {
                List<TaskCard> cardsInDup = taskCardRepository.findByColumnBlockIdOrderBySequenceIndexAsc(c.getId());
                ColumnBlock primary = uniqueColsMap.get(key);
                for (TaskCard card : cardsInDup) {
                    card.setColumnBlock(primary);
                    taskCardRepository.save(card);
                }
                try {
                    columnBlockRepository.delete(c);
                } catch (Exception ignored) {}
            }
        }
        List<ColumnBlock> cols = new java.util.ArrayList<>(uniqueColsMap.values());

        if (cols.isEmpty()) {
            ColumnBlock todo = columnBlockRepository.save(new ColumnBlock("To Do", 0, ws));
            ColumnBlock inProgress = columnBlockRepository.save(new ColumnBlock("In Progress", 1, ws));
            ColumnBlock done = columnBlockRepository.save(new ColumnBlock("Done", 2, ws));
            cols = List.of(todo, inProgress, done);
        }

        ColumnBlock todoCol = cols.stream().filter(c -> "To Do".equalsIgnoreCase(c.getName())).findFirst().orElse(cols.get(0));
        ColumnBlock inProgressCol = cols.stream().filter(c -> "In Progress".equalsIgnoreCase(c.getName())).findFirst().orElse(cols.size() > 1 ? cols.get(1) : cols.get(0));

        // Always re-seed 2 clean sample cards for this workspace if less than 2 exist
        List<TaskCard> existingTasks = taskCardRepository.findByColumnBlockWorkspaceId(ws.getId())
                .stream().filter(t -> !t.isDeleted()).toList();

        if (existingTasks.size() < 2) {
            taskCardRepository.deleteAll(existingTasks);

            TaskCard t1 = new TaskCard("Project Setup & Architecture", "Configure Spring Boot REST backend and React frontend workspace", Priority.HIGH, LocalDate.now().plusDays(5), 0, todoCol);
            t1.setAssignee(dev);

            TaskCard t2 = new TaskCard("Implement Role-Based Access", "Role-based guards for Admin, Developer, and QA Auditor", Priority.MEDIUM, LocalDate.now().plusDays(3), 0, inProgressCol);
            t2.setAssignee(dev);

            taskCardRepository.save(t1);
            taskCardRepository.save(t2);
        }
    }
}
