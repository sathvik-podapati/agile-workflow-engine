package com.agile.workflow.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "subtasks")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Subtask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Subtask title is required")
    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private boolean completed = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_card_id", nullable = false)
    @JsonIgnoreProperties("subtasks")
    private TaskCard taskCard;

    public Subtask() {}

    public Subtask(String title, TaskCard taskCard) {
        this.title = title;
        this.taskCard = taskCard;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public TaskCard getTaskCard() { return taskCard; }
    public void setTaskCard(TaskCard taskCard) { this.taskCard = taskCard; }
}
