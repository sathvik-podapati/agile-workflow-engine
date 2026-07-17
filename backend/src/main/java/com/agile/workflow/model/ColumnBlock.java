package com.agile.workflow.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "column_blocks")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ColumnBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Column name is required")
    @Column(nullable = false)
    private String name;

    @Column(name = "sequence_index", nullable = false)
    private int sequenceIndex;

    @Column(nullable = false)
    private boolean deleted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    @JsonBackReference(value = "workspace-columns")
    private Workspace workspace;

    @OneToMany(mappedBy = "columnBlock", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference(value = "column-tasks")
    @OrderBy("sequenceIndex ASC")
    private List<TaskCard> tasks = new ArrayList<>();

    public ColumnBlock() {}

    public ColumnBlock(String name, int sequenceIndex, Workspace workspace) {
        this.name = name;
        this.sequenceIndex = sequenceIndex;
        this.workspace = workspace;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public Workspace getWorkspace() {
        return workspace;
    }

    public void setWorkspace(Workspace workspace) {
        this.workspace = workspace;
    }

    public List<TaskCard> getTasks() {
        return tasks;
    }

    public void setTasks(List<TaskCard> tasks) {
        this.tasks = tasks;
    }
}

