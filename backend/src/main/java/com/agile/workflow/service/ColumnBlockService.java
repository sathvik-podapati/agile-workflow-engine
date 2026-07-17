package com.agile.workflow.service;

import com.agile.workflow.model.ColumnBlock;
import com.agile.workflow.model.Workspace;
import com.agile.workflow.repository.ColumnBlockRepository;
import com.agile.workflow.repository.WorkspaceRepository;
import com.agile.workflow.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ColumnBlockService {

    private final ColumnBlockRepository columnBlockRepository;
    private final WorkspaceService workspaceService;
    private final UserRepository userRepository;

    @Autowired
    public ColumnBlockService(ColumnBlockRepository columnBlockRepository, 
                              WorkspaceService workspaceService,
                              UserRepository userRepository) {
        this.columnBlockRepository = columnBlockRepository;
        this.workspaceService = workspaceService;
        this.userRepository = userRepository;
    }

    public List<ColumnBlock> getColumnsByWorkspaceId(Long workspaceId, Long userId) {
        // validate workspace membership
        workspaceService.getWorkspaceById(workspaceId, userId);
        List<ColumnBlock> allCols = columnBlockRepository.findByWorkspaceIdOrderBySequenceIndexAsc(workspaceId);
        List<ColumnBlock> active = new java.util.ArrayList<>();
        for (ColumnBlock col : allCols) {
            if (!col.isDeleted()) {
                active.add(col);
            }
        }
        return active;
    }

    public ColumnBlock getColumnById(Long id, Long userId) {
        ColumnBlock column = columnBlockRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Column not found with id: " + id));
        if (column.isDeleted()) {
            throw new EntityNotFoundException("Column not found with id: " + id);
        }
        workspaceService.getWorkspaceById(column.getWorkspace().getId(), userId);
        return column;
    }

    public ColumnBlock createColumn(Long workspaceId, ColumnBlock column, Long userId) {
        Workspace workspace = workspaceService.getWorkspaceById(workspaceId, userId);
        
        com.agile.workflow.model.User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (user.getRole() != com.agile.workflow.model.Role.WORKSPACE_ADMIN) {
            throw new com.agile.workflow.controller.AccessDeniedException("Only Workspace Admins can create board columns");
        }

        List<ColumnBlock> allCols = columnBlockRepository.findByWorkspaceIdOrderBySequenceIndexAsc(workspaceId);
        int activeCount = 0;
        for (ColumnBlock col : allCols) {
            if (!col.isDeleted()) {
                activeCount++;
            }
        }

        column.setSequenceIndex(activeCount);
        column.setWorkspace(workspace);
        column.setDeleted(false);
        
        return columnBlockRepository.save(column);
    }

    public ColumnBlock updateColumn(Long id, ColumnBlock details, Long userId) {
        ColumnBlock column = getColumnById(id, userId);
        
        com.agile.workflow.model.User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (user.getRole() != com.agile.workflow.model.Role.WORKSPACE_ADMIN) {
            throw new com.agile.workflow.controller.AccessDeniedException("Only Workspace Admins can edit columns");
        }

        column.setName(details.getName());
        return columnBlockRepository.save(column);
    }

    public void deleteColumn(Long id, Long userId) {
        ColumnBlock column = getColumnById(id, userId);
        Workspace workspace = column.getWorkspace();
        
        com.agile.workflow.model.User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (user.getRole() != com.agile.workflow.model.Role.WORKSPACE_ADMIN) {
            throw new com.agile.workflow.controller.AccessDeniedException("Only Workspace Admins can delete columns");
        }

        // Manual soft delete column
        column.setDeleted(true);
        columnBlockRepository.save(column);
        
        // Re-sequence remaining active columns
        List<ColumnBlock> columns = columnBlockRepository.findByWorkspaceIdOrderBySequenceIndexAsc(workspace.getId());
        int activeIndex = 0;
        for (ColumnBlock col : columns) {
            if (!col.isDeleted()) {
                col.setSequenceIndex(activeIndex);
                activeIndex++;
            }
        }
        columnBlockRepository.saveAll(columns);
    }
}

