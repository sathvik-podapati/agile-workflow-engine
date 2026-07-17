package com.agile.workflow.controller;

import jakarta.validation.constraints.NotNull;

public class MoveTaskRequest {

    @NotNull(message = "Target column ID is required")
    private Long targetColumnId;

    @NotNull(message = "New sequence index is required")
    private Integer newSequenceIndex;

    public MoveTaskRequest() {}

    public MoveTaskRequest(Long targetColumnId, Integer newSequenceIndex) {
        this.targetColumnId = targetColumnId;
        this.newSequenceIndex = newSequenceIndex;
    }

    public Long getTargetColumnId() {
        return targetColumnId;
    }

    public void setTargetColumnId(Long targetColumnId) {
        this.targetColumnId = targetColumnId;
    }

    public Integer getNewSequenceIndex() {
        return newSequenceIndex;
    }

    public void setNewSequenceIndex(Integer newSequenceIndex) {
        this.newSequenceIndex = newSequenceIndex;
    }
}

