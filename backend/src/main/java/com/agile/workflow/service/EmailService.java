package com.agile.workflow.service;

import com.agile.workflow.model.TaskCard;
import com.agile.workflow.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Autowired
    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendUserCreatedEmail(User user, String defaultPassword) {
        String subject = "Welcome to Agile Workflow Engine - Account Created";
        String body = String.format(
            "Hello %s,\n\n" +
            "Your enterprise user account has been successfully created by an Administrator.\n\n" +
            "Account Details:\n" +
            "  - Username: %s\n" +
            "  - Role: %s\n" +
            "  - Registered Email: %s\n" +
            "  - Default Password: %s\n\n" +
            "You can log in at: http://localhost:5173\n" +
            "Please update your password after logging in.\n\n" +
            "Best regards,\nAgile Workflow Engine Team",
            user.getUsername(),
            user.getUsername(),
            user.getRole().name().replace("WORKSPACE_", ""),
            user.getEmail(),
            defaultPassword != null ? defaultPassword : "[Provided during creation]"
        );

        dispatchEmail(user.getEmail(), subject, body);
    }

    public void sendTaskAssignedEmail(User assignee, TaskCard task) {
        if (assignee == null || assignee.getEmail() == null) return;

        String workspaceName = (task.getColumnBlock() != null && task.getColumnBlock().getWorkspace() != null)
            ? task.getColumnBlock().getWorkspace().getName()
            : "Agile Workspace";

        String columnName = (task.getColumnBlock() != null)
            ? task.getColumnBlock().getName()
            : "Board Column";

        String subject = String.format("Task Assigned: %s", task.getTitle());
        String body = String.format(
            "Hello %s,\n\n" +
            "A task has been assigned to you on the workspace '%s'.\n\n" +
            "Task Details:\n" +
            "  - Title: %s\n" +
            "  - Description: %s\n" +
            "  - Priority: %s\n" +
            "  - Status Column: %s\n" +
            "  - Due Date: %s\n\n" +
            "Please log in to review your task card: http://localhost:5173\n\n" +
            "Best regards,\nAgile Workflow Engine Team",
            assignee.getUsername(),
            workspaceName,
            task.getTitle(),
            task.getDescription() != null && !task.getDescription().isEmpty() ? task.getDescription() : "No description provided",
            task.getPriority() != null ? task.getPriority().name() : "MEDIUM",
            columnName,
            task.getDueDate() != null ? task.getDueDate().toString() : "Not specified"
        );

        dispatchEmail(assignee.getEmail(), subject, body);
    }

    public void sendTaskRejectedEmail(User assignee, TaskCard task, User rejector) {
        if (assignee == null || assignee.getEmail() == null) return;

        String workspaceName = (task.getColumnBlock() != null && task.getColumnBlock().getWorkspace() != null)
            ? task.getColumnBlock().getWorkspace().getName()
            : "Agile Workspace";

        String rejectorName = rejector != null ? rejector.getUsername() : "QA Auditor";

        String subject = String.format("Task Action Required: Task Rejected by QA - %s", task.getTitle());
        String body = String.format(
            "Hello %s,\n\n" +
            "Your submitted task '%s' in workspace '%s' was reviewed and REJECTED by QA Auditor (%s).\n\n" +
            "Action Taken:\n" +
            "  - The task card has been automatically moved back to the 'To Do' column for necessary updates and fixes.\n\n" +
            "Please log in to review feedback and update your task: http://localhost:5173\n\n" +
            "Best regards,\nAgile Workflow Engine Team",
            assignee.getUsername(),
            task.getTitle(),
            workspaceName,
            rejectorName
        );

        dispatchEmail(assignee.getEmail(), subject, body);
    }

    public void sendOtpEmail(User user, String otp) {
        if (user == null || user.getEmail() == null) return;

        String subject = "Password Verification OTP - Agile Workflow Engine";
        String body = String.format(
            "Hello %s,\n\n" +
            "You requested a password change for your Agile Workflow Engine account.\n\n" +
            "Your 6-digit Verification OTP code is: %s\n\n" +
            "This OTP code is valid for single-use password verification.\n" +
            "If you did not request a password change, please ignore this email.\n\n" +
            "Best regards,\nAgile Workflow Engine Security Team",
            user.getUsername(),
            otp
        );

        dispatchEmail(user.getEmail(), subject, body);
    }

    private void dispatchEmail(String recipientEmail, String subject, String body) {
        // 1. Always print a prominent structured notification to system logs
        System.out.println("\n==================================================================");
        System.out.println(" 📧 [EMAIL NOTIFICATION DISPATCHED]");
        System.out.println(" To:      " + recipientEmail);
        System.out.println(" Subject: " + subject);
        System.out.println(" ------------------------------------------------------------------");
        System.out.println(" " + body.replace("\n", "\n "));
        System.out.println("==================================================================\n");

        // 2. Dispatch via JavaMailSender if configured
        if (mailSender != null && recipientEmail != null && recipientEmail.contains("@")) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(recipientEmail);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
            } catch (Exception e) {
                System.out.println(" [SMTP Notice] Email logged locally. To deliver live SMTP emails, configure spring.mail host/credentials in application.yml.");
            }
        }
    }
}
