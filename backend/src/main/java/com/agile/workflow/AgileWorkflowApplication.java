package com.agile.workflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.CommandLineRunner;

@SpringBootApplication
public class AgileWorkflowApplication {
    public static void main(String[] args) {
        SpringApplication.run(AgileWorkflowApplication.class, args);
    }

    @Bean
    public CommandLineRunner databaseInitializer(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE comments MODIFY text TEXT");
                System.out.println("--- SUCCESSFULLY ALTERED COMMENTS TEXT COLUMN TO TEXT DATATYPE ---");
            } catch (Exception e) {
                System.err.println("--- DB ALTER ERROR/WARNING: " + e.getMessage());
            }
        };
    }
}

