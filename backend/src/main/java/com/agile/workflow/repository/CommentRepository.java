package com.agile.workflow.repository;

import com.agile.workflow.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTaskCardIdOrderByCreatedAtAsc(Long taskCardId);
}
