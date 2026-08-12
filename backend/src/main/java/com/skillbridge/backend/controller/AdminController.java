package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.*;
import com.skillbridge.backend.entity.JobPost;
import com.skillbridge.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{userId}/verify")
    public ResponseEntity<?> setUserVerification(@PathVariable Long userId, @RequestParam boolean status) {
        try {
            adminService.setUserVerification(userId, status);
            return ResponseEntity.ok(new MessageResponse("User verification updated successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<?> setUserStatus(@PathVariable Long userId, @RequestParam boolean active) {
        try {
            adminService.setUserStatus(userId, active);
            String stateStr = active ? "activated" : "suspended";
            return ResponseEntity.ok(new MessageResponse("User account " + stateStr + " successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<JobPost>> getAllJobs() {
        return ResponseEntity.ok(adminService.getAllJobs());
    }

    @PutMapping("/jobs/{jobId}/status")
    public ResponseEntity<?> moderateJob(@PathVariable Long jobId, @RequestParam String status) {
        try {
            adminService.moderateJob(jobId, status);
            return ResponseEntity.ok(new MessageResponse("Job post status updated to " + status + "!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/mentor-programs")
    public ResponseEntity<?> createMentorProgram(@RequestBody com.skillbridge.backend.entity.MentorProgram program) {
        try {
            adminService.createMentorProgram(program);
            return ResponseEntity.ok(new MessageResponse("Mentor program created successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/mentor-applications")
    public ResponseEntity<List<com.skillbridge.backend.entity.MentorApplication>> getAllMentorApplications() {
        return ResponseEntity.ok(adminService.getAllMentorApplications());
    }

    @PutMapping("/mentor-applications/{appId}/status")
    public ResponseEntity<?> moderateMentorApplication(@PathVariable Long appId, @RequestParam String status) {
        try {
            adminService.moderateMentorApplication(appId, status);
            return ResponseEntity.ok(new MessageResponse("Mentor application status updated to " + status + "!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/messages")
    public ResponseEntity<?> sendAdminMessage(@Valid @RequestBody AdminMessageRequest request) {
        try {
            adminService.sendAdminMessage(request.getRecipientId(), request.getMessageContent());
            return ResponseEntity.ok(new MessageResponse("Message sent successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/jobs")
    public ResponseEntity<?> createAdminJob(@Valid @RequestBody JobPostRequest request, java.security.Principal principal) {
        try {
            String username = principal.getName();
            adminService.createAdminJobPost(request, username);
            return ResponseEntity.ok(new MessageResponse(request.getType() + " published successfully by administrator!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/selected-report")
    public ResponseEntity<List<com.skillbridge.backend.entity.JobApplication>> getSelectedReport() {
        return ResponseEntity.ok(adminService.getSelectedReport());
    }
}
