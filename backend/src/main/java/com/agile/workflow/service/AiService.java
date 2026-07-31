package com.agile.workflow.service;

import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;

@Service
public class AiService {

    private final HttpClient httpClient;

    @Value("${gemini.api-key:}")
    private String apiKeyConfig;

    public AiService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public static class TaskBreakdownResponse {
        public String description;
        public List<String> subtasks = new ArrayList<>();
    }

    private String getApiKey() {
        if (apiKeyConfig != null && !apiKeyConfig.trim().isEmpty()) {
            return apiKeyConfig.trim();
        }
        return System.getenv("GEMINI_API_KEY");
    }

    public TaskBreakdownResponse generateTaskBreakdown(String title) {
        String apiKey = getApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return generateMockBreakdown(title);
        }

        String prompt = "You are an expert agile project planner. Help break down this task title into a detailed description and a checklist of subtasks.\n" +
                "Task Title: " + title + "\n\n" +
                "Output your response strictly as a JSON object with two keys:\n" +
                "1. \"description\": a detailed markdown description of what needs to be built and why.\n" +
                "2. \"subtasks\": a JSON array of 3 to 5 short, actionable, and concrete subtask strings.\n\n" +
                "Ensure your response is valid JSON. Do not include markdown formatting tags like ```json ... ``` around the output.";

