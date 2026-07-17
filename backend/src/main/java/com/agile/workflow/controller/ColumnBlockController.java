package com.agile.workflow.controller;

import com.agile.workflow.model.ColumnBlock;
import com.agile.workflow.service.ColumnBlockService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class ColumnBlockController {

    private final ColumnBlockService columnBlockService;

    @Autowired
    public ColumnBlockController(ColumnBlockService columnBlockService) {
        this.columnBlockService = columnBlockService;
    }

    @GetMapping("/workspaces/{workspaceId}/columns")
    public ResponseEntity<List<ColumnBlock>> getColumnsByWorkspaceId(@PathVariable Long workspaceId, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(columnBlockService.getColumnsByWorkspaceId(workspaceId, userId));
    }

    @PostMapping("/workspaces/{workspaceId}/columns")
    public ResponseEntity<ColumnBlock> createColumn(@PathVariable Long workspaceId, @Valid @RequestBody ColumnBlock column, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        ColumnBlock created = columnBlockService.createColumn(workspaceId, column, userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/columns/{id}")
    public ResponseEntity<ColumnBlock> updateColumn(@PathVariable Long id, @Valid @RequestBody ColumnBlock column, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        ColumnBlock updated = columnBlockService.updateColumn(id, column, userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/columns/{id}")
    public ResponseEntity<Void> deleteColumn(@PathVariable Long id, @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        columnBlockService.deleteColumn(id, userId);
        UpdateWebSocketHandler.broadcastUpdate();
        return ResponseEntity.noContent().build();
    }
}

