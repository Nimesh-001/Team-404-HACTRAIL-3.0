package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.*;
import com.skillbridge.backend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    @Autowired
    private ProfileService profileService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(Principal principal) {
        String username = principal.getName();
        return ResponseEntity.ok(profileService.getProfile(username));
    }

    @PutMapping("/student")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<?> updateStudentProfile(@Valid @RequestBody StudentProfileUpdateRequest request, Principal principal) {
        try {
            String username = principal.getName();
            profileService.updateStudentProfile(username, request);
            return ResponseEntity.ok(new MessageResponse("Student profile updated successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/job-poster")
    @PreAuthorize("hasAuthority('ROLE_JOB_POSTER')")
    public ResponseEntity<?> updateJobPosterProfile(@Valid @RequestBody JobPosterProfileUpdateRequest request, Principal principal) {
        try {
            String username = principal.getName();
            profileService.updateJobPosterProfile(username, request);
            return ResponseEntity.ok(new MessageResponse("Job poster profile updated successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
