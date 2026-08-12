package com.skillbridge.backend.service;

import com.skillbridge.backend.dto.*;
import com.skillbridge.backend.entity.*;
import com.skillbridge.backend.repository.*;
import com.skillbridge.backend.security.JwtUtils;
import com.skillbridge.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private JobPosterProfileRepository jobPosterProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Transactional
    public User registerStudent(StudentRegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail()) || userRepository.existsByUsername(req.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User(
                req.getEmail(), // Use email as username
                req.getEmail(),
                passwordEncoder.encode(req.getPassword()),
                Role.ROLE_STUDENT,
                req.getFullName(),
                req.getPhone()
        );

        User savedUser = userRepository.save(user);

        StudentProfile studentProfile = new StudentProfile(
                savedUser,
                req.getStudentId()
        );

        studentProfileRepository.save(studentProfile);
        return savedUser;
    }

    @Transactional
    public User registerJobPoster(JobPosterRegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail()) || userRepository.existsByUsername(req.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User(
                req.getEmail(), // Use email as username
                req.getEmail(),
                passwordEncoder.encode(req.getPassword()),
                Role.ROLE_JOB_POSTER,
                req.getFullName(),
                req.getPhone()
        );

        User savedUser = userRepository.save(user);

        JobPosterProfile posterProfile = new JobPosterProfile(
                savedUser
        );

        jobPosterProfileRepository.save(posterProfile);
        return savedUser;
    }

    public AuthResponse authenticateUser(LoginRequest req) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        return new AuthResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                role,
                userDetails.getFullName()
        );
    }
}
