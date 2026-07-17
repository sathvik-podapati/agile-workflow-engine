package com.agile.workflow.repository;

import com.agile.workflow.model.ColumnBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ColumnBlockRepository extends JpaRepository<ColumnBlock, Long> {
    List<ColumnBlock> findByWorkspaceIdOrderBySequenceIndexAsc(Long workspaceId);
}

