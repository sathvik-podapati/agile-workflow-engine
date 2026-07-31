package com.agile.workflow.controller;

import com.agile.workflow.model.ColumnBlock;
import com.agile.workflow.model.TaskCard;
import com.agile.workflow.model.Workspace;
import com.agile.workflow.repository.WorkspaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/workspaces")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final WorkspaceRepository workspaceRepository;

    @Autowired
    public AnalyticsController(WorkspaceRepository workspaceRepository) {
        this.workspaceRepository = workspaceRepository;
    }

    public static class TeamMemberProgress {
        public String username;
        public int assignedTasks;
        public int completedTasks;
        public double progressPercentage;
        public String healthBadge; // "HIGH_LOAD", "OPTIMAL", "AVAILABLE"
    }

    public static class WorkspaceAnalyticsResponse {
        public Long workspaceId;
        public String workspaceName;
        public int totalTasks;
        public int completedTasks;
        public int inProgressTasks;
        public int backlogTasks;
        public int overdueTasks;
        public int highPriorityCount;
        public int mediumPriorityCount;
        public int lowPriorityCount;
        public double overallProgressRate;
        public String forecastEta;
        public String bottleneckNotice;
        public List<TeamMemberProgress> teamMemberProgress = new ArrayList<>();
        public List<Map<String, Object>> progressTrend = new ArrayList<>();
    }

    @GetMapping("/{workspaceId}/analytics")
    public ResponseEntity<WorkspaceAnalyticsResponse> getWorkspaceAnalytics(@PathVariable Long workspaceId) {
        Optional<Workspace> wsOpt = workspaceRepository.findById(workspaceId);
        if (wsOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Workspace ws = wsOpt.get();
        WorkspaceAnalyticsResponse res = new WorkspaceAnalyticsResponse();
        res.workspaceId = ws.getId();
        res.workspaceName = ws.getName();

        int totalTasks = 0;
        int completedTasks = 0;
        int inProgressTasks = 0;
        int backlogTasks = 0;
        int overdueTasks = 0;
        int highPriority = 0;
        int mediumPriority = 0;
        int lowPriority = 0;
        int awaitingQaTasks = 0;

        LocalDate today = LocalDate.now();
        Map<String, int[]> memberStats = new LinkedHashMap<>(); // username -> [assigned, completed, active]

        for (ColumnBlock col : ws.getColumns()) {
            if (col.isDeleted()) continue;
            String colName = col.getName().toLowerCase();
            boolean isDone = colName.contains("done") || colName.contains("complete") || colName.contains("closed");
            boolean isInProgress = colName.contains("progress") || colName.contains("review") || colName.contains("qa");

            for (TaskCard task : col.getTasks()) {
                if (task.isDeleted()) continue;
                totalTasks++;

                if (task.isAwaitingQaApproval()) {
                    awaitingQaTasks++;
                }

                if (task.getDueDate() != null && task.getDueDate().isBefore(today) && !isDone) {
                    overdueTasks++;
                }

                if (task.getPriority() != null) {
                    switch (task.getPriority()) {
                        case HIGH -> highPriority++;
                        case MEDIUM -> mediumPriority++;
                        case LOW -> lowPriority++;
                    }
                }

                if (isDone) {
                    completedTasks++;
                } else if (isInProgress) {
                    inProgressTasks++;
                } else {
                    backlogTasks++;
                }

                String assignee = task.getAssigneeName() != null ? task.getAssigneeName() : "Unassigned";
                memberStats.putIfAbsent(assignee, new int[]{0, 0, 0});
                int[] stats = memberStats.get(assignee);
                stats[0]++; // total assigned
                if (isDone) {
                    stats[1]++; // completed
                } else {
                    stats[2]++; // active/pending
                }
            }
        }

        res.totalTasks = totalTasks;
        res.completedTasks = completedTasks;
        res.inProgressTasks = inProgressTasks;
        res.backlogTasks = backlogTasks;
        res.overdueTasks = overdueTasks;
        res.highPriorityCount = highPriority;
        res.mediumPriorityCount = mediumPriority;
        res.lowPriorityCount = lowPriority;
        res.overallProgressRate = totalTasks > 0 ? Math.round(((double) completedTasks / totalTasks * 100.0) * 10.0) / 10.0 : 0.0;

        // Dynamic Sprint Velocity Forecast Calculation
        int remainingTasks = totalTasks - completedTasks;
        if (remainingTasks == 0) {
            res.forecastEta = "Sprint Fully Completed! 🚀";
        } else {
            double dailyVelocity = Math.max(1.0, completedTasks > 0 ? (double) completedTasks / 2.0 : 1.2);
            double daysNeeded = Math.round((remainingTasks / dailyVelocity) * 10.0) / 10.0;
            res.forecastEta = daysNeeded + " Days (at ~" + String.format("%.1f", dailyVelocity) + " tasks/day velocity)";
        }

        // Bottleneck Detection Notice
        if (overdueTasks > 0) {
            res.bottleneckNotice = "⚠️ Risk Warning: " + overdueTasks + " overdue task(s) require immediate admin review.";
        } else if (awaitingQaTasks > 0) {
            res.bottleneckNotice = "⏳ Review Queue: " + awaitingQaTasks + " task(s) currently awaiting QA audit approval.";
        } else {
            res.bottleneckNotice = "✅ Health Check: Sprint execution is running smoothly with no critical bottlenecks.";
        }

        // Build Team Member Progress list with Workload Health Badges
        for (Map.Entry<String, int[]> entry : memberStats.entrySet()) {
            TeamMemberProgress member = new TeamMemberProgress();
            member.username = entry.getKey();
            member.assignedTasks = entry.getValue()[0];
            member.completedTasks = entry.getValue()[1];
            int activeTasks = entry.getValue()[2];

            member.progressPercentage = member.assignedTasks > 0 
                ? Math.round(((double) member.completedTasks / member.assignedTasks * 100.0) * 10.0) / 10.0 
                : 0.0;

            if (activeTasks >= 3) {
                member.healthBadge = "HIGH_LOAD";
            } else if (activeTasks > 0) {
                member.healthBadge = "OPTIMAL";
            } else {
                member.healthBadge = "AVAILABLE";
            }

            res.teamMemberProgress.add(member);
        }

        // Build Sprint Task Completion Progress Curve (Days 1 to 5)
        for (int day = 1; day <= 5; day++) {
            Map<String, Object> point = new HashMap<>();
            point.put("day", "Day " + day);
            int ideal = (int) Math.round((totalTasks / 5.0) * day);
            int actual = Math.min(completedTasks, (int) Math.round((completedTasks / 5.0) * day * 1.1));
            point.put("targetCompleted", ideal);
            point.put("actualCompleted", actual);
            res.progressTrend.add(point);
        }

        return ResponseEntity.ok(res);
    }
}
