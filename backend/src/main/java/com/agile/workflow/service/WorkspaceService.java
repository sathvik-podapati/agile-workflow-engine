package com.agile.workflow.service;

import com.agile.workflow.model.Workspace;
import com.agile.workflow.model.ColumnBlock;
import com.agile.workflow.model.User;
import com.agile.workflow.model.Role;
import com.agile.workflow.model.TaskCard;
import com.agile.workflow.repository.UserRepository;
import com.agile.workflow.repository.WorkspaceRepository;
import com.agile.workflow.controller.AccessDeniedException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;

    @Autowired
    public WorkspaceService(WorkspaceRepository workspaceRepository, UserRepository userRepository) {
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
    }

    public List<Workspace> getWorkspacesForUser(Long userId) {
        if (userId == null) {
            throw new AccessDeniedException("User authentication required");
        }
        List<Workspace> allWorkspaces = workspaceRepository.findAll();
        List<Workspace> accessible = new java.util.ArrayList<>();
        for (Workspace workspace : allWorkspaces) {
            if (!workspace.isDeleted()) {
                boolean isCreator = workspace.getCreator() != null && workspace.getCreator().getId().equals(userId);
                boolean isMember = workspace.getAssignedMembers().stream().anyMatch(m -> m.getId().equals(userId));
                if (isCreator || isMember) {
                    workspace.getColumns().removeIf(ColumnBlock::isDeleted);
                    accessible.add(workspace);
                }
            }
        }
        return accessible;
    }

    public Workspace getWorkspaceById(Long id, Long userId) {
        if (userId == null) {
            throw new AccessDeniedException("User authentication required");
        }
        Workspace workspace = workspaceRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Workspace not found with id: " + id));

        if (workspace.isDeleted()) {
            throw new EntityNotFoundException("Workspace not found with id: " + id);
        }

        // Check if user is creator or member
        boolean isAuthorized = workspace.getCreator() != null && workspace.getCreator().getId().equals(userId) ||
                               workspace.getAssignedMembers().stream().anyMatch(m -> m.getId().equals(userId));
        
        if (!isAuthorized) {
            throw new AccessDeniedException("Access denied to this workspace");
        }

        workspace.getColumns().removeIf(ColumnBlock::isDeleted);
        return workspace;
    }

    public Workspace createWorkspace(Workspace workspace, Long userId) {
        if (userId == null) {
            throw new AccessDeniedException("User authentication required");
        }
        User creator = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (creator.getRole() != Role.WORKSPACE_ADMIN) {
            throw new AccessDeniedException("Only Workspace Admins can create workspaces");
        }

        workspace.setCreator(creator);
        workspace.setDeleted(false);
        Workspace savedWorkspace = workspaceRepository.save(workspace);
        
        // Auto-initialize standard columns: To Do, In Progress, Done
        ColumnBlock todo = new ColumnBlock("To Do", 0, savedWorkspace);
        ColumnBlock inProgress = new ColumnBlock("In Progress", 1, savedWorkspace);
        ColumnBlock done = new ColumnBlock("Done", 2, savedWorkspace);
        
        savedWorkspace.getColumns().add(todo);
        savedWorkspace.getColumns().add(inProgress);
        savedWorkspace.getColumns().add(done);
        
        return workspaceRepository.save(savedWorkspace);
    }

    public Workspace updateWorkspace(Long id, Workspace details, Long userId) {
        Workspace workspace = getWorkspaceById(id, userId);

        // Only creator can rename the workspace
        if (workspace.getCreator() == null || !workspace.getCreator().getId().equals(userId)) {
            throw new AccessDeniedException("Only the workspace creator can rename it");
        }

        workspace.setName(details.getName());
        return workspaceRepository.save(workspace);
    }

    public void deleteWorkspace(Long id, Long userId) {
        Workspace workspace = getWorkspaceById(id, userId);

        // Only creator can delete
        if (workspace.getCreator() == null || !workspace.getCreator().getId().equals(userId)) {
            throw new AccessDeniedException("Only the workspace creator can delete it");
        }

        // Manual cascading soft delete
        workspace.setDeleted(true);
        for (ColumnBlock col : workspace.getColumns()) {
            col.setDeleted(true);
            for (TaskCard card : col.getTasks()) {
                card.setDeleted(true);
            }
        }
        workspaceRepository.save(workspace);
    }

    // Invite/add user to workspace members
    public Workspace inviteMember(Long workspaceId, Long memberId, Long userId) {
        Workspace workspace = getWorkspaceById(workspaceId, userId);

        // Only creator can invite members
        if (workspace.getCreator() == null || !workspace.getCreator().getId().equals(userId)) {
            throw new AccessDeniedException("Only the workspace creator can invite members");
        }

        User member = userRepository.findById(memberId)
            .orElseThrow(() -> new EntityNotFoundException("Invited member user not found"));

        workspace.getAssignedMembers().add(member);
        return workspaceRepository.save(workspace);
    }
}

