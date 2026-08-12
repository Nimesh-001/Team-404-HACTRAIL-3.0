package com.skillbridge.backend.controller;

import com.skillbridge.backend.dto.*;
import com.skillbridge.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse response = authService.authenticateUser(loginRequest);
            return ResponseEntity.ok(response);
        } catch (org.springframework.security.authentication.DisabledException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Your account has been suspended by the administrator."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid username/email or password!"));
        }
    }

    @PostMapping("/register/student")
    public ResponseEntity<?> registerStudent(@Valid @RequestBody StudentRegisterRequest registerRequest) {
        try {
            authService.registerStudent(registerRequest);
            return ResponseEntity.ok(new MessageResponse("Student registered successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/register/job-poster")
    public ResponseEntity<?> registerJobPoster(@Valid @RequestBody JobPosterRegisterRequest registerRequest) {
        try {
            authService.registerJobPoster(registerRequest);
            return ResponseEntity.ok(new MessageResponse("Job Poster registered successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
