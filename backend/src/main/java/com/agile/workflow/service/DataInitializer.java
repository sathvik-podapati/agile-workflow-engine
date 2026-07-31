package com.agile.workflow.service;

import com.agile.workflow.model.*;
import com.agile.workflow.repository.ColumnBlockRepository;
import com.agile.workflow.repository.TaskCardRepository;
import com.agile.workflow.repository.UserRepository;
import com.agile.workflow.repository.WorkspaceRepository;
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

    @Autowired
    public DataInitializer(UserRepository userRepository, 
                           WorkspaceRepository workspaceRepository,
                           ColumnBlockRepository columnBlockRepository, 
                           TaskCardRepository taskCardRepository) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.columnBlockRepository = columnBlockRepository;
        this.taskCardRepository = taskCardRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Safely rename legacy demo users (Sarah, David, Alice) in place to avoid foreign key errors
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

        // 2. Seed clean workspace and columns if none exist
        if (workspaceRepository.count() == 0) {
            User admin = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.WORKSPACE_ADMIN)
                    .findFirst()
                    .orElseGet(() -> userRepository.save(new User("Admin", "admin@company.com", Role.WORKSPACE_ADMIN, "admin123")));

            User dev = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.CONTRIBUTOR)
                    .findFirst()
                    .orElseGet(() -> userRepository.save(new User("Developer", "dev@company.com", Role.CONTRIBUTOR, "dev123")));

            User qa = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.QUALITY_ASSURANCE)
                    .findFirst()
                    .orElseGet(() -> userRepository.save(new User("QA Auditor", "qa@company.com", Role.QUALITY_ASSURANCE, "qa123")));

            // Create initial clean Workspace
            Workspace workspace = new Workspace("My Project Workspace", admin);
            Set<User> members = new HashSet<>();
            members.add(dev);
            members.add(qa);
            workspace.setAssignedMembers(members);
            workspace = workspaceRepository.save(workspace);

            // Create default columns
            ColumnBlock todo = new ColumnBlock("To Do", 0, workspace);
            ColumnBlock inProgress = new ColumnBlock("In Progress", 1, workspace);
            ColumnBlock done = new ColumnBlock("Done", 2, workspace);

            todo = columnBlockRepository.save(todo);
            inProgress = columnBlockRepository.save(inProgress);
            done = columnBlockRepository.save(done);

            // Create 1 minimal sample task to get started
            TaskCard t1 = new TaskCard("Sample Task: Drag card to In Progress", "Click card to edit details or assign team members", Priority.MEDIUM, LocalDate.now().plusDays(7), 0, todo);
            taskCardRepository.save(t1);
        }
    }
}
