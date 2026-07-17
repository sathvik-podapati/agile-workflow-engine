package com.agile.workflow.service;

import com.agile.workflow.model.ColumnBlock;
import com.agile.workflow.model.Workspace;
import com.agile.workflow.model.User;
import com.agile.workflow.model.Role;
import com.agile.workflow.model.Priority;
import com.agile.workflow.model.TaskCard;
import com.agile.workflow.repository.ColumnBlockRepository;
import com.agile.workflow.repository.TaskCardRepository;
import com.agile.workflow.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional
public class TaskCardService {

    private final TaskCardRepository taskCardRepository;
    private final ColumnBlockRepository columnBlockRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Autowired
    public TaskCardService(TaskCardRepository taskCardRepository, 
                           ColumnBlockRepository columnBlockRepository,
                           UserRepository userRepository,
                           NotificationService notificationService) {
        this.taskCardRepository = taskCardRepository;
        this.columnBlockRepository = columnBlockRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    private void validateWorkspaceAccess(Workspace workspace, Long userId) {
        if (userId == null) {
            throw new com.agile.workflow.controller.AccessDeniedException("Authentication required");
        }
        boolean isCreator = workspace.getCreator() != null && workspace.getCreator().getId().equals(userId);
        boolean isMember = workspace.getAssignedMembers().stream().anyMatch(m -> m.getId().equals(userId));
        if (!isCreator && !isMember) {
            throw new com.agile.workflow.controller.AccessDeniedException("Access denied to this workspace");
        }
    }

    public List<TaskCard> getTasksByColumnId(Long columnId, Long userId) {
        ColumnBlock column = columnBlockRepository.findById(columnId)
            .orElseThrow(() -> new EntityNotFoundException("Column not found"));
        validateWorkspaceAccess(column.getWorkspace(), userId);
        
        List<TaskCard> allTasks = taskCardRepository.findByColumnBlockIdOrderBySequenceIndexAsc(columnId);
        List<TaskCard> active = new java.util.ArrayList<>();
        for (TaskCard t : allTasks) {
            if (!t.isDeleted()) {
                active.add(t);
            }
        }
        return active;
    }

    public TaskCard getTaskById(Long id, Long userId) {
        TaskCard task = taskCardRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + id));
        if (task.isDeleted()) {
            throw new EntityNotFoundException("Task not found with id: " + id);
        }
        validateWorkspaceAccess(task.getColumnBlock().getWorkspace(), userId);
        return task;
    }

    public TaskCard createTask(Long columnId, TaskCard task, Long userId) {
        ColumnBlock column = columnBlockRepository.findById(columnId)
            .orElseThrow(() -> new EntityNotFoundException("Column not found with id: " + columnId));
        validateWorkspaceAccess(column.getWorkspace(), userId);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (user.getRole() != Role.WORKSPACE_ADMIN) {
            throw new com.agile.workflow.controller.AccessDeniedException("Only Workspace Admins can create tasks");
        }
        
        List<TaskCard> tasks = taskCardRepository.findByColumnBlockIdOrderBySequenceIndexAsc(columnId);
        int activeCount = 0;
        for (TaskCard t : tasks) {
            if (!t.isDeleted()) {
                activeCount++;
            }
        }

        task.setSequenceIndex(activeCount);
        task.setColumnBlock(column);
        task.setDeleted(false);

        if (task.getAssigneeId() != null) {
            User assignee = userRepository.findById(task.getAssigneeId())
                .orElseThrow(() -> new EntityNotFoundException("Assignee user not found"));
            task.setAssignee(assignee);
        }
        
        return taskCardRepository.save(task);
    }

    public TaskCard updateTask(Long id, TaskCard details, Long userId) {
        TaskCard task = getTaskById(id, userId);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (user.getRole() != Role.WORKSPACE_ADMIN) {
            throw new com.agile.workflow.controller.AccessDeniedException("Only Workspace Admins can update task details");
        }

        task.setTitle(details.getTitle());
        task.setDescription(details.getDescription());
        task.setPriority(details.getPriority());
        task.setDueDate(details.getDueDate());

        if (details.getAssigneeId() != null) {
            User assignee = userRepository.findById(details.getAssigneeId())
                .orElseThrow(() -> new EntityNotFoundException("Assignee user not found"));
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }

        return taskCardRepository.save(task);
    }

    public void deleteTask(Long id, Long userId) {
        TaskCard task = getTaskById(id, userId);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (user.getRole() != Role.WORKSPACE_ADMIN) {
            throw new com.agile.workflow.controller.AccessDeniedException("Only Workspace Admins can delete tasks");
        }

        ColumnBlock column = task.getColumnBlock();
        
        // Manual soft delete task
        task.setDeleted(true);
        taskCardRepository.save(task);
        
        // Re-sequence remaining active tasks in the column
        List<TaskCard> tasks = taskCardRepository.findByColumnBlockIdOrderBySequenceIndexAsc(column.getId());
        int activeIndex = 0;
        for (TaskCard t : tasks) {
            if (!t.isDeleted()) {
                t.setSequenceIndex(activeIndex);
                activeIndex++;
            }
        }
        taskCardRepository.saveAll(tasks);
    }

    @Transactional
    public TaskCard moveTask(Long taskId, Long targetColumnId, int newSequenceIndex, Long userId) {
        TaskCard task = taskCardRepository.findById(taskId)
            .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + taskId));
        if (task.isDeleted()) {
            throw new EntityNotFoundException("Task not found with id: " + taskId);
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        ColumnBlock sourceColumn = task.getColumnBlock();
        ColumnBlock targetColumn = columnBlockRepository.findById(targetColumnId)
            .orElseThrow(() -> new EntityNotFoundException("Target column not found with id: " + targetColumnId));

        validateWorkspaceAccess(sourceColumn.getWorkspace(), userId);
        validateWorkspaceAccess(targetColumn.getWorkspace(), userId);

        String srcName = sourceColumn.getName().trim().toLowerCase();
        String tgtName = targetColumn.getName().trim().toLowerCase();

        // Enforce strict authorization guardrails
        if (user.getRole() == Role.WORKSPACE_ADMIN) {
            // Workspace Admin has unrestricted movement privileges
        } else if (user.getRole() == Role.CONTRIBUTOR) {
            if (task.getAssignee() == null || !task.getAssignee().getId().equals(userId)) {
                throw new com.agile.workflow.controller.AccessDeniedException("Contributors can only move tasks assigned to themselves");
            }
            if (tgtName.equals("done")) {
                if (!srcName.equals("in progress")) {
                    throw new com.agile.workflow.controller.AccessDeniedException("Contributors can only move cards into Done from In Progress");
                }
                task.setAwaitingQaApproval(true);
            } else if (srcName.equals("in progress") && tgtName.equals("to do")) {
                task.setAwaitingQaApproval(false);
            } else if (srcName.equals("to do") && tgtName.equals("in progress")) {
                task.setAwaitingQaApproval(false);
            } else if (sourceColumn.getId().equals(targetColumn.getId())) {
                // Intra-column resequencing allowed
            } else {
                throw new com.agile.workflow.controller.AccessDeniedException("Contributors can only move tasks from 'To Do' to 'In Progress' or 'In Progress' to 'Done'");
            }
        } else if (user.getRole() == Role.QUALITY_ASSURANCE) {
            if (!tgtName.equals("done") && !tgtName.equals("to do")) {
                throw new com.agile.workflow.controller.AccessDeniedException("QA can only move tasks into Done or throw them back to To Do");
            }
        }

        // Reset awaiting flag if QA or Admin moves task or if it is dragged out of Done
        if (!tgtName.equals("done")) {
            task.setAwaitingQaApproval(false);
        } else if (user.getRole() != Role.CONTRIBUTOR) {
            task.setAwaitingQaApproval(false);
        }

        // Fetch active tasks in source
        List<TaskCard> allSource = taskCardRepository.findByColumnBlockIdOrderBySequenceIndexAsc(sourceColumn.getId());
        List<TaskCard> sourceTasks = new java.util.ArrayList<>();
        for (TaskCard t : allSource) {
            if (!t.isDeleted()) sourceTasks.add(t);
        }

        if (sourceColumn.getId().equals(targetColumn.getId())) {
            // Intra-column move
            int oldSequenceIndex = -1;
            for (int i = 0; i < sourceTasks.size(); i++) {
                if (sourceTasks.get(i).getId().equals(taskId)) {
                    oldSequenceIndex = i;
                    break;
                }
            }
            if (oldSequenceIndex == -1 || oldSequenceIndex == newSequenceIndex) {
                return task;
            }
            
            sourceTasks.remove(oldSequenceIndex);
            if (newSequenceIndex < 0) newSequenceIndex = 0;
            if (newSequenceIndex > sourceTasks.size()) newSequenceIndex = sourceTasks.size();
            sourceTasks.add(newSequenceIndex, task);
            
            for (int i = 0; i < sourceTasks.size(); i++) {
                sourceTasks.get(i).setSequenceIndex(i);
            }
            taskCardRepository.saveAll(sourceTasks);
        } else {
            // Inter-column move
            List<TaskCard> allTarget = taskCardRepository.findByColumnBlockIdOrderBySequenceIndexAsc(targetColumn.getId());
            List<TaskCard> targetTasks = new java.util.ArrayList<>();
            for (TaskCard t : allTarget) {
                if (!t.isDeleted()) targetTasks.add(t);
            }
            
            // Remove from source and re-index
            int oldSequenceIndex = -1;
            for (int i = 0; i < sourceTasks.size(); i++) {
                if (sourceTasks.get(i).getId().equals(taskId)) {
                    oldSequenceIndex = i;
                    break;
                }
            }
            if (oldSequenceIndex != -1) {
                sourceTasks.remove(oldSequenceIndex);
            }
            for (int i = 0; i < sourceTasks.size(); i++) {
                sourceTasks.get(i).setSequenceIndex(i);
            }
            taskCardRepository.saveAll(sourceTasks);
            
            // Insert into target and re-index
            if (newSequenceIndex < 0) newSequenceIndex = 0;
            if (newSequenceIndex > targetTasks.size()) newSequenceIndex = targetTasks.size();
            task.setColumnBlock(targetColumn);
            targetTasks.add(newSequenceIndex, task);
            
            for (int i = 0; i < targetTasks.size(); i++) {
                targetTasks.get(i).setSequenceIndex(i);
            }
            taskCardRepository.saveAll(targetTasks);
        }
        return task;
    }

    public List<TaskCard> getFilteredTasks(Long workspaceId, Priority priority, Boolean overdue, String search, String sortBy, String sortOrder, Long userId) {
        // Find first active column to validate workspace access
        List<ColumnBlock> allCols = columnBlockRepository.findByWorkspaceIdOrderBySequenceIndexAsc(workspaceId);
        ColumnBlock sampleCol = null;
        for (ColumnBlock col : allCols) {
            if (!col.isDeleted()) {
                sampleCol = col;
                break;
            }
        }
        if (sampleCol == null) {
            throw new EntityNotFoundException("No columns found in workspace");
        }
        validateWorkspaceAccess(sampleCol.getWorkspace(), userId);

        List<TaskCard> allTasks = taskCardRepository.findByColumnBlockWorkspaceId(workspaceId);
        List<TaskCard> filtered = new java.util.ArrayList<>();
        LocalDate today = LocalDate.now();

        for (TaskCard t : allTasks) {
            // Filter out soft-deleted tasks
            if (t.isDeleted()) {
                continue;
            }
            // Filter by priority
            if (priority != null && t.getPriority() != priority) {
                continue;
            }
            // Filter by overdue status
            if (overdue != null && overdue) {
                if (t.getDueDate() == null || !t.getDueDate().isBefore(today)) {
                    continue;
                }
            }
            // Filter by search query matches
            if (search != null && !search.trim().isEmpty()) {
                String lowerSearch = search.toLowerCase();
                boolean matchTitle = t.getTitle().toLowerCase().contains(lowerSearch);
                boolean matchDesc = t.getDescription() != null && t.getDescription().toLowerCase().contains(lowerSearch);
                if (!matchTitle && !matchDesc) {
                    continue;
                }
            }
            filtered.add(t);
        }

        // Sort manually using a simple Collections.sort comparator
        java.util.Collections.sort(filtered, new java.util.Comparator<TaskCard>() {
            @Override
            public int compare(TaskCard a, TaskCard b) {
                int comparison = 0;
                if (sortBy != null) {
                    switch (sortBy.toLowerCase()) {
                        case "duedate":
                            if (a.getDueDate() == null && b.getDueDate() == null) comparison = 0;
                            else if (a.getDueDate() == null) comparison = 1;
                            else if (b.getDueDate() == null) comparison = -1;
                            else comparison = a.getDueDate().compareTo(b.getDueDate());
                            break;
                        case "priority":
                            comparison = a.getPriority().compareTo(b.getPriority());
                            break;
                        case "title":
                            comparison = a.getTitle().toLowerCase().compareTo(b.getTitle().toLowerCase());
                            break;
                        case "sequence":
                        default:
                            comparison = Integer.compare(a.getSequenceIndex(), b.getSequenceIndex());
                            break;
                    }
                } else {
                    comparison = Integer.compare(a.getSequenceIndex(), b.getSequenceIndex());
                }

                if (sortOrder != null && sortOrder.equalsIgnoreCase("desc")) {
                    return -comparison;
                }
                return comparison;
            }
        });

        return filtered;
    }

    public TaskCard approveTask(Long id, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (user.getRole() != Role.QUALITY_ASSURANCE && user.getRole() != Role.WORKSPACE_ADMIN) {
            throw new com.agile.workflow.controller.AccessDeniedException("Only QA Auditors or Workspace Admins can approve tasks");
        }

        TaskCard task = taskCardRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + id));
        if (task.isDeleted()) {
            throw new EntityNotFoundException("Task not found with id: " + id);
        }
        
        task.setAwaitingQaApproval(false);
        TaskCard savedTask = taskCardRepository.save(task);

        // Notify Developer and Admin
        String msg = String.format("Task '%s' has been approved by %s.", task.getTitle(), user.getUsername());
        if (task.getAssignee() != null) {
            notificationService.createNotification(msg, task.getAssignee().getId());
        }
        Workspace workspace = task.getColumnBlock().getWorkspace();
        if (workspace.getCreator() != null && !workspace.getCreator().getId().equals(userId)) {
            notificationService.createNotification(msg, workspace.getCreator().getId());
        }

        return savedTask;
    }

    public TaskCard rejectTask(Long id, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (user.getRole() != Role.QUALITY_ASSURANCE && user.getRole() != Role.WORKSPACE_ADMIN) {
            throw new com.agile.workflow.controller.AccessDeniedException("Only QA Auditors or Workspace Admins can reject tasks");
        }

        TaskCard task = taskCardRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + id));
        if (task.isDeleted()) {
            throw new EntityNotFoundException("Task not found with id: " + id);
        }

        ColumnBlock currentColumn = task.getColumnBlock();
        Workspace workspace = currentColumn.getWorkspace();

        // Find To Do column in the workspace
        List<ColumnBlock> columns = columnBlockRepository.findByWorkspaceIdOrderBySequenceIndexAsc(workspace.getId());
        ColumnBlock todoCol = null;
        for (ColumnBlock col : columns) {
            if (!col.isDeleted() && col.getName().trim().toLowerCase().equals("to do")) {
                todoCol = col;
                break;
            }
        }
        if (todoCol == null) {
            throw new EntityNotFoundException("To Do column not found in workspace");
        }

        // Set pending flag to false
        task.setAwaitingQaApproval(false);

        // Move task to To Do column (at the end)
        List<TaskCard> allSource = taskCardRepository.findByColumnBlockIdOrderBySequenceIndexAsc(currentColumn.getId());
        List<TaskCard> sourceTasks = new java.util.ArrayList<>();
        for (TaskCard t : allSource) {
            if (!t.isDeleted()) sourceTasks.add(t);
        }

        // Remove from source and re-index
        int oldSequenceIndex = -1;
        for (int i = 0; i < sourceTasks.size(); i++) {
            if (sourceTasks.get(i).getId().equals(id)) {
                oldSequenceIndex = i;
                break;
            }
        }
        if (oldSequenceIndex != -1) {
            sourceTasks.remove(oldSequenceIndex);
        }
        for (int i = 0; i < sourceTasks.size(); i++) {
            sourceTasks.get(i).setSequenceIndex(i);
        }
        taskCardRepository.saveAll(sourceTasks);

        // Fetch active tasks in To Do and add to end
        List<TaskCard> allTodo = taskCardRepository.findByColumnBlockIdOrderBySequenceIndexAsc(todoCol.getId());
        List<TaskCard> todoTasks = new java.util.ArrayList<>();
        for (TaskCard t : allTodo) {
            if (!t.isDeleted()) todoTasks.add(t);
        }

        task.setColumnBlock(todoCol);
        task.setSequenceIndex(todoTasks.size());
        taskCardRepository.save(task);

        // Refresh To Do sequence
        todoTasks.add(task);
        for (int i = 0; i < todoTasks.size(); i++) {
            todoTasks.get(i).setSequenceIndex(i);
        }
        taskCardRepository.saveAll(todoTasks);

        // Notify Developer and Admin
        String msg = String.format("Task '%s' has been rejected by %s and sent back to To Do.", task.getTitle(), user.getUsername());
        if (task.getAssignee() != null) {
            notificationService.createNotification(msg, task.getAssignee().getId());
        }
        if (workspace.getCreator() != null && !workspace.getCreator().getId().equals(userId)) {
            notificationService.createNotification(msg, workspace.getCreator().getId());
        }

        return task;
    }
}

