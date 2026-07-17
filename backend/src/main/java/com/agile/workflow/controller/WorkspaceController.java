package com.agile.workflow.controller;

import com.agile.workflow.model.Workspace;
import com.agile.workflow.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workspaces")
@CrossOrigin(origins = "*")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @Autowired
    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @GetMapping
    public ResponseEntity<List<Workspace>> getAllWorkspaces(@RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(workspaceService.getWorkspacesForUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Workspace> getWorkspaceById(@PathVariable Long id, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(workspaceService.getWorkspaceById(id, userId));
    }

    @PostMapping
    public ResponseEntity<Workspace> createWorkspace(@Valid @RequestBody Workspace workspace, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        Workspace created = workspaceService.createWorkspace(workspace, userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Workspace> updateWorkspace(@PathVariable Long id, @Valid @RequestBody Workspace workspace, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        Workspace updated = workspaceService.updateWorkspace(id, workspace, userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkspace(@PathVariable Long id, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        workspaceService.deleteWorkspace(id, userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<Workspace> inviteMember(
            @PathVariable Long id, 
            @RequestParam Long memberId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        Workspace updated = workspaceService.inviteMember(id, memberId, userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.ok(updated);
    }
}

