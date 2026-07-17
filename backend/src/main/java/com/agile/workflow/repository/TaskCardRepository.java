package com.agile.workflow.repository;

import com.agile.workflow.model.TaskCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskCardRepository extends JpaRepository<TaskCard, Long> {
    List<TaskCard> findByColumnBlockIdOrderBySequenceIndexAsc(Long columnId);
    List<TaskCard> findByColumnBlockWorkspaceId(Long workspaceId);
}

