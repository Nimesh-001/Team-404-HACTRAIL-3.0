package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.JobPostRequest;
import com.skillbridge.backend.dto.MessageResponse;
import com.skillbridge.backend.entity.JobPost;
import com.skillbridge.backend.service.JobPostService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/jobs")
public class JobPostController {
    @Autowired
    private JobPostService jobPostService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_JOB_POSTER')")
    public ResponseEntity<?> createJob(@Valid @RequestBody JobPostRequest request, Principal principal) {
        try {
            String username = principal.getName();
            JobPost jobPost = jobPostService.createJobPost(request, username);
            return ResponseEntity.ok(jobPost);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<JobPost>> getAllJobs() {
        return ResponseEntity.ok(jobPostService.getAllJobPosts());
    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ROLE_JOB_POSTER')")
    public ResponseEntity<List<JobPost>> getMyJobs(Principal principal) {
        String username = principal.getName();
        return ResponseEntity.ok(jobPostService.getMyJobPosts(username));
    }
}