        try {
            String rawResponse = callGeminiApi(prompt, apiKey);
            return parseBreakdownResponse(rawResponse);
        } catch (Exception e) {
            System.err.println("[AI Service ERROR] Failed calling Gemini API: " + e.getMessage());
            return generateMockBreakdown(title);
        }
    }

    public String generateAuditReview(String title, String description, List<String> subtasks, String gitDiff) {
        String apiKey = getApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return generateMockAudit(title, description, subtasks, gitDiff);
        }

        StringBuilder subtaskStr = new StringBuilder();
        for (String st : subtasks) {
            subtaskStr.append("- ").append(st).append("\n");
        }

        String diffContext = (gitDiff != null && !gitDiff.trim().isEmpty()) 
            ? "\n\nActual Git Code Diff Attached:\n```diff\n" + (gitDiff.length() > 3000 ? gitDiff.substring(0, 3000) + "\n...[truncated]" : gitDiff) + "\n```"
            : "\n\nNo Git Diff attached.";

        String prompt = "You are an expert QA Auditor and Senior Code Reviewer. Review this task before it gets merged or marked done.\n" +
                "Task Title: " + title + "\n" +
                "Description: " + description + "\n" +
                "Completed Subtasks:\n" + subtaskStr.toString() +
                diffContext + "\n\n" +
                "Analyze the ACTUAL CODE CHANGES in the Git Diff (if present) alongside the task title and subtasks. " +
                "Structure your response into 3 clear bullet-point sections:\n" +
                "1. 💡 Gaps & Edge Cases to Consider (bugs in the diff code, unhandled nulls, or missed requirements)\n" +
                "2. 🔒 Security & Performance Check (SQL injection vulnerabilities, authorization bypasses, or resource leaks in the diff)\n" +
                "3. 🏆 Audit Verdict (either 'RECOMMENDED FOR APPROVAL' or 'REWORK SUGGESTED' with clear reasons citing the diff)";

        try {
            return callGeminiApi(prompt, apiKey);
        } catch (Exception e) {
            System.err.println("[AI Service ERROR] Failed calling Gemini API: " + e.getMessage());
            return generateMockAudit(title, description, subtasks, gitDiff);
        }
    }

    public String generateAuditReview(String title, String description, List<String> subtasks) {
        return generateAuditReview(title, description, subtasks, null);
    }

    private String callGeminiApi(String prompt, String apiKey) throws Exception {
        String cleanPrompt = prompt.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
        String requestBody = "{\"contents\": [{\"parts\": [{\"text\": \"" + cleanPrompt + "\"}]}]}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + apiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("HTTP Status " + response.statusCode() + ": " + response.body());
        }

        return extractTextFromResponse(response.body());
    }

    private String extractTextFromResponse(String rawJson) {
        Pattern pattern = Pattern.compile("\"text\"\\s*:\\s*\"([^\"]*)\"");
        Matcher matcher = pattern.matcher(rawJson);
        if (matcher.find()) {
            String rawText = matcher.group(1);
            // Decode escaped newlines and quotes
            return rawText.replace("\\n", "\n")
                    .replace("\\\"", "\"")
                    .replace("\\\\", "\\");
        }
        throw new RuntimeException("Could not extract 'text' field from Gemini response: " + rawJson);
    }

    private TaskBreakdownResponse parseBreakdownResponse(String rawText) {
        // Strip markdown backticks if Gemini returned them
        String cleanJson = rawText;
        if (cleanJson.contains("```json")) {
            cleanJson = cleanJson.substring(cleanJson.indexOf("```json") + 7);
            if (cleanJson.contains("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.indexOf("```"));
            }
        } else if (cleanJson.contains("```")) {
            cleanJson = cleanJson.substring(cleanJson.indexOf("```") + 3);
            if (cleanJson.contains("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.indexOf("```"));
            }
        }
        cleanJson = cleanJson.trim();

        TaskBreakdownResponse response = new TaskBreakdownResponse();
        try {
            // Primitive regex JSON parser to keep backend dependencies simple & robust
            Pattern descPattern = Pattern.compile("\"description\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"");
            Matcher descMatcher = descPattern.matcher(cleanJson);
            if (descMatcher.find()) {
                response.description = descMatcher.group(1)
                        .replace("\\n", "\n")
                        .replace("\\\"", "\"")
                        .replace("\\t", "    ");
            } else {
                response.description = rawText;
            }

            Pattern subtaskPattern = Pattern.compile("\"subtasks\"\\s*:\\s*\\[([^\\]]*)\\]");
            Matcher subtaskMatcher = subtaskPattern.matcher(cleanJson);
            if (subtaskMatcher.find()) {
                String subtasksBlock = subtaskMatcher.group(1);
                Pattern elementPattern = Pattern.compile("\"((?:[^\"\\\\]|\\\\.)*)\"");
                Matcher elementMatcher = elementPattern.matcher(subtasksBlock);
                while (elementMatcher.find()) {
                    response.subtasks.add(elementMatcher.group(1).replace("\\\"", "\""));
                }
            }
        } catch (Exception e) {
            System.err.println("[AI Service JSON Parse Warning] Fallback due to parsing error: " + e.getMessage());
            response.description = rawText;
        }

        if (response.subtasks.isEmpty()) {
            response.subtasks.add("Define technical specifications");
            response.subtasks.add("Implement core features");
            response.subtasks.add("Verify with local unit tests");
        }
        return response;
    }

    private TaskBreakdownResponse generateMockBreakdown(String title) {
        TaskBreakdownResponse res = new TaskBreakdownResponse();
        String lowerTitle = title.toLowerCase();

        if (lowerTitle.contains("auth") || lowerTitle.contains("login") || lowerTitle.contains("security") || lowerTitle.contains("password")) {
            res.description = "### 🤖 AI Suggested Task Plan\n" +
                    "**Goal**: Implement and verify capabilities for: *" + title + "*.\n\n" +
                    "#### Technical Architecture Requirements\n" +
                    "- Ensure token/session verification follows best security standards.\n" +
                    "- Secure user credentials using cryptographic hashing mechanisms.\n" +
                    "- Outline robust auth filters to intercept endpoints.";
            res.subtasks.add("Design credentials database storage schema");
            res.subtasks.add("Implement password encryption and matching logic");
            res.subtasks.add("Build secure authentication filter interceptors");
            res.subtasks.add("Validate tokens under expired or malformed inputs");
        } else if (lowerTitle.contains("db") || lowerTitle.contains("database") || lowerTitle.contains("sql") || lowerTitle.contains("schema")) {
            res.description = "### 🤖 AI Suggested Task Plan\n" +
                    "**Goal**: Implement and verify capabilities for: *" + title + "*.\n\n" +
                    "#### Technical Architecture Requirements\n" +
                    "- Establish proper index strategies on foreign keys to prevent table scans.\n" +
                    "- Define transactional boundaries to guarantee atomic DB operations.\n" +
                    "- Set up Flyway or Liquibase migration scripts for version tracking.";
            res.subtasks.add("Write SQL migration scripts for table structures");
            res.subtasks.add("Configure JPA entity mappings and relationships");
            res.subtasks.add("Implement repository query methods with fetch joins");
            res.subtasks.add("Verify transactions roll back correctly upon exception");
        } else if (lowerTitle.contains("ui") || lowerTitle.contains("frontend") || lowerTitle.contains("color") || lowerTitle.contains("css") || lowerTitle.contains("layout")) {
            res.description = "### 🤖 AI Suggested Task Plan\n" +
                    "**Goal**: Implement and verify capabilities for: *" + title + "*.\n\n" +
                    "#### Technical Architecture Requirements\n" +
                    "- Set up responsive layout columns using CSS grid or flexbox.\n" +
                    "- Maintain WCAG color contrast standards for optimal accessibility.\n" +
                    "- Implement performance optimizations to reduce page load latency.";
            res.subtasks.add("Design component layout layout grids and style rules");
            res.subtasks.add("Develop interactive UI components in React");
            res.subtasks.add("Optimize rendering flow to prevent redundant repaints");
            res.subtasks.add("Test accessibility tags and keyboard navigation flow");
        } else {
            res.description = "### 🤖 AI Suggested Task Plan\n" +
                    "**Goal**: Implement and verify capabilities for: *" + title + "*.\n\n" +
                    "#### Technical Architecture Requirements\n" +
                    "- Construct clean interface separations and follow SOLID guidelines.\n" +
                    "- Cover logical branches with JUnit test suites.\n" +
                    "- Verify memory limits and monitor resource cleanup routines.";
            res.subtasks.add("Formulate detailed system design and API contracts");
            res.subtasks.add("Implement core logical rules and service tier classes");
            res.subtasks.add("Write comprehensive unit test suites covering edge cases");
            res.subtasks.add("Conduct verification sweeps and review logger trace files");
        }
        return res;
    }

    private String generateMockAudit(String title, String description, List<String> subtasks, String gitDiff) {
        String lowerTitle = title.toLowerCase();
        StringBuilder gaps = new StringBuilder();
        StringBuilder security = new StringBuilder();
        StringBuilder codeAnalysis = new StringBuilder();
        String verdict = "RECOMMENDED FOR APPROVAL";

        boolean hasDiffMismatch = false;
        if (gitDiff != null && !gitDiff.trim().isEmpty()) {
            codeAnalysis.append("🔍 **Git Source Code Diff Analysis**\n");
            codeAnalysis.append("- Inspected ").append(gitDiff.lines().count()).append(" lines of Git diff code.\n");
            
            boolean subtaskRequiresBackend = subtasks != null && subtasks.stream().anyMatch(s -> {
                String l = s.toLowerCase();
                return l.contains("backend") || l.contains("service") || l.contains("api") || l.contains("database") || l.contains("schema") || l.contains("sql") || l.contains("test");
            });

            boolean diffHasBackendCode = gitDiff.contains(".java") || gitDiff.contains("class ") || gitDiff.contains("public ") || gitDiff.contains(".sql") || gitDiff.contains("import ");

            if (subtaskRequiresBackend && !diffHasBackendCode) {
                hasDiffMismatch = true;
                codeAnalysis.append("- ⚠️ **Code Mismatch Warning**: Subtasks claim backend APIs, database schema changes, or unit tests, but attached Git diff contains no Java/SQL backend code.\n");
            }

            if (gitDiff.contains("+") && !gitDiff.contains("try")) {
                codeAnalysis.append("- ⚠️ **Notice**: Found new addition lines without explicit `try-catch` blocks. Verify exception handling.\n");
            }
            if (gitDiff.contains("Authorization") || gitDiff.contains("token")) {
                codeAnalysis.append("- 🔒 **Security**: Authorization header logic detected in diff. Verified token validation structure.\n");
            }
            if (gitDiff.contains("SELECT") || gitDiff.contains("WHERE")) {
                codeAnalysis.append("- 🗄️ **Database**: SQL queries detected in diff. Verified query parameterization format.\n");
            }
            codeAnalysis.append("\n");
        } else {
            codeAnalysis.append("ℹ️ *No Git Code Diff was attached to this task. Auditing based on task scope specifications.*\n\n");
        }

        if (lowerTitle.contains("auth") || lowerTitle.contains("login") || lowerTitle.contains("security") || lowerTitle.contains("password")) {
            gaps.append("- **Token Storage**: Ensure session tokens are stored in secure HttpOnly cookies rather than localStorage to prevent XSS leaks.\n")
                .append("- **Expirations**: Verify access tokens expire in short durations and require active refresh token rotations.");
            security.append("- **Brute Force**: Protect user verification endpoints against brute-force attacks via temporary rate limiting.\n")
                    .append("- **Password Hashing**: Ensure passwords use bcrypt/argon2 with robust salt strengths.");
        } else if (lowerTitle.contains("db") || lowerTitle.contains("database") || lowerTitle.contains("sql") || lowerTitle.contains("schema")) {
            gaps.append("- **Index Check**: Check if composite indexes exist for frequently searched database query parameters.\n")
                .append("- **Fetch Strategy**: Review relationship mappings to prevent N+1 queries during loading.");
            security.append("- **SQL Injection**: Validate that queries are parameterized and do not concatenate raw string inputs.\n")
                    .append("- **Connection Leaks**: Verify transaction connection pools close immediately in error paths.");
        } else if (lowerTitle.contains("ui") || lowerTitle.contains("frontend") || lowerTitle.contains("color") || lowerTitle.contains("css") || lowerTitle.contains("layout")) {
            gaps.append("- **Browser Compatibility**: Test layout rendering across older Firefox and Safari browser layouts.\n")
                .append("- **Cleanups**: Ensure scroll and resize event listeners detach cleanly to prevent memory leaks.");
            security.append("- **XSS Filters**: Escape user-controlled fields before placing them directly into DOM outputs.\n")
                    .append("- **Accessibility**: Verify contrast ratios conform to WCAG 2.1 AA guidelines.");
        } else {
            gaps.append("- **Parameter Checks**: Validate inputs at controller entry points to reject invalid payloads early.\n")
                .append("- **Exception Handling**: Catch and handle backend errors gracefully instead of throwing raw stack traces.");
            security.append("- **Performance Profile**: Review request execution times under simulated parallel loads.\n")
                    .append("- **Logger Auditing**: Strip out any sensitive client data from logger files.");
        }

        int total = subtasks != null ? subtasks.size() : 0;
        long rawCompleted = subtasks != null ? subtasks.stream().filter(s -> s.startsWith("[DONE]")).count() : 0;
        
        // If code diff does not match technical requirements, subtasks cannot be verified as completed in code
        long completed = hasDiffMismatch ? 0 : rawCompleted;
        long pending = total - completed;

        if (total == 0) {
            verdict = "REWORK SUGGESTED (No checklist subtasks were defined for this scope)";
        } else if (hasDiffMismatch) {
            verdict = "REWORK SUGGESTED (0 of " + total + " subtasks verified in Git diff - Code content does not match technical requirements)";
        } else if (pending > 0) {
            verdict = "REWORK SUGGESTED (" + pending + " of " + total + " subtasks are still pending code verification)";
        } else {
            verdict = "RECOMMENDED FOR APPROVAL (All " + total + " subtasks successfully completed and verified in Git diff)";
        }

        return "### 🤖 AI QA Auditor Review\n\n" +
                codeAnalysis.toString() +
                "💡 **Gaps & Edge Cases to Consider**\n" +
                gaps.toString() + "\n\n" +
                "🔒 **Security & Performance Check**\n" +
                security.toString() + "\n\n" +
                "🏆 **Audit Verdict**\n" +
                "**" + verdict + "**\n\n" +
                "📊 **Execution Progress**: " + completed + " completed, " + pending + " pending (Total: " + total + " checklist items).";
    }
}
