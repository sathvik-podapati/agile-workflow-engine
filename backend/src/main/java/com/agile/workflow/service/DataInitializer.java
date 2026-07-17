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
        // 1. Ensure existing users have passwords initialized
        if (userRepository.count() > 0) {
            List<User> existing = userRepository.findAll();
            for (User u : existing) {
                if (u.getPassword() == null || u.getPassword().trim().isEmpty()) {
                    if (u.getUsername().contains("Admin")) {
                        u.setPassword("admin123");
                    } else if (u.getUsername().contains("Developer")) {
                        u.setPassword("dev123");
                    } else if (u.getUsername().contains("QA")) {
                        u.setPassword("qa123");
                    } else {
                        u.setPassword("password123");
                    }
                    userRepository.save(u);
                }
            }
        } else {
            // Seed default users if table is empty
            userRepository.save(new User("Sarah (Admin)", "sarah.admin@enterprise.com", Role.WORKSPACE_ADMIN, "admin123"));
            userRepository.save(new User("David (Developer)", "david.dev@enterprise.com", Role.CONTRIBUTOR, "dev123"));
            userRepository.save(new User("Alice (QA Auditor)", "alice.qa@enterprise.com", Role.QUALITY_ASSURANCE, "qa123"));
        }

        // 2. Seed default workspaces and columns if none exist
        if (workspaceRepository.count() == 0) {
            User sarah = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.WORKSPACE_ADMIN)
                    .findFirst()
                    .orElseGet(() -> userRepository.save(new User("Sarah (Admin)", "sarah.admin@enterprise.com", Role.WORKSPACE_ADMIN, "admin123")));

            User david = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.CONTRIBUTOR)
                    .findFirst()
                    .orElseGet(() -> userRepository.save(new User("David (Developer)", "david.dev@enterprise.com", Role.CONTRIBUTOR, "dev123")));

            User alice = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.QUALITY_ASSURANCE)
                    .findFirst()
                    .orElseGet(() -> userRepository.save(new User("Alice (QA Auditor)", "alice.qa@enterprise.com", Role.QUALITY_ASSURANCE, "qa123")));

            // Create initial Workspace
            Workspace workspace = new Workspace("Enterprise Sprint Board", sarah);
            Set<User> members = new HashSet<>();
            members.add(david);
            members.add(alice);
            workspace.setAssignedMembers(members);
            workspace = workspaceRepository.save(workspace);

            // Create default columns
            ColumnBlock todo = new ColumnBlock("To Do", 0, workspace);
            ColumnBlock inProgress = new ColumnBlock("In Progress", 1, workspace);
            ColumnBlock done = new ColumnBlock("Done", 2, workspace);

            todo = columnBlockRepository.save(todo);
            inProgress = columnBlockRepository.save(inProgress);
            done = columnBlockRepository.save(done);

            // Create sample tasks
            TaskCard t1 = new TaskCard("Database Schema Migrations", "Implement user mappings and join tables", Priority.HIGH, LocalDate.now().plusDays(10), 0, todo);
            t1.setAssignee(david);

            TaskCard t2 = new TaskCard("Frontend User Selector UI", "Add dropdown selector in header to switch active roles", Priority.MEDIUM, LocalDate.now().plusDays(5), 1, todo);
            t2.setAssignee(david);

            TaskCard t3 = new TaskCard("Enterprise Role-Based Guards", "Secure moveTask REST endpoints in service layer", Priority.HIGH, LocalDate.now().plusDays(3), 2, todo);

            TaskCard t4 = new TaskCard("Audit Sprint Deliverables", "Perform QA reviews on recent changes", Priority.HIGH, LocalDate.now().minusDays(1), 0, inProgress);
            t4.setAssignee(alice);

            taskCardRepository.save(t1);
            taskCardRepository.save(t2);
            taskCardRepository.save(t3);
            taskCardRepository.save(t4);
        }
    }
}
