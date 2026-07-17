package com.agile.workflow.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "task_cards")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TaskCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Task title is required")
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Priority is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "sequence_index", nullable = false)
    private int sequenceIndex;

    @Column(nullable = false)
    private boolean deleted = false;

    @Column(name = "awaiting_qa_approval", nullable = false)
    private boolean awaitingQaApproval = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    @JsonBackReference(value = "column-tasks")
    private ColumnBlock columnBlock;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    public TaskCard() {}

    public TaskCard(String title, String description, Priority priority, LocalDate dueDate, int sequenceIndex, ColumnBlock columnBlock) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
        this.sequenceIndex = sequenceIndex;
        this.columnBlock = columnBlock;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public int getSequenceIndex() {
        return sequenceIndex;
    }

    public void setSequenceIndex(int sequenceIndex) {
        this.sequenceIndex = sequenceIndex;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public boolean isAwaitingQaApproval() {
        return awaitingQaApproval;
    }

    public void setAwaitingQaApproval(boolean awaitingQaApproval) {
        this.awaitingQaApproval = awaitingQaApproval;
    }

    public ColumnBlock getColumnBlock() {
        return columnBlock;
    }

    public void setColumnBlock(ColumnBlock columnBlock) {
        this.columnBlock = columnBlock;
    }

    @Transient
    public Long getColumnId() {
        return columnBlock != null ? columnBlock.getId() : null;
    }

    @Transient
    private Long assigneeId;

    public User getAssignee() {
        return assignee;
    }

    public void setAssignee(User assignee) {
        this.assignee = assignee;
    }

    @Transient
    public Long getAssigneeId() {
        return assignee != null ? assignee.getId() : this.assigneeId;
    }

    public void setAssigneeId(Long assigneeId) {
        this.assigneeId = assigneeId;
    }

    @Transient
    public String getAssigneeName() {
        return assignee != null ? assignee.getUsername() : null;
    }

    @OneToMany(mappedBy = "taskCard", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("taskCard")
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "taskCard", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("taskCard")
    private List<Subtask> subtasks = new ArrayList<>();

    public List<Comment> getComments() { return comments; }
    public void setComments(List<Comment> comments) { this.comments = comments; }
    public List<Subtask> getSubtasks() { return subtasks; }
    public void setSubtasks(List<Subtask> subtasks) { this.subtasks = subtasks; }
}

